
-- Add nutrition tracking fields to meal_plans
ALTER TABLE public.meal_plans
  ADD COLUMN IF NOT EXISTS calories integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS protein numeric(6,1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fat numeric(6,1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS carbs numeric(6,1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_extra boolean DEFAULT false;

-- Add daily calorie target to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS daily_calorie_target integer DEFAULT 2000;

-- Create pantry_items table
CREATE TABLE public.pantry_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text DEFAULT 'Other',
  quantity text DEFAULT '1',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.pantry_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pantry" ON public.pantry_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can add pantry items" ON public.pantry_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pantry" ON public.pantry_items FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own pantry" ON public.pantry_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Add is_recipe flag and recipe_data to posts for recipe toggle
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS is_recipe boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS recipe_ingredients jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS recipe_instructions jsonb DEFAULT '[]'::jsonb;
