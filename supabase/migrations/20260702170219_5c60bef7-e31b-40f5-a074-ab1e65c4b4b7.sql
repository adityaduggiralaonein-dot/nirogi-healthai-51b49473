
-- Shared updated_at trigger already exists as public.update_updated_at_column()

-- Health goals
CREATE TABLE public.health_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id UUID REFERENCES public.family_members(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL,
  start_weight_kg NUMERIC,
  current_weight_kg NUMERIC,
  target_weight_kg NUMERIC,
  current_height_cm NUMERIC,
  target_height_cm NUMERIC,
  timeline_months INTEGER,
  daily_calorie_target INTEGER,
  protein_target_g INTEGER,
  ai_plan JSONB,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.health_goals TO authenticated;
GRANT ALL ON public.health_goals TO service_role;
ALTER TABLE public.health_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own health goals" ON public.health_goals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_health_goals_updated_at BEFORE UPDATE ON public.health_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Weight logs
CREATE TABLE public.weight_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id UUID REFERENCES public.family_members(id) ON DELETE CASCADE,
  weight_kg NUMERIC NOT NULL,
  bmi NUMERIC,
  note TEXT,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.weight_logs TO authenticated;
GRANT ALL ON public.weight_logs TO service_role;
ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own weight logs" ON public.weight_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Diet plans
CREATE TABLE public.diet_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id UUID REFERENCES public.family_members(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'generated',
  preferences JSONB,
  plan JSONB,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diet_plans TO authenticated;
GRANT ALL ON public.diet_plans TO service_role;
ALTER TABLE public.diet_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own diet plans" ON public.diet_plans FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_diet_plans_updated_at BEFORE UPDATE ON public.diet_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Diet compliance
CREATE TABLE public.diet_compliance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id UUID REFERENCES public.family_members(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.diet_plans(id) ON DELETE CASCADE,
  meal_date DATE NOT NULL,
  meal_slot TEXT NOT NULL,
  eaten BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diet_compliance TO authenticated;
GRANT ALL ON public.diet_compliance TO service_role;
ALTER TABLE public.diet_compliance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own diet compliance" ON public.diet_compliance FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Breathing sessions
CREATE TABLE public.breathing_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id UUID REFERENCES public.family_members(id) ON DELETE CASCADE,
  technique TEXT NOT NULL,
  duration_sec INTEGER NOT NULL,
  cycles INTEGER,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.breathing_sessions TO authenticated;
GRANT ALL ON public.breathing_sessions TO service_role;
ALTER TABLE public.breathing_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own breathing sessions" ON public.breathing_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Heart rate logs
CREATE TABLE public.heart_rate_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id UUID REFERENCES public.family_members(id) ON DELETE CASCADE,
  bpm INTEGER NOT NULL,
  context TEXT,
  ai_note TEXT,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.heart_rate_logs TO authenticated;
GRANT ALL ON public.heart_rate_logs TO service_role;
ALTER TABLE public.heart_rate_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own heart rate logs" ON public.heart_rate_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Family invites
CREATE TABLE public.family_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id UUID REFERENCES public.family_members(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  label TEXT,
  relation TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  accepted_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.family_invites TO authenticated;
GRANT ALL ON public.family_invites TO service_role;
ALTER TABLE public.family_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage own family invites" ON public.family_invites FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Link family members to a joined login
ALTER TABLE public.family_members ADD COLUMN IF NOT EXISTS member_user_id UUID;
ALTER TABLE public.family_members ADD COLUMN IF NOT EXISTS invite_status TEXT;
