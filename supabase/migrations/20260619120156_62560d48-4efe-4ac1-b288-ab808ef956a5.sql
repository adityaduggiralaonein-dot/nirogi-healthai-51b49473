CREATE TABLE public.water_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  member_id uuid REFERENCES public.family_members(id) ON DELETE CASCADE,
  amount_ml integer NOT NULL,
  logged_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.water_logs TO authenticated;
GRANT ALL ON public.water_logs TO service_role;
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own water logs" ON public.water_logs
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.exercise_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  member_id uuid REFERENCES public.family_members(id) ON DELETE CASCADE,
  activity text NOT NULL,
  category text,
  duration_min integer NOT NULL,
  distance_km numeric,
  calories integer,
  steps integer,
  intensity text,
  notes text,
  logged_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercise_logs TO authenticated;
GRANT ALL ON public.exercise_logs TO service_role;
ALTER TABLE public.exercise_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own exercise logs" ON public.exercise_logs
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.sleep_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  member_id uuid REFERENCES public.family_members(id) ON DELETE CASCADE,
  bedtime timestamptz,
  wake_time timestamptz,
  duration_min integer,
  quality_score integer,
  notes text,
  ai_analysis jsonb,
  logged_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sleep_logs TO authenticated;
GRANT ALL ON public.sleep_logs TO service_role;
ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sleep logs" ON public.sleep_logs
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.wellness_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  member_id uuid REFERENCES public.family_members(id) ON DELETE CASCADE,
  water_goal_ml integer NOT NULL DEFAULT 3000,
  water_reminder_min integer NOT NULL DEFAULT 120,
  exercise_goal_min integer NOT NULL DEFAULT 150,
  target_bedtime text,
  target_wake_time text,
  sleep_goal_min integer NOT NULL DEFAULT 480,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, member_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wellness_settings TO authenticated;
GRANT ALL ON public.wellness_settings TO service_role;
ALTER TABLE public.wellness_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own wellness settings" ON public.wellness_settings
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);