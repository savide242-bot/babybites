-- Create food_analyses table for AI food analysis history
CREATE TABLE public.food_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  image_url TEXT,
  baby_age_months INTEGER NOT NULL,
  identified_food TEXT NOT NULL,
  is_recommended BOOLEAN NOT NULL DEFAULT false,
  recommendation_reason TEXT,
  estimated_calories INTEGER,
  estimated_protein_g NUMERIC,
  estimated_carbs_g NUMERIC,
  estimated_fats_g NUMERIC,
  vitamins TEXT[],
  minerals TEXT[],
  allergens TEXT[],
  choking_risk TEXT,
  preparation_tips TEXT,
  suggested_recipes TEXT[],
  confidence_score NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.food_analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own food analyses"
ON public.food_analyses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create food analyses"
ON public.food_analyses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own food analyses"
ON public.food_analyses FOR DELETE
USING (auth.uid() = user_id);

-- Add baby_birth_date to profiles for automatic age calculation
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS baby_birth_date DATE;