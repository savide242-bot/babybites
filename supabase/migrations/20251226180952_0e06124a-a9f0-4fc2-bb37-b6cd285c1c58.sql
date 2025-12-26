-- Add has_completed_tour field to user_preferences table
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS has_completed_tour BOOLEAN DEFAULT FALSE;