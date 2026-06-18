import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MemberInput = z.object({
  full_name: z.string().min(1).max(120),
  relation: z.string().max(60).optional().nullable(),
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
  emergency_contact: z.string().max(60).optional().nullable(),
});

function withBmi<T extends { weight_kg?: number | null; height_cm?: number | null }>(d: T) {
  let bmi: number | null = null;
  if (d.weight_kg && d.height_cm) {
    const m = d.height_cm / 100;
    if (m > 0) bmi = Math.round((d.weight_kg / (m * m)) * 10) / 10;
  }
  return bmi;
}

export const listFamilyMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("family_members")
      .select("*")
      .eq("owner_id", userId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return { members: data ?? [] };
  });

export const addFamilyMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => MemberInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { count } = await supabase
      .from("family_members")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", userId);
    if ((count ?? 0) >= 6) throw new Error("LIMIT_REACHED");

    const { data: row, error } = await supabase
      .from("family_members")
      .insert({ ...data, owner_id: userId, bmi: withBmi(data) })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { member: row };
  });

export const updateFamilyMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => MemberInput.extend({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { id, ...rest } = data;
    const { error } = await supabase
      .from("family_members")
      .update({ ...rest, bmi: withBmi(rest), updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("owner_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteFamilyMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("family_members")
      .delete()
      .eq("id", data.id)
      .eq("owner_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
