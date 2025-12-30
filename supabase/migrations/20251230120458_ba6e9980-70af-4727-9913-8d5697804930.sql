-- Backfill data from notification_preferences to baby_meal_times
-- This ensures all existing meal time configurations are available for push notifications

-- Create unique constraint if it doesn't exist (for upsert operations)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'baby_meal_times_user_meal_unique'
  ) THEN
    ALTER TABLE public.baby_meal_times
    ADD CONSTRAINT baby_meal_times_user_meal_unique UNIQUE (user_id, meal_type);
  END IF;
END $$;

-- Insert meal times from notification_preferences into baby_meal_times
-- Only insert if not already exists
INSERT INTO public.baby_meal_times (user_id, meal_type, preferred_hour, preferred_minute, enabled)
SELECT 
  np.user_id,
  np.meal_type,
  np.hour as preferred_hour,
  np.minute as preferred_minute,
  np.enabled
FROM public.notification_preferences np
WHERE np.meal_type IN ('breakfast', 'morning-snack', 'lunch', 'afternoon-snack', 'dinner')
ON CONFLICT (user_id, meal_type) 
DO UPDATE SET
  preferred_hour = EXCLUDED.preferred_hour,
  preferred_minute = EXCLUDED.preferred_minute,
  enabled = EXCLUDED.enabled,
  updated_at = now();