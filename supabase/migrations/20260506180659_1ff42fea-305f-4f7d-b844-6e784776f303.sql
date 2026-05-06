CREATE TABLE IF NOT EXISTS public.content_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_key text NOT NULL,
  language text NOT NULL,
  translated_text text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (content_key, language)
);

CREATE INDEX IF NOT EXISTS idx_content_translations_lookup ON public.content_translations (content_key, language);

ALTER TABLE public.content_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read translations"
ON public.content_translations
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Service role can insert translations"
ON public.content_translations
FOR INSERT
TO service_role
WITH CHECK (true);