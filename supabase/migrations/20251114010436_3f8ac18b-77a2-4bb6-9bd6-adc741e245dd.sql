-- Add has_seen_welcome column to user_preferences table
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS has_seen_welcome boolean DEFAULT false;