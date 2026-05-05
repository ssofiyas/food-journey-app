
-- Daily health logs (private)
CREATE TABLE public.daily_health_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  calories_consumed integer DEFAULT 0,
  steps integer DEFAULT 0,
  water_glasses integer DEFAULT 0,
  sleep_hours numeric DEFAULT 0,
  readiness_score integer,
  stress_level integer,
  resting_heart_rate integer,
  mood text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);
ALTER TABLE public.daily_health_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.daily_health_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.daily_health_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.daily_health_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.daily_health_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER trg_dhl_updated BEFORE UPDATE ON public.daily_health_logs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Connected devices (private)
CREATE TABLE public.connected_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  device_type text NOT NULL,
  device_name text,
  is_connected boolean DEFAULT true,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.connected_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.connected_devices FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.connected_devices FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.connected_devices FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.connected_devices FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Day plan activities (private)
CREATE TABLE public.day_plan_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  title text NOT NULL,
  activity_type text DEFAULT 'workout',
  duration_minutes integer,
  scheduled_time time,
  completed boolean DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.day_plan_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.day_plan_activities FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.day_plan_activities FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.day_plan_activities FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.day_plan_activities FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Cycle logs (private)
CREATE TABLE public.cycle_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL,
  phase text,
  flow text,
  symptoms text[] DEFAULT '{}',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);
ALTER TABLE public.cycle_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.cycle_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.cycle_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.cycle_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.cycle_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Academy lectures (public catalog)
CREATE TABLE public.academy_lectures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  instructor text,
  duration_minutes integer DEFAULT 0,
  thumbnail_url text,
  video_url text,
  is_premium boolean DEFAULT false,
  level text DEFAULT 'beginner',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.academy_lectures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can view lectures" ON public.academy_lectures FOR SELECT USING (true);

-- Lecture progress (private)
CREATE TABLE public.lecture_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lecture_id uuid NOT NULL,
  progress_percent integer DEFAULT 0,
  completed boolean DEFAULT false,
  last_watched_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, lecture_id)
);
ALTER TABLE public.lecture_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.lecture_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.lecture_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.lecture_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.lecture_progress FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Seed academy with sample lectures
INSERT INTO public.academy_lectures (title, description, category, instructor, duration_minutes, is_premium, level, thumbnail_url) VALUES
('Sleep Foundations: Your First 7 Days', 'Build the habits that drive deep recovery and energy.', 'sleep', 'Dr. Lena Park', 22, false, 'beginner', null),
('Deep Recovery Protocols', 'Advanced strategies used by pro athletes for daily recovery.', 'recovery', 'Coach Marko', 35, true, 'advanced', null),
('Nutrition for Sustained Energy', 'Eat to fuel your day, not just to feel full.', 'nutrition', 'Dr. Aisha Khan', 28, false, 'beginner', null),
('Stress & The Nervous System', 'Understand stress and learn breath-based regulation.', 'mindfulness', 'Sara Lindgren', 18, true, 'intermediate', null),
('Cycle-Synced Training for Women', 'Adapt training and nutrition to your hormonal cycle.', 'womens-health', 'Dr. Emma Rivera', 40, true, 'intermediate', null),
('Heart Rate Variability 101', 'What HRV is, what it isn''t, and how to actually use it.', 'recovery', 'Coach Marko', 16, false, 'beginner', null),
('Mobility for Desk Workers', 'A 15-minute daily routine to undo sitting damage.', 'movement', 'Yuki Tanaka', 15, false, 'beginner', null),
('Building a Sustainable Cardio Base', 'Zone 2 explained without the broscience.', 'movement', 'Coach Marko', 32, true, 'intermediate', null);
