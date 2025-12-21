
-- =====================================================
-- FASE 5: Baby Food Diary - Track liked/rejected foods
-- =====================================================
CREATE TABLE IF NOT EXISTS public.food_diary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  food_name TEXT NOT NULL,
  reaction TEXT NOT NULL CHECK (reaction IN ('loved', 'liked', 'neutral', 'disliked', 'rejected', 'allergic')),
  tried_at DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  recipe_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.food_diary ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own food diary" 
ON public.food_diary 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create food diary entries" 
ON public.food_diary 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own food diary entries" 
ON public.food_diary 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own food diary entries" 
ON public.food_diary 
FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_food_diary_updated_at
BEFORE UPDATE ON public.food_diary
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- Developmental milestones alerts viewed tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS public.milestone_alerts_viewed (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  milestone_month INTEGER NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, milestone_month)
);

-- Enable RLS
ALTER TABLE public.milestone_alerts_viewed ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own milestone alerts" 
ON public.milestone_alerts_viewed 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create milestone alerts" 
ON public.milestone_alerts_viewed 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);
