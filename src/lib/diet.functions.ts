import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const memberId = z.string().uuid().nullable().optional();

async function profileText(supabase: any, userId: string, mId: string | null | undefined) {
  if (mId) {
    const { data: m } = await supabase
      .from("family_members")
      .select("full_name, age, gender, weight_kg, height_cm, bmi, health_conditions, allergies")
      .eq("id", mId)
      .eq("owner_id", userId)
      .maybeSingle();
    if (!m) return "No profile.";
    return `Family member profile:\n- Age: ${m.age ?? "?"}\n- Gender: ${m.gender ?? "?"}\n- Weight: ${m.weight_kg ?? "?"}kg, Height: ${m.height_cm ?? "?"}cm, BMI: ${m.bmi ?? "?"}\n- Conditions: ${m.health_conditions ?? "none"}\n- Allergies: ${m.allergies ?? "none"}`;
  }
  const { data: p } = await supabase
    .from("profiles")
    .select("age, gender, weight_kg, height_cm, bmi, health_conditions, allergies")
    .eq("id", userId)
    .maybeSingle();
  const { data: goal } = await supabase
    .from("health_goals")
    .select("goal_type, daily_calorie_target, target_weight_kg")
    .eq("user_id", userId)
    .is("member_id", null)
    .eq("status", "active")
    .maybeSingle();
  const goalStr = goal
    ? `\n- Active goal: ${goal.goal_type} (daily target ${goal.daily_calorie_target ?? "?"} kcal, target weight ${goal.target_weight_kg ?? "?"}kg)`
    : "";
  if (!p) return `No saved profile.${goalStr}`;
  return `User profile:\n- Age: ${p.age ?? "?"}\n- Gender: ${p.gender ?? "?"}\n- Weight: ${p.weight_kg ?? "?"}kg, Height: ${p.height_cm ?? "?"}cm, BMI: ${p.bmi ?? "?"}\n- Conditions: ${p.health_conditions ?? "none"}\n- Allergies: ${p.allergies ?? "none"}${goalStr}`;
}

export const getDietPlan = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ memberId }).parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let q = supabase.from("diet_plans").select("*").eq("user_id", userId).eq("active", true);
    q = data.memberId ? q.eq("member_id", data.memberId) : q.is("member_id", null);
    const { data: plan } = await q.order("created_at", { ascending: false }).limit(1).maybeSingle();

    const today = new Date().toISOString().slice(0, 10);
    let cQ = supabase.from("diet_compliance").select("meal_slot, eaten").eq("user_id", userId).eq("meal_date", today);
    cQ = data.memberId ? cQ.eq("member_id", data.memberId) : cQ.is("member_id", null);
    const { data: compliance } = await cQ;

    return { plan: plan ?? null, compliance: compliance ?? [] };
  });

export const generateDietPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        memberId,
        lang: z.enum(["en", "hi"]).optional(),
        goal: z.string().max(200),
        food_preference: z.string().max(120),
        cuisine: z.string().max(120),
        budget: z.string().max(120),
        allergies: z.string().max(400).optional(),
        cook_time: z.string().max(120).optional(),
        people: z.string().max(120).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { generateDietAI } = await import("./diet.server");
    const pText = await profileText(supabase, userId, data.memberId);
    const prefsText = `Goal: ${data.goal}\nFood preference: ${data.food_preference}\nRegional cuisine: ${data.cuisine}\nDaily budget: ${data.budget}\nAllergies/dislikes: ${data.allergies || "none"}\nCooking time: ${data.cook_time || "any"}\nCooking for: ${data.people || "just me"}`;

    const plan = await generateDietAI({ profileText: pText, prefsText, lang: data.lang ?? "en" });

    // Deactivate old plans, insert new active plan
    let deQ = supabase.from("diet_plans").update({ active: false }).eq("user_id", userId).eq("active", true);
    deQ = data.memberId ? deQ.eq("member_id", data.memberId) : deQ.is("member_id", null);
    await deQ;

    const { data: row, error } = await supabase
      .from("diet_plans")
      .insert({
        user_id: userId,
        member_id: data.memberId ?? null,
        source: "generated",
        preferences: JSON.parse(JSON.stringify({ ...data, memberId: undefined })),
        plan: JSON.parse(JSON.stringify(plan)),
        active: true,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { plan: row };
  });

export const uploadDietPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        memberId,
        lang: z.enum(["en", "hi"]).optional(),
        text: z.string().max(8000).nullable().optional(),
        file: z.string().max(16_000_000).nullable().optional(),
        fileName: z.string().max(200).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (!data.text?.trim() && !data.file) throw new Error("NO_INPUT");
    const { parseDietAI } = await import("./diet.server");
    const pText = await profileText(supabase, userId, data.memberId);
    const plan = await parseDietAI({
      profileText: pText,
      text: data.text ?? null,
      fileDataUrl: data.file ?? null,
      fileName: data.fileName ?? null,
      lang: data.lang ?? "en",
    });

    let deQ = supabase.from("diet_plans").update({ active: false }).eq("user_id", userId).eq("active", true);
    deQ = data.memberId ? deQ.eq("member_id", data.memberId) : deQ.is("member_id", null);
    await deQ;

    const { data: row, error } = await supabase
      .from("diet_plans")
      .insert({
        user_id: userId,
        member_id: data.memberId ?? null,
        source: "uploaded",
        plan: JSON.parse(JSON.stringify(plan)),
        active: true,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { plan: row };
  });

export const setMealCompliance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        memberId,
        planId: z.string().uuid().nullable().optional(),
        meal_slot: z.string().max(30),
        eaten: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const today = new Date().toISOString().slice(0, 10);
    // remove existing for this slot/day then insert
    let dQ = supabase
      .from("diet_compliance")
      .delete()
      .eq("user_id", userId)
      .eq("meal_date", today)
      .eq("meal_slot", data.meal_slot);
    dQ = data.memberId ? dQ.eq("member_id", data.memberId) : dQ.is("member_id", null);
    await dQ;

    if (data.eaten) {
      await supabase.from("diet_compliance").insert({
        user_id: userId,
        member_id: data.memberId ?? null,
        plan_id: data.planId ?? null,
        meal_date: today,
        meal_slot: data.meal_slot,
        eaten: true,
      });
    }
    return { ok: true };
  });
