-- 1. Fix referral reward fraud: remove client-side UPDATE entirely
DROP POLICY IF EXISTS "Users can update own referrals" ON public.referrals;

-- 2. Fix fake challenge completion on insert: enforce initial values
DROP POLICY IF EXISTS "Users can create own challenge progress" ON public.user_challenge_progress;

CREATE POLICY "Users can create own challenge progress"
ON public.user_challenge_progress
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND completed = false
  AND current_count = 0
);

-- 3. Fix forum data exposure to unauthenticated users
DROP POLICY IF EXISTS "Forum posts are viewable by everyone" ON public.forum_posts;
CREATE POLICY "Forum posts viewable by authenticated users"
ON public.forum_posts
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.post_comments;
CREATE POLICY "Comments viewable by authenticated users"
ON public.post_comments
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.post_likes;
CREATE POLICY "Likes viewable by authenticated users"
ON public.post_likes
FOR SELECT
TO authenticated
USING (true);