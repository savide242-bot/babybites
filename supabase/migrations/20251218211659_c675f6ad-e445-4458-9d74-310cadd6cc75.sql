-- Add timezone column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

-- Add a comment explaining the column
COMMENT ON COLUMN public.profiles.timezone IS 'User timezone in IANA format (e.g., Africa/Maputo, Europe/Lisbon)';