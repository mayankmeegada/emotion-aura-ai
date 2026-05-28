import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar, CartesianGrid,
} from "recharts";
import { Nav } from "@/components/Nav";
import {
  EMOTIONS, EMOTION_COLOR, EMOTION_EMOJI,
  loadHistory, clearHistory, type EmotionLabel, type Sample,
} from "@/lib/emotion-store";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · EmoVision AI" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const [samples, setSamples] = useState<Sample[]>([]);
  useEffect(() => { setSamples(loadHistory()); }, []);

  const counts = useMemo(() => {
    const c: Record<EmotionLabel, number> = Object.fromEntries(EMOTIONS.map(e => [e, 0])) as any;
    samples.forEach(s => { c[s.label]++; });
    return c;
  }, [samples]);

  const pieData = EMOTIONS.map(e => ({ name: e, value: counts[e] })).filter(d => d.value > 0);
  const barData = EMOTIONS.map(e => ({ name: e, count: counts[e] }));

  const timeline = useMemo(() => {
    if (!samples.length) return [];
    // bucket into ~30 points
    const first = samples[0].t, last = samples[samples.length-1].t;
    const span = Math.max(1000, last - first);
    const buckets = 30, w = span / buckets;
    const out: any[] = Array.from({ length: buckets }, (_, i) => {
      const row: any = { t: i };
      EMOTIONS.forEach(e => { row[e] = 0; });
      return row;
    });
    samples.forEach(s => {
      const idx = Math.min(buckets - 1, Math.floor((s.t - first) / w));
      out[idx][s.label] += 1;
    });
    return out;
  }, [samples]);

  const dominant = (Object.entries(counts) as [EmotionLabel, number][])
    .sort((a, b) => b[1] - a[1])[0];

  const insights = useMemo(() => buildInsights(samples, counts), [samples, counts]);

  function reset() { clearHistory(); setSamples([]); }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(samples, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `emovision-session-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen">
      <Nav />
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold md:text-4xl">Session analytics</h1>
            <p className="mt-2 text-foreground/70">
              {samples.length ? `${samples.length} samples · dominant ${EMOTION_EMOJI[dominant[0]]} ${dominant[0]}` : "No data yet — run a live session to populate this dashboard."}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={exportJSON} disabled={!samples.length}>Export JSON</button>
            <button className="btn-ghost" onClick={reset} disabled={!samples.length}>Clear</button>
          </div>
        </div>

        {!samples.length ? (
          <div className="mt-10 glass rounded-3xl p-12 text-center">
            <div className="text-5xl">📊</div>
            <p className="mt-3 text-foreground/70">Head to <a href="/detect" className="text-[var(--neon)] underline">Live Detect</a> and let it run for a few seconds.</p>
          </div>
        ) : (
          <>
            <div className="mt-8 grid gap-4 md:grid-cols-4">
              <Stat label="Samples" value={samples.length.toString()} />
              <Stat label="Dominant" value={`${EMOTION_EMOJI[dominant[0]]} ${dominant[0]}`} />
              <Stat label="Avg confidence" value={`${Math.round(avgConfidence(samples)*100)}%`} />
              <Stat label="Session" value={fmtDuration(samples)} />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[2fr,1fr]">
              <div className="glass rounded-2xl p-5">
                <div className="text-xs font-mono uppercase text-foreground/60">Emotion timeline</div>
                <div className="mt-4 h-64">
                  <ResponsiveContainer>
                    <AreaChart data={timeline}>
                      <defs>
                        {EMOTIONS.map(e => (
                          <linearGradient key={e} id={`g-${e}`} x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor={EMOTION_COLOR[e]} stopOpacity={0.7} />
                            <stop offset="100%" stopColor={EMOTION_COLOR[e]} stopOpacity={0} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="t" hide />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} />
                      <Tooltip contentStyle={{ background: "rgba(20,24,40,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
                      {EMOTIONS.map(e => (
                        <Area key={e} type="monotone" dataKey={e} stackId="1"
                          stroke={EMOTION_COLOR[e]} fill={`url(#g-${e})`} />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass rounded-2xl p-5">
                <div className="text-xs font-mono uppercase text-foreground/60">Distribution</div>
                <div className="mt-2 h-64">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                        {pieData.map((d) => <Cell key={d.name} fill={EMOTION_COLOR[d.name as EmotionLabel]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "rgba(20,24,40,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr,1fr]">
              <div className="glass rounded-2xl p-5">
                <div className="text-xs font-mono uppercase text-foreground/60">Frequency</div>
                <div className="mt-4 h-56">
                  <ResponsiveContainer>
                    <BarChart data={barData}>
                      <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} />
                      <Tooltip contentStyle={{ background: "rgba(20,24,40,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }} />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                        {barData.map(d => <Cell key={d.name} fill={EMOTION_COLOR[d.name as EmotionLabel]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="glass rounded-2xl p-5">
                <div className="text-xs font-mono uppercase text-foreground/60">AI insights</div>
                <ul className="mt-4 space-y-3">
                  {insights.map((i, idx) => (
                    <li key={idx} className="flex gap-3 text-sm">
                      <span className="text-[var(--neon)]">◆</span>
                      <span className="text-foreground/80">{i}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="text-xs font-mono uppercase text-foreground/60">{label}</div>
      <div className="mt-1 text-2xl font-bold capitalize">{value}</div>
    </div>
  );
}

function avgConfidence(s: Sample[]) {
  return s.reduce((a, b) => a + b.confidence, 0) / s.length;
}
function fmtDuration(s: Sample[]) {
  if (s.length < 2) return "—";
  const sec = Math.round((s[s.length-1].t - s[0].t) / 1000);
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec/60)}m ${sec%60}s`;
}

function buildInsights(samples: Sample[], counts: Record<EmotionLabel, number>): string[] {
  if (!samples.length) return [];
  const total = samples.length;
  const pct = (e: EmotionLabel) => (counts[e] / total) * 100;
  const out: string[] = [];

  const happy = pct("happy"), neutral = pct("neutral");
  const stress = pct("angry") + pct("fearful") + pct("disgusted");
  const engagement = happy + pct("surprised");

  out.push(`Engagement averaged ${engagement.toFixed(0)}% across the session.`);
  if (stress > 25) out.push(`Elevated stress signals detected (${stress.toFixed(0)}%). Consider a short break.`);
  if (neutral > 60) out.push(`Mostly neutral expression — viewer attention may be passive.`);
  if (happy > 40) out.push(`Strong positive response — ${happy.toFixed(0)}% happy frames.`);
  if (pct("surprised") > 15) out.push(`Notable spikes of surprise suggest moments of novelty or impact.`);
  return out.slice(0, 5);
}
