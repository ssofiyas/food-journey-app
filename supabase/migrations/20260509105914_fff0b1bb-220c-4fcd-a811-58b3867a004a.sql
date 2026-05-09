
ALTER TABLE public.daily_health_logs REPLICA IDENTITY FULL;
ALTER TABLE public.day_plan_activities REPLICA IDENTITY FULL;
ALTER TABLE public.meal_plans REPLICA IDENTITY FULL;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_health_logs;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.day_plan_activities;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.meal_plans;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
