import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const RunToolInput = z.object({
  tool: z.string().min(1).max(40),
  fields: z.record(z.string(), z.string().max(4000)),
  image: z.string().max(12_000_000).nullable().optional(),
});

export const runTool = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => RunToolInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { callHealthAI, buildToolPrompt } = await import("./health-tools.server");

    // Load profile for personalized context
    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "full_name, age, gender, weight_kg, height_cm, bmi, blood_group, health_conditions, current_medicines, family_history, recent_surgeries, allergies",
      )
      .eq("id", userId)
      .maybeSingle();

    const profileText = profile
      ? `User health profile:\n- Age: ${profile.age ?? "?"}\n- Gender: ${profile.gender ?? "?"}\n- Weight: ${profile.weight_kg ?? "?"} kg\n- Height: ${profile.height_cm ?? "?"} cm\n- BMI: ${profile.bmi ?? "?"}\n- Blood group: ${profile.blood_group ?? "?"}\n- Conditions: ${profile.health_conditions ?? "none stated"}\n- Current medicines: ${profile.current_medicines ?? "none stated"}\n- Family history: ${profile.family_history ?? "none stated"}\n- Recent surgeries: ${profile.recent_surgeries ?? "none stated"}\n- Allergies: ${profile.allergies ?? "none stated"}`
      : "No saved health profile. Give general guidance and suggest completing the profile.";

    const fieldText = Object.entries(data.fields)
      .filter(([, v]) => v && v.trim())
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");

    const userText = `${profileText}\n\nTool input:\n${fieldText || "(see attached image)"}`;

    const result = await callHealthAI({
      system: buildToolPrompt(data.tool),
      userText,
      imageDataUrl: data.image ?? null,
    });

    // Persist to history (best-effort)
    await supabase.from("scan_history").insert({
      user_id: userId,
      tool: data.tool,
      title: result.title,
      summary: result.summary,
      result: result as unknown as Record<string, unknown>,
    });

    if (data.tool === "calorieeye" && result.nutrition) {
      const n = result.nutrition;
      await supabase.from("food_diary").insert({
        user_id: userId,
        dish_name: n.dish_name || data.fields.meal_note || "Meal",
        calories: n.calories ?? null,
        protein_g: n.protein_g ?? null,
        sugar_g: n.sugar_g ?? null,
        sodium_mg: n.sodium_mg ?? null,
        saturated_fat_g: n.saturated_fat_g ?? null,
        fibre_g: n.fibre_g ?? null,
        analysis: result as unknown as Record<string, unknown>,
      });
    }

    return result;
  });
