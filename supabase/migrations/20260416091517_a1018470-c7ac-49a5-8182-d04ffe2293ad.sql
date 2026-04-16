
-- Update the trigger function to also check current_user
CREATE OR REPLACE FUNCTION public.protect_privileged_profile_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  -- Service role and superuser bypass
  IF current_setting('role', true) = 'service_role' 
     OR current_setting('request.jwt.claims', true) IS NULL
     OR current_setting('request.jwt.claims', true) = '' THEN
    RETURN NEW;
  END IF;
  
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.is_verified_pediatrician := OLD.is_verified_pediatrician;
    NEW.is_banned := OLD.is_banned;
    NEW.banned_at := OLD.banned_at;
    NEW.banned_reason := OLD.banned_reason;
  END IF;
  RETURN NEW;
END;
$$;
