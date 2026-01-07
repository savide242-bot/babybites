-- Drop the old unique constraint that doesn't include week_start_date
ALTER TABLE public.meal_plans 
DROP CONSTRAINT IF EXISTS meal_plans_user_id_day_of_week_meal_type_key;