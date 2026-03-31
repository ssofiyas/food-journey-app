
-- Add tags column to posts for recommendation engine
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Create user_preferences table to track taste profile from likes
CREATE TABLE public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  liked_tags jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences" ON public.user_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON public.user_preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON public.user_preferences FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Function to update user preferences when they like a post with tags
CREATE OR REPLACE FUNCTION public.update_user_tag_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_tags text[];
  tag text;
BEGIN
  -- Get tags from the liked post
  SELECT COALESCE(p.tags, '{}') INTO post_tags FROM posts p WHERE p.id = NEW.post_id;
  
  IF array_length(post_tags, 1) IS NOT NULL THEN
    -- Upsert preferences: increment count for each tag
    INSERT INTO user_preferences (user_id, liked_tags)
    VALUES (NEW.user_id, '{}'::jsonb)
    ON CONFLICT (user_id) DO NOTHING;
    
    FOREACH tag IN ARRAY post_tags LOOP
      UPDATE user_preferences 
      SET liked_tags = jsonb_set(
        liked_tags, 
        ARRAY[tag], 
        to_jsonb(COALESCE((liked_tags->>tag)::int, 0) + 1),
        true
      ),
      updated_at = now()
      WHERE user_id = NEW.user_id;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger on likes insert
CREATE TRIGGER on_like_update_preferences
AFTER INSERT ON public.likes
FOR EACH ROW
EXECUTE FUNCTION public.update_user_tag_preferences();

-- Also handle unlike (decrement)
CREATE OR REPLACE FUNCTION public.decrement_user_tag_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_tags text[];
  tag text;
  current_val int;
BEGIN
  SELECT COALESCE(p.tags, '{}') INTO post_tags FROM posts p WHERE p.id = OLD.post_id;
  
  IF array_length(post_tags, 1) IS NOT NULL THEN
    FOREACH tag IN ARRAY post_tags LOOP
      SELECT COALESCE((liked_tags->>tag)::int, 0) INTO current_val 
      FROM user_preferences WHERE user_id = OLD.user_id;
      
      IF current_val > 1 THEN
        UPDATE user_preferences 
        SET liked_tags = jsonb_set(liked_tags, ARRAY[tag], to_jsonb(current_val - 1), true),
        updated_at = now()
        WHERE user_id = OLD.user_id;
      ELSIF current_val = 1 THEN
        UPDATE user_preferences 
        SET liked_tags = liked_tags - tag,
        updated_at = now()
        WHERE user_id = OLD.user_id;
      END IF;
    END LOOP;
  END IF;
  
  RETURN OLD;
END;
$$;

CREATE TRIGGER on_unlike_update_preferences
AFTER DELETE ON public.likes
FOR EACH ROW
EXECUTE FUNCTION public.decrement_user_tag_preferences();
