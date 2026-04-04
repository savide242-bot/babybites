
CREATE TABLE public.food_introduction_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  food_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_introduced',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, food_key)
);

ALTER TABLE public.food_introduction_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own food progress"
ON public.food_introduction_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own food progress"
ON public.food_introduction_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own food progress"
ON public.food_introduction_progress FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own food progress"
ON public.food_introduction_progress FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_food_introduction_progress_updated_at
BEFORE UPDATE ON public.food_introduction_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
