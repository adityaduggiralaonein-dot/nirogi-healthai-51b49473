import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const memberId = z.string().uuid().nullable().optional();

function bmiOf(weight: number | null, heightCm: number | null): number | null {
  if (!weight || !heightCm) return null;
  const m = heightCm / 100;
  if (m <= 0) return null;
  return Math.round((weight / (m * m)) * 10) / 10;
}

/** Mifflin-St Jeor BMR → TDEE → daily calorie & protein target for the goal. */
function computeTargets(opts: {
  goalType: string;
  weight: number;
  heightCm: number;
  age: number;
  gender: string | null;
  targetWeight: number | null;
}) {
  const { goalType, weight, heightCm, age } = opts;
  const male = (opts.gender ?? "").toLowerCase().startsWith("m");
  const bmr = 10 * weight + 6.25 * heightCm - 5 * (age || 30) + (male ? 5 : -161);
  const tdee = Math.round(bmr * 1.4); // lightly active default

  let calorie = tdee;
  let protein = Math.round(weight * 1.0);
  switch (goalType) {
    case "lose":
      calorie = tdee - 500;
      protein = Math.round(weight * 1.6);
      break;
    case "gain":
      calorie = tdee + 400;
      protein = Math.round(weight * 1.4);
      break;
    case "muscle":
      calorie = tdee + 300;
      protein = Math.round(weight * 1.9);
      break;
    case "maintain":
      calorie = tdee;
      protein = Math.round(weight * 1.2);
      break;
    case "height":
      calorie = tdee + 200;
      protein = Math.round(weight * 1.5);
      break;
  }
  return { daily_calorie_target: Math.max(1200, calorie), protein_target_g: protein, tdee };
}

async function loadSubject(supabase: any, userId: string, mId: string | null | undefined) {
  if (mId) {
    const { data } = await supabase
      .from("family_members")
      .select("age, gender, weight_kg, height_cm")
      .eq("id", mId)
      .eq("owner_id", userId)
      .maybeSingle();
    return data;
  }
  const { data } = await supabase
    .from("profiles")
    .select("age, gender, weight_kg, height_cm")
    .eq("id", userId)
    .maybeSingle();
  return data;
}

export const getHealthGoal = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ memberId }).parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let q = supabase.from("health_goals").select("*").eq("user_id", userId).eq("status", "active");
    q = data.memberId ? q.eq("member_id", data.memberId) : q.is("member_id", null);
    const { data: goal } = await q.order("created_at", { ascending: false }).limit(1).maybeSingle();

    let wq = supabase.from("weight_logs").select("*").eq("user_id", userId);
    wq = data.memberId ? wq.eq("member_id", data.memberId) : wq.is("member_id", null);
    const { data: logs } = await wq.order("logged_at", { ascending: true }).limit(60);

    return { goal: goal ?? null, weightLogs: logs ?? [] };
  });

export const saveHealthGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        memberId,
        goal_type: z.enum(["lose", "gain", "muscle", "maintain", "height"]),
        current_weight_kg: z.number().min(2).max(500),
        target_weight_kg: z.number().min(2).max(500).nullable().optional(),
        current_height_cm: z.number().min(30).max(280),
        target_height_cm: z.number().min(30).max(280).nullable().optional(),
        timeline_months: z.number().int().min(1).max(36).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const subject = await loadSubject(supabase, userId, data.memberId);
    const age = subject?.age ?? 30;
    const gender = subject?.gender ?? null;

    const { daily_calorie_target, protein_target_g } = computeTargets({
      goalType: data.goal_type,
      weight: data.current_weight_kg,
      heightCm: data.current_height_cm,
      age,
      gender,
      targetWeight: data.target_weight_kg ?? null,
    });

    // Deactivate previous goals for this subject
    let deQ = supabase.from("health_goals").update({ status: "archived" }).eq("user_id", userId).eq("status", "active");
    deQ = data.memberId ? deQ.eq("member_id", data.memberId) : deQ.is("member_id", null);
    await deQ;

    const { data: row, error } = await supabase
      .from("health_goals")
      .insert({
        user_id: userId,
        member_id: data.memberId ?? null,
        goal_type: data.goal_type,
        start_weight_kg: data.current_weight_kg,
        current_weight_kg: data.current_weight_kg,
        target_weight_kg: data.target_weight_kg ?? null,
        current_height_cm: data.current_height_cm,
        target_height_cm: data.target_height_cm ?? null,
        timeline_months: data.timeline_months ?? 3,
        daily_calorie_target,
        protein_target_g,
        status: "active",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    // Seed a baseline weigh-in
    await supabase.from("weight_logs").insert({
      user_id: userId,
      member_id: data.memberId ?? null,
      weight_kg: data.current_weight_kg,
      bmi: bmiOf(data.current_weight_kg, data.current_height_cm),
      note: "Baseline",
    });

    return { goal: row };
  });

export const logWeight = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ memberId, weight_kg: z.number().min(2).max(500), note: z.string().max(200).nullable().optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const subject = await loadSubject(supabase, userId, data.memberId);
    const bmi = bmiOf(data.weight_kg, subject?.height_cm ?? null);

    await supabase.from("weight_logs").insert({
      user_id: userId,
      member_id: data.memberId ?? null,
      weight_kg: data.weight_kg,
      bmi,
      note: data.note ?? null,
    });

    // Update the active goal's current weight + owner profile weight/bmi
    let gQ = supabase.from("health_goals").update({ current_weight_kg: data.weight_kg }).eq("user_id", userId).eq("status", "active");
    gQ = data.memberId ? gQ.eq("member_id", data.memberId) : gQ.is("member_id", null);
    await gQ;

    if (!data.memberId) {
      await supabase.from("profiles").update({ weight_kg: data.weight_kg, bmi }).eq("id", userId);
    } else {
      await supabase.from("family_members").update({ weight_kg: data.weight_kg, bmi }).eq("id", data.memberId).eq("owner_id", userId);
    }

    return { ok: true, bmi };
  });

export const deleteHealthGoal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase.from("health_goals").update({ status: "archived" }).eq("id", data.id).eq("user_id", userId);
    return { ok: true };
  });
