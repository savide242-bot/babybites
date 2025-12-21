-- Create recipe-images storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('recipe-images', 'recipe-images', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Public read access for recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload for recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Service role manage recipe images" ON storage.objects;

-- Allow public read access to recipe images
CREATE POLICY "Public read access for recipe images"
ON storage.objects FOR SELECT
USING (bucket_id = 'recipe-images');

-- Allow authenticated uploads
CREATE POLICY "Authenticated upload for recipe images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'recipe-images');

-- Allow updates and deletes
CREATE POLICY "Service role manage recipe images"
ON storage.objects FOR ALL
USING (bucket_id = 'recipe-images');