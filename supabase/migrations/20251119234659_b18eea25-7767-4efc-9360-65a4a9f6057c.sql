-- Add prepared tracking to meal plans
ALTER TABLE meal_plans ADD COLUMN prepared BOOLEAN DEFAULT false;

-- Add index for faster queries on prepared meals
CREATE INDEX idx_meal_plans_prepared ON meal_plans(user_id, prepared);