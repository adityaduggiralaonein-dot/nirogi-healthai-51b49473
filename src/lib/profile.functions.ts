import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ProfileInput = z.object({
  full_name: z.string().max(120).optional().nullable(),
  age: z.number().int().min(0).max(130).optional().nullable(),
  gender: z.string().max(30).optional().nullable(),
  blood_group: z.string().max(10).optional().nullable(),
  weight_kg: z.number().min(0).max(500).optional().nullable(),
  height_cm: z.number().min(0).max(300).optional().nullable(),
  health_conditions: z.string().max(4000).optional().nullable(),
  current_medicines: z.string().max(4000).optional().nullable(),
  family_history: z.string().max(4000).optional().nullable(),
  recent_surgeries: z.string().max(4000).optional().nullable(),
  allergies: z.string().max(2000).optional().nullable(),
});

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    return { profile: data };
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ProfileInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    let bmi: number | null = null;
    if (data.weight_kg && data.height_cm) {
      const m = data.height_cm / 100;
      if (m > 0) bmi = Math.round((data.weight_kg / (m * m)) * 10) / 10;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ ...data, bmi, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) throw new Error(error.message);
    return { ok: true, bmi };
  });

const PrescriptionInput = z.object({
  image: z.string().max(12_000_000),
});

export const analyzePrescription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => PrescriptionInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI is not configured.");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are a clinical assistant. Read the prescription image and explain it in clear, simple language for a patient. For each medicine give: what it is, what it treats, how to take it, common side effects, and key cautions. End with a clear reminder to follow the prescribing doctor and pharmacist, and to never self-medicate. Use short headed paragraphs in plain text (no markdown symbols).",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Please read and explain this prescription." },
              { type: "image_url", image_url: { url: data.image } },
            ],
          },
        ],
      }),
    });

    if (res.status === 429) throw new Error("RATE_LIMIT");
    if (res.status === 402) throw new Error("CREDITS_EXHAUSTED");
    if (!res.ok) {
      console.error("prescription AI error", res.status, await res.text().catch(() => ""));
      throw new Error("AI_ERROR");
    }

    const json = await res.json();
    const analysis: string = json?.choices?.[0]?.message?.content ?? "";

    await supabase.from("profiles").update({ prescription_analysis: analysis }).eq("id", userId);

    return { analysis };
  });
