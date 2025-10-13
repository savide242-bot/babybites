-- Fix profiles RLS policy to require authentication
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;

CREATE POLICY "Authenticated users can view profiles" 
ON profiles 
FOR SELECT 
USING (auth.role() = 'authenticated');