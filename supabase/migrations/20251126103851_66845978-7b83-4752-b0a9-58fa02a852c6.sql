-- Fix handle_new_user trigger to support Google OAuth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_full_name text;
  v_mother_name text;
  v_baby_name text;
BEGIN
  -- Extract name from Google OAuth or email signup
  v_full_name := COALESCE(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1),
    'User'
  );
  
  v_mother_name := COALESCE(
    new.raw_user_meta_data->>'mother_name',
    v_full_name
  );
  
  v_baby_name := new.raw_user_meta_data->>'baby_name';
  
  INSERT INTO public.profiles (id, full_name, mother_name, baby_name)
  VALUES (new.id, v_full_name, v_mother_name, v_baby_name);
  
  RETURN new;
END;
$function$;

-- Create user_sessions table for activity tracking
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_login timestamp with time zone DEFAULT now(),
  last_active timestamp with time zone DEFAULT now(),
  total_sessions integer DEFAULT 1,
  device_info text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own sessions"
ON public.user_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
ON public.user_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
ON public.user_sessions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions"
ON public.user_sessions FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_active ON public.user_sessions(last_active DESC);

-- Backfill missing profiles for existing users with proper fallbacks
INSERT INTO public.profiles (id, full_name, mother_name, baby_name)
SELECT 
  au.id,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    split_part(au.email, '@', 1),
    'User'
  ) as full_name,
  COALESCE(
    au.raw_user_meta_data->>'mother_name',
    au.raw_user_meta_data->>'name',
    split_part(au.email, '@', 1),
    'User'
  ) as mother_name,
  au.raw_user_meta_data->>'baby_name' as baby_name
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;