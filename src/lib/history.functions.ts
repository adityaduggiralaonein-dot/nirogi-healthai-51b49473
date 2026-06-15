import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type HistoryItem = {
  id: string;
  kind: "tool" | "prescription" | "meal";
  tool: string;
  title: string;
  summary: string;
  riskLevel?: string;
  created_at: string;
  result?: unknown;
};

export const getMyHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ items: HistoryItem[] }> => {
    const { supabase, userId } = context;

    const [scans, meals] = await Promise.all([
      supabase
        .from("scan_history")
        .select("id, tool, title, summary, result, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("food_diary")
        .select("id, dish_name, calories, sugar_g, analysis, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    const items: HistoryItem[] = [];

    for (const s of scans.data ?? []) {
      const result = s.result as { riskLevel?: string } | null;
      items.push({
        id: s.id,
        kind: s.tool === "prescription" ? "prescription" : "tool",
        tool: s.tool,
        title: s.title ?? s.tool,
        summary: s.summary ?? "",
        riskLevel: result?.riskLevel,
        created_at: s.created_at,
        result: s.result,
      });
    }

    for (const m of meals.data ?? []) {
      items.push({
        id: m.id,
        kind: "meal",
        tool: "calorieeye",
        title: m.dish_name ?? "Meal",
        summary: `${m.calories ?? "?"} kcal · ${m.sugar_g ?? "?"} g sugar`,
        created_at: m.created_at,
        result: m.analysis,
      });
    }

    items.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

    return { items };
  });
