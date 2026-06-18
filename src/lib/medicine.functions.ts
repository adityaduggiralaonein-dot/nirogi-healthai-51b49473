import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ReminderInput = z.object({
  medicine_name: z.string().min(1).max(160),
  dose: z.string().max(120).optional().nullable(),
  timings: z.array(z.string().max(10)).max(8).default([]),
  with_food: z.string().max(40).optional().nullable(),
  duration: z.string().max(80).optional().nullable(),
  special_instructions: z.string().max(1000).optional().nullable(),
  doctor: z.string().max(120).optional().nullable(),
  tablets_remaining: z.number().int().min(0).max(100000).optional().nullable(),
  member_id: z.string().uuid().optional().nullable(),
});

export const listReminders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: reminders, error } = await supabase
      .from("medicine_reminders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    // Today's logs to know what's been taken
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const { data: logs } = await supabase
      .from("medicine_logs")
      .select("*")
      .eq("user_id", userId)
      .gte("marked_at", startOfDay.toISOString());

    return { reminders: reminders ?? [], todayLogs: logs ?? [] };
  });

export const addReminder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ReminderInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("medicine_reminders")
      .insert({ ...data, user_id: userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { reminder: row };
  });

export const updateReminder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    ReminderInput.partial().extend({ id: z.string().uuid(), active: z.boolean().optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { id, ...rest } = data;
    const { error } = await supabase
      .from("medicine_reminders")
      .update({ ...rest, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteReminder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("medicine_reminders")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const logDose = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        reminder_id: z.string().uuid(),
        status: z.enum(["taken", "skipped"]).default("taken"),
        due_at: z.string().optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("medicine_logs").insert({
      user_id: userId,
      reminder_id: data.reminder_id,
      status: data.status,
      due_at: data.due_at ?? new Date().toISOString(),
    });
    if (error) throw new Error(error.message);

    // Decrement remaining tablets when taken
    if (data.status === "taken") {
      const { data: rem } = await supabase
        .from("medicine_reminders")
        .select("tablets_remaining")
        .eq("id", data.reminder_id)
        .eq("user_id", userId)
        .maybeSingle();
      if (rem?.tablets_remaining && rem.tablets_remaining > 0) {
        await supabase
          .from("medicine_reminders")
          .update({ tablets_remaining: rem.tablets_remaining - 1 })
          .eq("id", data.reminder_id)
          .eq("user_id", userId);
      }
    }
    return { ok: true };
  });
