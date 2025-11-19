-- Create recipe_views table for tracking recipe view history
CREATE TABLE public.recipe_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  recipe_id TEXT NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recipe_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own recipe history"
  ON public.recipe_views
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add recipe views"
  ON public.recipe_views
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_recipe_views_user_id ON public.recipe_views(user_id);
CREATE INDEX idx_recipe_views_recipe_id ON public.recipe_views(recipe_id);
CREATE INDEX idx_recipe_views_viewed_at ON public.recipe_views(viewed_at DESC);