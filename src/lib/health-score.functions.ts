import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Factor = { label: string; points: number; max: number; note: string };

/**
 * Computes a 0-100 health score from the user's profile and recent activity.
 * Weights (from the product spec):
 *  - BMI                  15
 *  - Healthy eating/sugar 20  (food diary)
 *  - Medicine adherence   15  (medicine logs)
 *  - Tool engagement      10  (scan history breadth)
 *  - CancerSense          10
 *  - HeartSense           10
 *  - ScanIQ                5
 *  - Profile completeness 15
 */
export const getHealthScore = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const since = new Date();
    since.setDate(since.getDate() - 30);
    const sinceIso = since.toISOString();

    const [{ data: profile }, { data: scans }, { data: food }, { data: logs }, { data: history }] =
      await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("scan_history").select("tool, result, created_at").eq("user_id", userId).gte("created_at", sinceIso),
        supabase.from("food_diary").select("sugar_g, calories, created_at").eq("user_id", userId).gte("created_at", sinceIso),
        supabase.from("medicine_logs").select("status, marked_at").eq("user_id", userId).gte("marked_at", sinceIso),
        supabase.from("health_score_history").select("score, created_at").eq("user_id", userId).order("created_at", { ascending: true }).limit(12),
      ]);

    const factors: Factor[] = [];

    // BMI (15)
    const bmi = profile?.bmi as number | null | undefined;
    if (bmi == null) {
      factors.push({ label: "Body Mass Index", points: 6, max: 15, note: "Add weight & height to refine this." });
    } else {
      const bmiPts = bmi >= 18.5 && bmi < 25 ? 15 : bmi >= 25 && bmi < 30 ? 9 : bmi >= 17 && bmi < 18.5 ? 9 : 4;
      factors.push({
        label: "Body Mass Index",
        points: bmiPts,
        max: 15,
        note: bmiPts === 15 ? "Healthy BMI range." : "Aim for a BMI between 18.5 and 24.9.",
      });
    }

    // Healthy eating / sugar (20)
    const meals = food ?? [];
    if (meals.length === 0) {
      factors.push({ label: "Healthy eating", points: 8, max: 20, note: "Log meals with CalorieEye to track this." });
    } else {
      const avgSugar = meals.reduce((s, m) => s + (m.sugar_g ?? 0), 0) / meals.length;
      const eatPts = avgSugar <= 15 ? 20 : avgSugar <= 30 ? 14 : avgSugar <= 50 ? 8 : 4;
      factors.push({
        label: "Healthy eating",
        points: eatPts,
        max: 20,
        note: `Avg ${Math.round(avgSugar)}g sugar/meal over ${meals.length} logged meals.`,
      });
    }

    // Medicine adherence (15)
    const allLogs = logs ?? [];
    if (allLogs.length === 0) {
      factors.push({ label: "Medicine adherence", points: 9, max: 15, note: "Set reminders to track adherence." });
    } else {
      const taken = allLogs.filter((l) => l.status === "taken").length;
      const rate = taken / allLogs.length;
      factors.push({
        label: "Medicine adherence",
        points: Math.round(rate * 15),
        max: 15,
        note: `${Math.round(rate * 100)}% of doses taken on time.`,
      });
    }

    // Tool engagement (10)
    const scanRows = scans ?? [];
    const distinctTools = new Set(scanRows.map((s) => s.tool)).size;
    factors.push({
      label: "Preventive check-ups",
      points: Math.min(10, distinctTools * 2),
      max: 10,
      note: `${distinctTools} different tools used this month.`,
    });

    // Helper to read a tool's latest risk
    const riskScore = (tool: string, max: number): Factor => {
      const rows = scanRows.filter((s) => s.tool === tool);
      if (rows.length === 0)
        return { label: tool, points: Math.round(max * 0.6), max, note: "Not assessed recently." };
      const latest = rows[rows.length - 1].result as { riskLevel?: string } | null;
      const lvl = latest?.riskLevel ?? "info";
      const pts =
        lvl === "low" ? max : lvl === "info" ? Math.round(max * 0.8) : lvl === "moderate" ? Math.round(max * 0.6) : lvl === "high" ? Math.round(max * 0.3) : 0;
      return { label: tool, points: pts, max, note: `Latest risk: ${lvl}.` };
    };

    const cancer = riskScore("cancersense", 10);
    cancer.label = "Cancer risk (CancerSense)";
    factors.push(cancer);
    const heart = riskScore("heartsense", 10);
    heart.label = "Heart risk (HeartSense)";
    factors.push(heart);
    const scan = riskScore("scaniq", 5);
    scan.label = "Reports reviewed (ScanIQ)";
    factors.push(scan);

    // Profile completeness (15)
    const fields = [
      profile?.full_name,
      profile?.age,
      profile?.gender,
      profile?.blood_group,
      profile?.weight_kg,
      profile?.height_cm,
      profile?.health_conditions,
      profile?.current_medicines,
    ];
    const filled = fields.filter((f) => f != null && `${f}`.trim() !== "").length;
    factors.push({
      label: "Profile completeness",
      points: Math.round((filled / fields.length) * 15),
      max: 15,
      note: `${filled}/${fields.length} key fields filled.`,
    });

    const score = Math.max(0, Math.min(100, factors.reduce((s, f) => s + f.points, 0)));

    const band =
      score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Needs attention" : "At risk";
    const message =
      score >= 80
        ? "You're doing great — keep up your healthy habits!"
        : score >= 60
          ? "A solid foundation. Small tweaks can push you higher."
          : score >= 40
            ? "Some areas need care. Focus on your lowest factors below."
            : "Let's turn this around — start with one factor this week.";

    // Store today's snapshot (one per day)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const { data: todaySnap } = await supabase
      .from("health_score_history")
      .select("id")
      .eq("user_id", userId)
      .gte("created_at", startOfDay.toISOString())
      .maybeSingle();

    if (todaySnap) {
      await supabase
        .from("health_score_history")
        .update({ score, breakdown: JSON.parse(JSON.stringify(factors)) })
        .eq("id", todaySnap.id);
    } else {
      await supabase
        .from("health_score_history")
        .insert({ user_id: userId, score, breakdown: JSON.parse(JSON.stringify(factors)) });
    }

    const trend = (history ?? []).map((h) => ({ score: h.score, date: h.created_at }));

    return { score, band, message, factors, trend };
  });
