-- Create recipe image overrides table for the duplicate repair pipeline
CREATE TABLE public.recipe_image_overrides (
  recipe_id TEXT PRIMARY KEY,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recipe_image_overrides ENABLE ROW LEVEL SECURITY;

-- Everyone can read overrides (needed to display images)
CREATE POLICY "Anyone can read recipe image overrides"
ON public.recipe_image_overrides
FOR SELECT
USING (true);

-- Only service role can write (via edge function)
-- No INSERT/UPDATE/DELETE policies for regular users

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_recipe_image_overrides_updated_at
BEFORE UPDATE ON public.recipe_image_overrides
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE public.recipe_image_overrides IS 'Stores regenerated recipe images to fix duplicates. Writes only via fix-recipe-images edge function.';