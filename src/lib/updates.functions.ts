import { createServerFn } from "@tanstack/react-start";

export const getUpdates = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("updates")
    .select("id, title, body, category, published_at")
    .order("published_at", { ascending: false })
    .limit(8);

  if (error) {
    console.error("getUpdates error", error.message);
    return { updates: [] as Array<{ id: string; title: string; body: string; category: string | null; published_at: string }> };
  }
  return { updates: data ?? [] };
});
