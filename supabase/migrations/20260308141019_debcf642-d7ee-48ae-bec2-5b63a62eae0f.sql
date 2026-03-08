
-- 1. Fix profiles SELECT policy: restrict to own data + limited public view for forums
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can view public profile fields"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Actually, we can't have column-level RLS in Postgres. 
-- Better approach: users see own full profile, others see via a view.
-- Let's just restrict to own profile for now and create a public view for forum needs.
DROP POLICY IF EXISTS "Users can view public profile fields" ON public.profiles;

CREATE POLICY "Authenticated users can view basic profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id 
  OR true  -- Allow reading but we'll create a view for limited fields
);

-- Actually the simplest secure approach: restrict SELECT to own profile only
DROP POLICY IF EXISTS "Authenticated users can view basic profiles" ON public.profiles;

-- For forum/community features, create a secure view
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT id, full_name, avatar_url, bio, is_verified_pediatrician
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- Now the main profiles table only allows own data
CREATE POLICY "Users can view own full profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 2. Fix notification_logs INSERT policy
DROP POLICY IF EXISTS "Service role can insert notification logs" ON public.notification_logs;

CREATE POLICY "Service role can insert notification logs"
ON public.notification_logs
FOR INSERT
TO service_role
WITH CHECK (true);

-- 3. Remove direct INSERT on user_badges (should be server-side only)
DROP POLICY IF EXISTS "Users can insert their own badges" ON public.user_badges;

CREATE POLICY "Service role can insert badges"
ON public.user_badges
FOR INSERT
TO service_role
WITH CHECK (true);

-- 4. Remove direct INSERT on completed_challenges_history (trigger handles this)
DROP POLICY IF EXISTS "Users can insert their own challenge history" ON public.completed_challenges_history;

CREATE POLICY "Service role can insert challenge history"
ON public.completed_challenges_history
FOR INSERT
TO service_role
WITH CHECK (true);

-- 5. Restrict user_streaks UPDATE to non-gamification columns only
DROP POLICY IF EXISTS "Users can update their own streaks" ON public.user_streaks;

-- Create a function to handle streak updates securely
CREATE OR REPLACE FUNCTION public.update_user_streak(
  p_user_id uuid,
  p_last_activity_date date
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_streak integer;
  v_longest_streak integer;
  v_last_activity date;
  v_new_streak integer;
BEGIN
  -- Only allow users to update their own streak
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT current_streak, longest_streak, last_activity_date
  INTO v_current_streak, v_longest_streak, v_last_activity
  FROM user_streaks
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date, total_points)
    VALUES (p_user_id, 1, 1, p_last_activity_date, 10);
    RETURN;
  END IF;

  -- If already logged today, skip
  IF v_last_activity = p_last_activity_date THEN
    RETURN;
  END IF;

  -- Calculate new streak
  IF v_last_activity = p_last_activity_date - interval '1 day' THEN
    v_new_streak := v_current_streak + 1;
  ELSE
    v_new_streak := 1;
  END IF;

  UPDATE user_streaks
  SET current_streak = v_new_streak,
      longest_streak = GREATEST(v_longest_streak, v_new_streak),
      last_activity_date = p_last_activity_date,
      total_points = total_points + 10,
      updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;

-- 6. Restrict user_challenge_progress UPDATE
DROP POLICY IF EXISTS "Users can update own challenge progress" ON public.user_challenge_progress;

-- Create secure function for challenge progress
CREATE OR REPLACE FUNCTION public.increment_challenge_progress(
  p_user_id uuid,
  p_challenge_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_goal_count integer;
  v_current_count integer;
BEGIN
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Get goal from challenge
  SELECT goal_count INTO v_goal_count
  FROM weekly_challenges
  WHERE id = p_challenge_id AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Challenge not found or inactive';
  END IF;

  -- Get or create progress
  INSERT INTO user_challenge_progress (user_id, challenge_id, current_count)
  VALUES (p_user_id, p_challenge_id, 1)
  ON CONFLICT (user_id, challenge_id) DO UPDATE
  SET current_count = user_challenge_progress.current_count + 1,
      completed = (user_challenge_progress.current_count + 1) >= v_goal_count,
      completed_at = CASE 
        WHEN (user_challenge_progress.current_count + 1) >= v_goal_count THEN now()
        ELSE NULL
      END,
      updated_at = now()
  WHERE user_challenge_progress.completed = false;
END;
$$;
