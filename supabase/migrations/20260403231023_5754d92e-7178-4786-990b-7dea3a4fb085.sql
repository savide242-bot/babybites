
-- Step 1: Delete duplicate user_sessions, keeping only the most recent per user_id
DELETE FROM public.user_sessions
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM public.user_sessions
  ORDER BY user_id, COALESCE(last_active, created_at) DESC
);

-- Step 2: Add unique constraint on user_id
ALTER TABLE public.user_sessions
ADD CONSTRAINT user_sessions_user_id_unique UNIQUE (user_id);
