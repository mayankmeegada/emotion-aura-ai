export type EmotionLabel =
  | "happy" | "sad" | "angry" | "fearful" | "surprised" | "neutral" | "disgusted";

export const EMOTIONS: EmotionLabel[] = [
  "happy", "sad", "angry", "fearful", "surprised", "neutral", "disgusted",
];

export const EMOTION_EMOJI: Record<EmotionLabel, string> = {
  happy: "😄", sad: "😢", angry: "😠", fearful: "😨",
  surprised: "😲", neutral: "😐", disgusted: "🤢",
};

export const EMOTION_COLOR: Record<EmotionLabel, string> = {
  happy: "#ffd166", sad: "#4cc9f0", angry: "#ef476f", fearful: "#9b5de5",
  surprised: "#f15bb5", neutral: "#a0aec0", disgusted: "#06d6a0",
};

export type Sample = {
  t: number;
  label: EmotionLabel;
  confidence: number;
  scores: Record<EmotionLabel, number>;
};

const KEY = "emovision.history.v1";

export function loadHistory(): Sample[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}

export function pushSamples(samples: Sample[]) {
  if (typeof window === "undefined" || samples.length === 0) return;
  const cur = loadHistory();
  const next = [...cur, ...samples].slice(-2000);
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function clearHistory() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
