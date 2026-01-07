-- First, deduplicate existing meal_plans keeping only the most recent record for each unique combination
WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY user_id, week_start_date, day_of_week, meal_type
           ORDER BY created_at DESC NULLS LAST, id DESC
         ) as rn
  FROM public.meal_plans
)
DELETE FROM public.meal_plans
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Add unique constraint for meal plans
ALTER TABLE public.meal_plans
ADD CONSTRAINT meal_plans_unique_slot 
UNIQUE (user_id, week_start_date, day_of_week, meal_type);