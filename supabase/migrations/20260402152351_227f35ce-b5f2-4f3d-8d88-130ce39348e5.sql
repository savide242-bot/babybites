
-- 1. Remove unused referred_email column from referrals
ALTER TABLE public.referrals DROP COLUMN IF EXISTS referred_email;

-- 2. Protect privileged profile fields with a BEFORE UPDATE trigger
CREATE OR REPLACE FUNCTION public.protect_privileged_profile_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the caller is NOT an admin, revert privileged fields to their old values
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.is_verified_pediatrician := OLD.is_verified_pediatrician;
    NEW.is_banned := OLD.is_banned;
    NEW.banned_at := OLD.banned_at;
    NEW.banned_reason := OLD.banned_reason;
  END IF;
  RETURN NEW;
END;
$$;

-- Attach the trigger
DROP TRIGGER IF EXISTS protect_profiles_privileged_fields ON public.profiles;
CREATE TRIGGER protect_profiles_privileged_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_privileged_profile_fields();
