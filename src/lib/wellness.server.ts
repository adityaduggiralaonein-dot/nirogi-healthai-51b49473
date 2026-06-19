// Server-only helper for AI sleep analysis via the Lovable AI Gateway.
// Never import this from client code paths.

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export async function analyzeSleepAI(opts: {
  durationMin: number;
  bedtime: string;
  wake: string;
  notes: string;
  lang: "en" | "hi";
}): Promise<{ score: number; summary: string; tips: string[]; flags: string[] }> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI is not configured.");

  const hours = (opts.durationMin / 60).toFixed(1);
  const langInstruction =
    opts.lang === "hi"
      ? " Write summary, tips and flags in simple everyday Hindi (Devanagari script). Keep JSON keys in English."
      : "";

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `You are a sleep-quality educator. Given last night's sleep, produce a JSON sleep report.
Return ONLY valid JSON (no markdown) with this shape:
{ "score": number (0-100 sleep quality), "summary": string (2 sentences, plain language), "tips": string[] (3-4 practical tips), "flags": string[] (any warning signs like very short/long sleep, irregular timing, or snoring/apnea concerns from notes; empty if none) }.${langInstruction}`,
        },
        {
          role: "user",
          content: `Last night: slept ${hours} hours (bedtime ${opts.bedtime}, woke ${opts.wake}). Notes from the user about how they slept / sounds recorded: ${opts.notes || "none"}. Adults need ~7-9 hours.`,
        },
      ],
    }),
  });

  if (!res.ok) throw new Error("AI_ERROR");
  const data = await res.json();
  const raw: string = data?.choices?.[0]?.message?.content ?? "";
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  let parsed: { score?: number; summary?: string; tips?: string[]; flags?: string[] };
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    parsed = m ? JSON.parse(m[0]) : {};
  }
  return {
    score: typeof parsed.score === "number" ? Math.max(0, Math.min(100, parsed.score)) : 70,
    summary: parsed.summary ?? "",
    tips: Array.isArray(parsed.tips) ? parsed.tips : [],
    flags: Array.isArray(parsed.flags) ? parsed.flags : [],
  };
}
