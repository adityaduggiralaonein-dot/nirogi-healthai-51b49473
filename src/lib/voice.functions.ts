import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TTS_URL = "https://ai.gateway.lovable.dev/v1/audio/speech";
const STT_URL = "https://ai.gateway.lovable.dev/v1/audio/transcriptions";

/** Text-to-speech for the SenseCheck voice test. Returns base64 MP3. */
export const speakText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        text: z.string().min(1).max(800),
        voice: z.string().max(40).optional(),
        speed: z.number().min(0.5).max(2).optional(),
        instructions: z.string().max(400).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI is not configured.");
    const res = await fetch(TTS_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini-tts",
        input: data.text,
        voice: data.voice || "alloy",
        response_format: "mp3",
        speed: data.speed ?? 1,
        ...(data.instructions ? { instructions: data.instructions } : {}),
      }),
    });
    if (res.status === 429) throw new Error("RATE_LIMIT");
    if (res.status === 402) throw new Error("CREDITS_EXHAUSTED");
    if (!res.ok) {
      console.error("TTS error", res.status, await res.text().catch(() => ""));
      throw new Error("AI_ERROR");
    }
    const buf = await res.arrayBuffer();
    const base64 = Buffer.from(buf).toString("base64");
    return { audio: base64 };
  });

/** Speech-to-text for the SenseCheck hearing repeat-back. */
export const transcribeAudio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ audio: z.string().min(10).max(12_000_000), mime: z.string().max(60).optional() }).parse(input),
  )
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI is not configured.");

    const mime = data.mime || "audio/wav";
    const ext = mime.includes("wav") ? "wav" : mime.includes("mp4") ? "mp4" : mime.includes("mpeg") ? "mp3" : "webm";
    const bytes = Buffer.from(data.audio, "base64");
    const blob = new Blob([bytes], { type: mime });

    const form = new FormData();
    form.append("model", "openai/gpt-4o-mini-transcribe");
    form.append("file", blob, `recording.${ext}`);

    const res = await fetch(STT_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: form,
    });
    if (res.status === 429) throw new Error("RATE_LIMIT");
    if (res.status === 402) throw new Error("CREDITS_EXHAUSTED");
    if (!res.ok) {
      console.error("STT error", res.status, await res.text().catch(() => ""));
      throw new Error("AI_ERROR");
    }
    const json = await res.json().catch(() => ({}));
    return { text: (json?.text as string) ?? "" };
  });
