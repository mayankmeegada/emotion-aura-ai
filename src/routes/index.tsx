import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Nav } from "@/components/Nav";
import { EMOTIONS, EMOTION_EMOJI, EMOTION_COLOR } from "@/lib/emotion-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EmoVision AI — Real-time emotion recognition" },
      { name: "description", content: "Detect happiness, stress, focus and 7+ emotions live from your webcam. Beautiful analytics included." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen">
      <Nav />
      <Hero />
      <Features />
      <HowItWorks />
      <UseCases />
      <FAQ />
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative px-4 pt-16 pb-28">
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      <div className="relative mx-auto max-w-5xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-mono text-foreground/70"
        >
          <span className="size-1.5 rounded-full bg-[var(--neon)] animate-pulse" />
          live · on-device · 60fps inference
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.05 }}
          className="mt-6 text-5xl font-bold leading-[1.05] md:text-7xl"
        >
          Read the room.<br />
          <span className="neon-text">In real time.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.15 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-foreground/70"
        >
          EmoVision AI turns any camera into an emotional intelligence engine.
          Detect 7 core emotions, track engagement, surface stress — all on-device, all in your browser.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
        >
          <Link to="/detect" className="btn-hero">Try live detection</Link>
          <Link to="/dashboard" className="btn-ghost">View dashboard</Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.35 }}
          className="relative mx-auto mt-16 max-w-3xl"
        >
          <div className="glass neon-ring rounded-3xl p-6">
            <div className="flex items-center justify-between text-xs font-mono text-foreground/60">
              <span>session.live</span>
              <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-[var(--neon)]" /> streaming</span>
            </div>
            <div className="mt-4 grid grid-cols-7 gap-2">
              {EMOTIONS.map((e, i) => (
                <motion.div
                  key={e}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.05 }}
                  className="rounded-xl border border-border bg-card/50 p-3 text-center"
                >
                  <div className="text-2xl">{EMOTION_EMOJI[e]}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-wider text-foreground/60">{e}</div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/5">
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${20 + (i*13)%70}%` }}
                      transition={{ duration: 1, delay: 0.6 + i*0.05 }}
                      style={{ background: EMOTION_COLOR[e] }}
                      className="h-full rounded-full"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { t: "On-device inference", d: "Frames never leave the browser. Zero-latency, privacy-first.", e: "⚡" },
    { t: "Multi-face tracking", d: "Detects every face in frame with bounding boxes and scores.", e: "🎯" },
    { t: "Engagement & stress", d: "Derived signals for focus, fatigue and stress from micro-expressions.", e: "🧠" },
    { t: "Beautiful analytics", d: "Timeline, distribution and session reports out of the box.", e: "📈" },
    { t: "Export-ready", d: "Save session JSON or hand off to your downstream pipeline.", e: "📦" },
    { t: "Production stack", d: "React + TanStack + Tailwind. Edge-ready, fully typed.", e: "🛠" },
  ];
  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold md:text-5xl">Built for the <span className="neon-text">human signal</span>.</h2>
        <p className="mt-3 max-w-xl text-foreground/70">Everything you need to ship emotion-aware experiences without a backend.</p>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {items.map((f, i) => (
            <motion.div key={f.t}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="glass rounded-2xl p-6 transition-all hover:-translate-y-1 hover:neon-ring"
            >
              <div className="text-2xl">{f.e}</div>
              <h3 className="mt-3 text-lg font-semibold">{f.t}</h3>
              <p className="mt-2 text-sm text-foreground/70">{f.d}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", t: "Capture", d: "WebRTC streams frames straight from your camera at 30+ fps." },
    { n: "02", t: "Detect", d: "A tiny CNN locates faces and runs a 7-class emotion classifier per frame." },
    { n: "03", t: "Visualize", d: "Live overlays, confidence bars and a session-long analytics timeline." },
  ];
  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold md:text-5xl">How it works</h2>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div key={s.n}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="glass rounded-2xl p-8"
            >
              <div className="font-mono text-sm text-[var(--neon)]">{s.n}</div>
              <h3 className="mt-3 text-2xl font-semibold">{s.t}</h3>
              <p className="mt-2 text-foreground/70">{s.d}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function UseCases() {
  const cases = [
    "Remote learning attention",
    "Driver fatigue monitoring",
    "UX research labs",
    "Live event sentiment",
    "Customer support QA",
    "Mental wellness apps",
  ];
  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-6xl glass rounded-3xl p-10">
        <h2 className="text-3xl font-bold md:text-4xl">Where teams ship it</h2>
        <div className="mt-8 flex flex-wrap gap-3">
          {cases.map((c) => (
            <span key={c} className="rounded-full border border-border bg-card/50 px-4 py-2 text-sm">{c}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const qa = [
    { q: "Does it send my video anywhere?", a: "No. Everything runs in your browser via WebGL. No frames ever leave your device." },
    { q: "Which emotions are supported?", a: "Happy, sad, angry, fearful, surprised, neutral and disgusted, plus derived stress and engagement." },
    { q: "Can I use this in production?", a: "Yes — the UI is production-grade. Swap the in-browser model for your own API if you need higher accuracy." },
  ];
  return (
    <section className="px-4 py-24">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-3xl font-bold md:text-5xl">FAQ</h2>
        <div className="mt-8 space-y-3">
          {qa.map((x) => (
            <details key={x.q} className="glass group rounded-2xl p-5">
              <summary className="cursor-pointer list-none font-semibold flex items-center justify-between">
                {x.q}
                <span className="text-[var(--neon)] transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-foreground/70">{x.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border px-4 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-foreground/60 md:flex-row">
        <div>© {new Date().getFullYear()} EmoVision AI</div>
        <div className="font-mono">crafted with neurons & neon</div>
      </div>
    </footer>
  );
}
