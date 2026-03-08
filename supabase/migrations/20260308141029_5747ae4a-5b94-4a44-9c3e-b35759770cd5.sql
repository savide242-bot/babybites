
-- Fix security definer view - use SECURITY INVOKER instead
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = true)
AS
SELECT id, full_name, avatar_url, bio, is_verified_pediatrician
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- Also clean up duplicate SELECT policies on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
-- Keep only "Users can view own full profile"
