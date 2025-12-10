-- Create storage bucket for AI-generated recipe images
INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-images', 'recipe-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to recipe images
CREATE POLICY "Public read access for recipe images"
ON storage.objects FOR SELECT
USING (bucket_id = 'recipe-images');

-- Allow authenticated users to upload recipe images
CREATE POLICY "Authenticated users can upload recipe images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'recipe-images' AND auth.role() = 'authenticated');

-- Allow service role to manage recipe images
CREATE POLICY "Service role can manage recipe images"
ON storage.objects FOR ALL
USING (bucket_id = 'recipe-images')
WITH CHECK (bucket_id = 'recipe-images');