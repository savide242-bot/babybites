-- Add new columns to scanned_products table for enhanced product verification
ALTER TABLE scanned_products
ADD COLUMN IF NOT EXISTS barcode_type VARCHAR(20),
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_source VARCHAR(50),
ADD COLUMN IF NOT EXISTS allergens TEXT[],
ADD COLUMN IF NOT EXISTS nutrition_grade VARCHAR(1),
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS brands TEXT;