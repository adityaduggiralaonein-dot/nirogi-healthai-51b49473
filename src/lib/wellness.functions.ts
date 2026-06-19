import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const memberId = z.string().uuid().nullable().optional();

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysAgo(n: number) {
  const x = startOfDay();
  x.setDate(x.getDate() - n);
  return x;
}

/* ------------------------------- Settings ------------------------------- */

export const getWellnessSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ memberId }).parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const q = supabase.from("wellness_settings").select("*").eq("user_id", userId);
    const { data: row } = data.memberId
      ? await q.eq("member_id", data.memberId).maybeSingle()
      : await q.is("member_id", null).maybeSingle();
    return { settings: row };
  });

export const saveWellnessSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        memberId,
        water_goal_ml: z.number().int().min(250).max(10000).optional(),
        water_reminder_min: z.number().int().min(15).max(480).optional(),
        exercise_goal_min: z.number().int().min(30).max(2000).optional(),
        target_bedtime: z.string().max(10).nullable().optional(),
        target_wake_time: z.string().max(10).nullable().optional(),
        sleep_goal_min: z.number().int().min(180).max(900).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { memberId: mId, ...rest } = data;
    const { error } = await supabase
      .from("wellness_settings")
      .upsert(
        { user_id: userId, member_id: mId ?? null, ...rest, updated_at: new Date().toISOString() },
        { onConflict: "user_id,member_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* --------------------------------- Water -------------------------------- */

export const getWaterToday = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ memberId }).parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let q = supabase.from("water_logs").select("*").eq("user_id", userId).gte("logged_at", daysAgo(6).toISOString());
    q = data.memberId ? q.eq("member_id", data.memberId) : q.is("member_id", null);
    const { data: logs } = await q.order("logged_at", { ascending: false });
    const today = startOfDay().getTime();
    const rows = logs ?? [];
    const todayTotal = rows
      .filter((r) => new Date(r.logged_at).getTime() >= today)
      .reduce((s, r) => s + r.amount_ml, 0);
    // weekly buckets
    const week: { day: string; ml: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = daysAgo(i);
      const next = daysAgo(i - 1);
      const ml = rows
        .filter((r) => {
          const t = new Date(r.logged_at).getTime();
          return t >= day.getTime() && t < next.getTime();
        })
        .reduce((s, r) => s + r.amount_ml, 0);
      week.push({ day: day.toLocaleDateString("en-US", { weekday: "short" }), ml });
    }
    return { todayTotal, todayLogs: rows.filter((r) => new Date(r.logged_at).getTime() >= today), week };
  });

export const addWater = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ memberId, amount_ml: z.number().int().min(10).max(5000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("water_logs")
      .insert({ user_id: userId, member_id: data.memberId ?? null, amount_ml: data.amount_ml });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteWater = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase.from("water_logs").delete().eq("id", data.id).eq("user_id", userId);
    return { ok: true };
  });

/* -------------------------------- Exercise ------------------------------ */

export const getExercise = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ memberId }).parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let q = supabase.from("exercise_logs").select("*").eq("user_id", userId).gte("logged_at", daysAgo(6).toISOString());
    q = data.memberId ? q.eq("member_id", data.memberId) : q.is("member_id", null);
    const { data: logs } = await q.order("logged_at", { ascending: false });
    const rows = logs ?? [];
    const weekMinutes = rows.reduce((s, r) => s + (r.duration_min ?? 0), 0);
    const weekCalories = rows.reduce((s, r) => s + (r.calories ?? 0), 0);
    return { logs: rows, weekMinutes, weekCalories };
  });

export const addExercise = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        memberId,
        activity: z.string().min(1).max(80),
        category: z.string().max(60).nullable().optional(),
        duration_min: z.number().int().min(1).max(1440),
        distance_km: z.number().min(0).max(1000).nullable().optional(),
        calories: z.number().int().min(0).max(20000).nullable().optional(),
        steps: z.number().int().min(0).max(200000).nullable().optional(),
        intensity: z.string().max(30).nullable().optional(),
        notes: z.string().max(500).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { memberId: mId, ...rest } = data;
    const { error } = await supabase
      .from("exercise_logs")
      .insert({ user_id: userId, member_id: mId ?? null, ...rest });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteExercise = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase.from("exercise_logs").delete().eq("id", data.id).eq("user_id", userId);
    return { ok: true };
  });

/* --------------------------------- Sleep -------------------------------- */

export const getSleep = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ memberId }).parse(input ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let q = supabase.from("sleep_logs").select("*").eq("user_id", userId);
    q = data.memberId ? q.eq("member_id", data.memberId) : q.is("member_id", null);
    const { data: logs } = await q.order("logged_at", { ascending: false }).limit(14);
    const rows = logs ?? [];
    const recent = rows.slice(0, 7);
    const avgDuration = recent.length
      ? Math.round(recent.reduce((s, r) => s + (r.duration_min ?? 0), 0) / recent.length)
      : 0;
    const avgScore = recent.filter((r) => r.quality_score != null).length
      ? Math.round(
          recent.filter((r) => r.quality_score != null).reduce((s, r) => s + (r.quality_score ?? 0), 0) /
            recent.filter((r) => r.quality_score != null).length,
        )
      : 0;
    return { logs: rows, avgDuration, avgScore };
  });

export const logSleep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        memberId,
        bedtime: z.string(),
        wake_time: z.string(),
        notes: z.string().max(1000).nullable().optional(),
        lang: z.enum(["en", "hi"]).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const bed = new Date(data.bedtime);
    let wake = new Date(data.wake_time);
    if (wake.getTime() <= bed.getTime()) wake = new Date(wake.getTime() + 24 * 60 * 60 * 1000);
    const duration = Math.round((wake.getTime() - bed.getTime()) / 60000);

    const { analyzeSleepAI } = await import("./wellness.server");
    let analysis: { score: number; summary: string; tips: string[]; flags: string[] } | null = null;
    try {
      analysis = await analyzeSleepAI({
        durationMin: duration,
        bedtime: bed.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        wake: wake.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        notes: data.notes ?? "",
        lang: data.lang ?? "en",
      });
    } catch {
      analysis = null;
    }

    const { error } = await supabase.from("sleep_logs").insert({
      user_id: userId,
      member_id: data.memberId ?? null,
      bedtime: bed.toISOString(),
      wake_time: wake.toISOString(),
      duration_min: duration,
      quality_score: analysis?.score ?? null,
      notes: data.notes ?? null,
      ai_analysis: analysis ? JSON.parse(JSON.stringify(analysis)) : null,
    });
    if (error) throw new Error(error.message);
    return { duration, analysis };
  });

export const deleteSleep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase.from("sleep_logs").delete().eq("id", data.id).eq("user_id", userId);
    return { ok: true };
  });
