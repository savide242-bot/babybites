-- Add dietary preferences column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN dietary_preferences TEXT[] DEFAULT '{}';

-- Create index for faster queries on dietary preferences
CREATE INDEX idx_profiles_dietary_preferences ON public.profiles USING GIN(dietary_preferences);