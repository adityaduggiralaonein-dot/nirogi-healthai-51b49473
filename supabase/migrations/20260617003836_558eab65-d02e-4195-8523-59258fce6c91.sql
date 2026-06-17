-- Profile additions
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS emergency_contact text,
  ADD COLUMN IF NOT EXISTS preferred_language text NOT NULL DEFAULT 'en';

-- Family members
CREATE TABLE public.family_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  relation text,
  age integer,
  gender text,
  blood_group text,
  weight_kg numeric,
  height_cm numeric,
  bmi numeric,
  health_conditions text,
  current_medicines text,
  family_history text,
  recent_surgeries text,
  allergies text,
  emergency_contact text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_members TO authenticated;
GRANT ALL ON public.family_members TO service_role;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own family members"
  ON public.family_members FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);
CREATE TRIGGER update_family_members_updated_at
  BEFORE UPDATE ON public.family_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Medicine reminders
CREATE TABLE public.medicine_reminders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id uuid REFERENCES public.family_members(id) ON DELETE CASCADE,
  medicine_name text NOT NULL,
  dose text,
  timings text[] NOT NULL DEFAULT '{}',
  with_food text,
  duration text,
  special_instructions text,
  doctor text,
  tablets_remaining integer,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medicine_reminders TO authenticated;
GRANT ALL ON public.medicine_reminders TO service_role;
ALTER TABLE public.medicine_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own medicine reminders"
  ON public.medicine_reminders FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_medicine_reminders_updated_at
  BEFORE UPDATE ON public.medicine_reminders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Medicine logs
CREATE TABLE public.medicine_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_id uuid NOT NULL REFERENCES public.medicine_reminders(id) ON DELETE CASCADE,
  due_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'taken',
  marked_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medicine_logs TO authenticated;
GRANT ALL ON public.medicine_logs TO service_role;
ALTER TABLE public.medicine_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own medicine logs"
  ON public.medicine_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Health score history
CREATE TABLE public.health_score_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id uuid REFERENCES public.family_members(id) ON DELETE CASCADE,
  score integer NOT NULL,
  breakdown jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.health_score_history TO authenticated;
GRANT ALL ON public.health_score_history TO service_role;
ALTER TABLE public.health_score_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own health score history"
  ON public.health_score_history FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Per-member tagging on existing tables
ALTER TABLE public.scan_history
  ADD COLUMN IF NOT EXISTS member_id uuid REFERENCES public.family_members(id) ON DELETE CASCADE;
ALTER TABLE public.food_diary
  ADD COLUMN IF NOT EXISTS member_id uuid REFERENCES public.family_members(id) ON DELETE CASCADE;