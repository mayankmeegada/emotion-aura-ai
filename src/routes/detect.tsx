import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Nav } from "@/components/Nav";
import {
  EMOTIONS, EMOTION_COLOR, EMOTION_EMOJI, pushSamples,
  type EmotionLabel, type Sample,
} from "@/lib/emotion-store";

export const Route = createFileRoute("/detect")({
  head: () => ({ meta: [{ title: "Live detection · EmoVision AI" }] }),
  component: DetectPage,
});

const MODEL_URL = "https://justadudewhohacks.github.io/face-api.js/models";
const FACEAPI_SRC = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/dist/face-api.min.js";

declare global { interface Window { faceapi?: any } }

function loadFaceApi(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject("ssr");
  if (window.faceapi) return Promise.resolve(window.faceapi);
  return new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = FACEAPI_SRC; s.async = true;
    s.onload = () => window.faceapi ? res(window.faceapi) : rej("faceapi missing");
    s.onerror = () => rej("script failed");
    document.head.appendChild(s);
  });
}

type FaceResult = {
  box: { x: number; y: number; width: number; height: number };
  expressions: Record<EmotionLabel, number>;
};

function DetectPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const bufferRef = useRef<Sample[]>([]);
  const lastFlushRef = useRef<number>(0);

  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "running" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [faces, setFaces] = useState<FaceResult[]>([]);
  const [fps, setFps] = useState(0);
  const fpsRef = useRef<{ frames: number; t0: number }>({ frames: 0, t0: performance.now() });

  useEffect(() => () => stop(), []);

  async function start() {
    try {
      setStatus("loading");
      const faceapi = await loadFaceApi();
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" }, audio: false,
      });
      const v = videoRef.current!;
      v.srcObject = stream;
      await v.play();

      setStatus("running");
      loop(faceapi);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e?.message ?? String(e));
      setStatus("error");
    }
  }

  function stop() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    const v = videoRef.current;
    const s = v?.srcObject as MediaStream | null;
    s?.getTracks().forEach(t => t.stop());
    if (v) v.srcObject = null;
    flushBuffer();
    setStatus("idle");
    setFaces([]);
  }

  function flushBuffer() {
    if (bufferRef.current.length) {
      pushSamples(bufferRef.current);
      bufferRef.current = [];
    }
  }

  async function loop(faceapi: any) {
    const v = videoRef.current!;
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 });

    const tick = async () => {
      if (!v.videoWidth) { rafRef.current = requestAnimationFrame(tick); return; }
      c.width = v.videoWidth; c.height = v.videoHeight;

      const results = await faceapi.detectAllFaces(v, options).withFaceExpressions();

      ctx.clearRect(0, 0, c.width, c.height);
      const next: FaceResult[] = [];
      for (const r of results) {
        const { x, y, width, height } = r.detection.box;
        ctx.strokeStyle = "rgba(120, 240, 255, 0.9)";
        ctx.lineWidth = 2;
        ctx.shadowColor = "rgba(120, 240, 255, 0.7)";
        ctx.shadowBlur = 12;
        ctx.strokeRect(x, y, width, height);
        ctx.shadowBlur = 0;

        const exprs = r.expressions as Record<EmotionLabel, number>;
        const top = (Object.entries(exprs) as [EmotionLabel, number][])
          .sort((a, b) => b[1] - a[1])[0];
        ctx.fillStyle = "rgba(8, 12, 24, 0.75)";
        const label = `${EMOTION_EMOJI[top[0]]} ${top[0]} ${(top[1]*100).toFixed(0)}%`;
        ctx.font = "600 14px Inter, system-ui";
        const tw = ctx.measureText(label).width + 12;
        ctx.fillRect(x, Math.max(0, y - 24), tw, 22);
        ctx.fillStyle = "#e6fbff";
        ctx.fillText(label, x + 6, Math.max(14, y - 8));

        next.push({ box: { x, y, width, height }, expressions: exprs });
      }
      setFaces(next);

      // sampling: store one sample per face per ~500ms
      const now = Date.now();
      if (now - lastFlushRef.current > 500 && next.length) {
        for (const f of next) {
          const entries = Object.entries(f.expressions) as [EmotionLabel, number][];
          const top = entries.sort((a, b) => b[1] - a[1])[0];
          bufferRef.current.push({
            t: now, label: top[0], confidence: top[1],
            scores: f.expressions,
          });
        }
        lastFlushRef.current = now;
        if (bufferRef.current.length >= 20) flushBuffer();
      }

      // fps
      const fr = fpsRef.current; fr.frames++;
      const dt = performance.now() - fr.t0;
      if (dt > 500) {
        setFps(Math.round((fr.frames * 1000) / dt));
        fr.frames = 0; fr.t0 = performance.now();
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  const primary = faces[0];
  const sortedExpr = primary
    ? (Object.entries(primary.expressions) as [EmotionLabel, number][]).sort((a, b) => b[1] - a[1])
    : EMOTIONS.map(e => [e, 0] as [EmotionLabel, number]);
  const topLabel = sortedExpr[0]?.[0];

  const stress = primary
    ? Math.min(1, (primary.expressions.angry + primary.expressions.fearful + primary.expressions.disgusted))
    : 0;
  const engagement = primary
    ? Math.min(1, (primary.expressions.happy + primary.expressions.surprised + (1 - primary.expressions.neutral) * 0.4))
    : 0;

  return (
    <div className="min-h-screen">
      <Nav />
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold md:text-4xl">Live emotion detection</h1>
            <p className="mt-2 text-foreground/70">All inference happens on-device. Allow camera to begin.</p>
          </div>
          <div className="flex items-center gap-2">
            {status !== "running" ? (
              <button className="btn-hero" onClick={start} disabled={status === "loading"}>
                {status === "loading" ? "Loading model…" : "Start camera"}
              </button>
            ) : (
              <button className="btn-ghost" onClick={stop}>Stop</button>
            )}
          </div>
        </div>

        {status === "error" && (
          <div className="mt-6 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm">
            Couldn't start camera: {errorMsg}
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="glass relative overflow-hidden rounded-3xl neon-ring">
            <div className="relative aspect-[4/3] w-full bg-black/60">
              <video ref={videoRef} playsInline muted className="absolute inset-0 size-full -scale-x-100 object-cover" />
              <canvas ref={canvasRef} className="absolute inset-0 size-full -scale-x-100" />
              {status === "idle" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <div className="text-6xl">🎥</div>
                  <p className="mt-3 text-foreground/70">Camera off. Hit start to begin.</p>
                </div>
              )}
              {status === "loading" && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="size-10 animate-spin rounded-full border-2 border-[var(--neon)] border-t-transparent" />
                </div>
              )}
              <div className="absolute left-4 top-4 flex items-center gap-3 rounded-full glass px-3 py-1.5 text-xs font-mono">
                <span className={`size-1.5 rounded-full ${status === "running" ? "bg-[var(--neon)] animate-pulse" : "bg-foreground/30"}`} />
                {status === "running" ? `live · ${fps} fps · ${faces.length} face${faces.length===1?"":"s"}` : "standby"}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="glass rounded-2xl p-5">
              <div className="text-xs font-mono uppercase text-foreground/60">Primary emotion</div>
              <AnimatePresence mode="wait">
                <motion.div key={topLabel ?? "none"}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  className="mt-2 flex items-center gap-3"
                >
                  <span className="text-5xl">{topLabel ? EMOTION_EMOJI[topLabel] : "—"}</span>
                  <div>
                    <div className="text-2xl font-bold capitalize">{topLabel ?? "no face"}</div>
                    <div className="text-sm text-foreground/60">
                      {primary ? `${(sortedExpr[0][1]*100).toFixed(1)}% confidence` : "waiting for input"}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="glass rounded-2xl p-5">
              <div className="text-xs font-mono uppercase text-foreground/60">Distribution</div>
              <div className="mt-3 space-y-2.5">
                {sortedExpr.map(([k, v]) => (
                  <div key={k}>
                    <div className="flex justify-between text-xs">
                      <span className="capitalize text-foreground/80">{EMOTION_EMOJI[k]} {k}</span>
                      <span className="font-mono text-foreground/60">{(v * 100).toFixed(0)}%</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/5">
                      <motion.div
                        animate={{ width: `${v * 100}%` }}
                        transition={{ type: "spring", stiffness: 120, damping: 20 }}
                        style={{ background: EMOTION_COLOR[k] }}
                        className="h-full rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Metric label="Engagement" value={engagement} color="var(--neon)" />
              <Metric label="Stress" value={stress} color="var(--neon-2)" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.round(value * 100);
  return (
    <div className="glass rounded-2xl p-5">
      <div className="text-xs font-mono uppercase text-foreground/60">{label}</div>
      <div className="mt-1 text-3xl font-bold">{pct}%</div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
        <motion.div animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }}
          style={{ background: color }} className="h-full rounded-full" />
      </div>
    </div>
  );
}
