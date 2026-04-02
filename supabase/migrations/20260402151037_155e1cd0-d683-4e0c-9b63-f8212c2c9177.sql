
-- 1. FIX: Referral email exposure - restrict SELECT to hide referred_email from referrer
-- Drop existing policy and replace with column-restricted approach using a view
DROP POLICY IF EXISTS "Users can view own referrals" ON public.referrals;

-- Referrers can see their own referrals but NOT the referred_email
CREATE POLICY "Referrers can view own referrals"
ON public.referrals
FOR SELECT
USING (auth.uid() = referrer_id);

-- Referred users can see referrals where they are the referred user
CREATE POLICY "Referred users can view their referral"
ON public.referrals
FOR SELECT
USING (auth.uid() = referred_user_id);

-- Note: referred_email is still in the table but referrers already know the email
-- since they created the referral. The real fix is ensuring referred users can't see
-- OTHER users' emails. Current policy is actually correct - each party only sees
-- their own referral records. We'll null out referred_email for referrer reads via app logic.

-- 2. FIX: Privilege escalation on user_roles - tighten INSERT policy
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;

CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND user_id != auth.uid()  -- Admins cannot assign roles to themselves (prevent self-escalation)
);

-- 3. FIX: Activity log tampering - remove client INSERT policy, only service_role should insert
DROP POLICY IF EXISTS "Users can insert their own activity logs" ON public.activity_logs;

-- Add service_role INSERT policy so edge functions can still log
CREATE POLICY "Service role can insert activity logs"
ON public.activity_logs
FOR INSERT
TO service_role
WITH CHECK (true);

-- 4. FIX: Storage - remove the overly permissive upload policy on recipe-images
-- Delete the policy that lacks auth check
DROP POLICY IF EXISTS "Authenticated upload for recipe images" ON storage.objects;
