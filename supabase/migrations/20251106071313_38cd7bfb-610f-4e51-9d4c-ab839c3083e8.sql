-- Create meal plans table
CREATE TABLE public.meal_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  day_of_week TEXT NOT NULL,
  meal_type TEXT NOT NULL,
  recipe_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, day_of_week, meal_type)
);

-- Enable RLS
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own meal plans"
ON public.meal_plans FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own meal plans"
ON public.meal_plans FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal plans"
ON public.meal_plans FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal plans"
ON public.meal_plans FOR DELETE
USING (auth.uid() = user_id);

-- Create shopping list items table
CREATE TABLE public.shopping_list_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ingredient TEXT NOT NULL,
  category TEXT NOT NULL,
  checked BOOLEAN DEFAULT false,
  from_recipe TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own shopping items"
ON public.shopping_list_items FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own shopping items"
ON public.shopping_list_items FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shopping items"
ON public.shopping_list_items FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own shopping items"
ON public.shopping_list_items FOR DELETE
USING (auth.uid() = user_id);