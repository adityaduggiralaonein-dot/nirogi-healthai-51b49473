// Server-only helpers for the AI Doctor system. Never import from client code.

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

export type DoctorTurn = { role: "user" | "assistant"; content: string };

/** Plain-text doctor chat reply via the Lovable AI Gateway. */
export async function callDoctorAI(opts: {
  system: string;
  profileText: string;
  history: DoctorTurn[];
  message: string;
  lang?: "en" | "hi";
}): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("AI is not configured. Missing LOVABLE_API_KEY.");

  const langInstruction =
    opts.lang === "hi"
      ? " Reply in simple, everyday Hindi (Devanagari script). Keep medicine and test names recognisable."
      : "";

  const messages = [
    { role: "system", content: `${opts.system}\n\n${opts.profileText}${langInstruction}` },
    ...opts.history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: opts.message },
  ];

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "google/gemini-2.5-flash", messages }),
  });

  if (res.status === 429) throw new Error("RATE_LIMIT");
  if (res.status === 402) throw new Error("CREDITS_EXHAUSTED");
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("Doctor AI gateway error", res.status, text);
    throw new Error("AI_ERROR");
  }

  const data = await res.json();
  const reply: string = data?.choices?.[0]?.message?.content ?? "";
  return reply.trim() || "I'm sorry, I couldn't form a reply just now. Please try again.";
}

/** ElevenLabs TTS — returns a base64 mp3 data URL for a doctor's voice. */
export async function speakWithElevenLabs(text: string, voiceId: string): Promise<string> {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error("VOICE_NOT_CONFIGURED");

  const clipped = text.slice(0, 800); // keep within free character limits
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        text: clipped,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    },
  );

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    console.error("ElevenLabs error", res.status, t);
    throw new Error("VOICE_ERROR");
  }

  const buf = Buffer.from(await res.arrayBuffer());
  return `data:audio/mpeg;base64,${buf.toString("base64")}`;
}
