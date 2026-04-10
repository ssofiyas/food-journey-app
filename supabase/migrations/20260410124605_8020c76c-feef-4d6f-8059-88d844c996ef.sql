
-- 1. Create private health data table
CREATE TABLE public.user_health_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  daily_calorie_target INTEGER DEFAULT 2000,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_health_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own health data"
  ON public.user_health_data FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health data"
  ON public.user_health_data FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health data"
  ON public.user_health_data FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Migrate existing data
INSERT INTO public.user_health_data (user_id, daily_calorie_target)
SELECT user_id, COALESCE(daily_calorie_target, 2000)
FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- Remove column from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS daily_calorie_target;

-- 2. Fix profiles INSERT/UPDATE policies to authenticated only
ALTER POLICY "Users can insert their own profile" ON public.profiles TO authenticated;
ALTER POLICY "Users can update their own profile" ON public.profiles TO authenticated;

-- 3. Fix storage INSERT policy for images bucket
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload images" ON storage.objects;

CREATE POLICY "Users can upload to own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
