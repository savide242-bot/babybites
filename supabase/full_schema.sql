-- ==========================================
-- BABYBITES CONSOLIDATED DATABASE SCHEMA
-- Generated for Independent Supabase Project
-- ==========================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. CORE HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 4. PRE-CREATED CORE TABLES (Required by later policies/triggers)

-- user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text = _role
  )
$$;

-- activity_logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  action_details jsonb,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- admin_notifications
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action_label text,
  action_url text,
  icon text,
  recipients_count integer DEFAULT 0,
  successful_count integer DEFAULT 0,
  failed_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- content_translations
CREATE TABLE IF NOT EXISTS public.content_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_key text NOT NULL,
  language text NOT NULL,
  translated_text text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);
ALTER TABLE public.content_translations ENABLE ROW LEVEL SECURITY;


-- >>> Migration: 20251012163253_00fbe9a3-b510-47db-ada8-b7e7517d728c.sql <<<
-- Create profiles table with verified pediatrician flag
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  is_verified_pediatrician BOOLEAN DEFAULT FALSE,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create forum posts table
CREATE TABLE IF NOT EXISTS public.forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_urls TEXT[],
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Forum posts are viewable by everyone"
  ON public.forum_posts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create posts"
  ON public.forum_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON public.forum_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON public.forum_posts FOR DELETE
  USING (auth.uid() = user_id);

-- Create comments table
CREATE TABLE IF NOT EXISTS public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by everyone"
  ON public.post_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON public.post_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.post_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Create likes table
CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes are viewable by everyone"
  ON public.post_likes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can like posts"
  ON public.post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
  ON public.post_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Create saved posts table
CREATE TABLE IF NOT EXISTS public.saved_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(post_id, user_id)
);

ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved posts"
  ON public.saved_posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save posts"
  ON public.saved_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave posts"
  ON public.saved_posts FOR DELETE
  USING (auth.uid() = user_id);

-- Create baby growth records table
CREATE TABLE IF NOT EXISTS public.baby_growth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  baby_name TEXT NOT NULL,
  weight_kg DECIMAL(5,2),
  height_cm DECIMAL(5,2),
  milestone TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.baby_growth ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own baby growth records"
  ON public.baby_growth FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own baby growth records"
  ON public.baby_growth FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own baby growth records"
  ON public.baby_growth FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own baby growth records"
  ON public.baby_growth FOR DELETE
  USING (auth.uid() = user_id);

-- Create meal logs table
CREATE TABLE IF NOT EXISTS public.meal_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  baby_name TEXT NOT NULL,
  meal_type TEXT NOT NULL,
  recipe_title TEXT,
  ingredients TEXT[],
  calories INTEGER,
  protein_g DECIMAL(5,2),
  carbs_g DECIMAL(5,2),
  fats_g DECIMAL(5,2),
  eaten_at TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meal logs"
  ON public.meal_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own meal logs"
  ON public.meal_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal logs"
  ON public.meal_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal logs"
  ON public.meal_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Create scanned products table
CREATE TABLE IF NOT EXISTS public.scanned_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  barcode TEXT NOT NULL,
  product_name TEXT,
  is_baby_safe BOOLEAN,
  safety_notes TEXT,
  suggested_recipes TEXT[],
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.scanned_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own scanned products"
  ON public.scanned_products FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create scanned products"
  ON public.scanned_products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Triggers for updating counts
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forum_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.forum_posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_likes_count_trigger
AFTER INSERT OR DELETE ON public.post_likes
FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forum_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.forum_posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_comments_count_trigger
AFTER INSERT OR DELETE ON public.post_comments
FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- Trigger for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forum_posts_updated_at
BEFORE UPDATE ON public.forum_posts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- >>> Migration: 20251012163340_13e90b86-b284-4952-b275-ee400d452336.sql <<<
-- Fix security warnings by setting search_path for all functions
DROP TRIGGER IF EXISTS post_likes_count_trigger ON public.post_likes;
DROP TRIGGER IF EXISTS post_comments_count_trigger ON public.post_comments;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_forum_posts_updated_at ON public.forum_posts;

DROP FUNCTION IF EXISTS update_post_likes_count();
DROP FUNCTION IF EXISTS update_post_comments_count();
DROP FUNCTION IF EXISTS update_updated_at_column();

CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forum_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.forum_posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER post_likes_count_trigger
AFTER INSERT OR DELETE ON public.post_likes
FOR EACH ROW EXECUTE FUNCTION update_post_likes_count();

CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forum_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.forum_posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER post_comments_count_trigger
AFTER INSERT OR DELETE ON public.post_comments
FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_forum_posts_updated_at
BEFORE UPDATE ON public.forum_posts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- >>> Migration: 20251013140318_374b2847-e065-486d-b07a-c07130de9a55.sql <<<
-- Fix profiles RLS policy to require authentication
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;

CREATE POLICY "Authenticated users can view profiles" 
ON profiles 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- >>> Migration: 20251029113354_fbbeafe6-576c-4cf9-bc6a-033f9984bf70.sql <<<
-- Create user preferences table for storing language and other settings
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  language text NOT NULL DEFAULT 'en',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own preferences
CREATE POLICY "Users can view own preferences"
ON public.user_preferences
FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to insert their own preferences
CREATE POLICY "Users can insert own preferences"
ON public.user_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own preferences
CREATE POLICY "Users can update own preferences"
ON public.user_preferences
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update existing tables to work with anonymous users
-- Remove foreign key constraints that reference auth.users since anonymous users should work seamlessly

-- >>> Migration: 20251106071313_38cd7bfb-610f-4e51-9d4c-ab839c3083e8.sql <<<
-- Create meal plans table
CREATE TABLE IF NOT EXISTS public.meal_plans (
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
CREATE TABLE IF NOT EXISTS public.shopping_list_items (
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

-- >>> Migration: 20251114010436_3f8ac18b-77a2-4bb6-9bd6-adc741e245dd.sql <<<
-- Add has_seen_welcome column to user_preferences table
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS has_seen_welcome boolean DEFAULT false;

-- >>> Migration: 20251116214711_f50e090c-5ce1-4a55-9e93-f2c956cc48de.sql <<<
-- Add mother_name and baby_name to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS mother_name TEXT,
ADD COLUMN IF NOT EXISTS baby_name TEXT;

-- Update the handle_new_user function to include new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, mother_name, baby_name)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'mother_name',
    new.raw_user_meta_data->>'baby_name'
  );
  RETURN new;
END;
$$;

-- >>> Migration: 20251116220355_3b2a6067-f155-4f7d-a43f-e80bec86fcbc.sql <<<
-- Create daily_tasks table for tracking task completion
CREATE TABLE IF NOT EXISTS public.daily_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  task_type TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  task_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for fast queries
CREATE INDEX IF NOT EXISTS idx_daily_tasks_user_date ON public.daily_tasks(user_id, task_date);

-- Enable Row Level Security
ALTER TABLE public.daily_tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own tasks"
  ON public.daily_tasks
  FOR ALL
  USING (auth.uid() = user_id);

-- >>> Migration: 20251119201507_836f090f-edbf-4ece-b3b4-cc481792f795.sql <<<
-- Add new columns to scanned_products table for enhanced product verification
ALTER TABLE scanned_products
ADD COLUMN IF NOT EXISTS barcode_type VARCHAR(20),
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_source VARCHAR(50),
ADD COLUMN IF NOT EXISTS allergens TEXT[],
ADD COLUMN IF NOT EXISTS nutrition_grade VARCHAR(1),
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS brands TEXT;

-- >>> Migration: 20251119233252_b41f25cb-cf32-4244-a29d-411a40dd2d11.sql <<<
-- Create favorite_recipes table
CREATE TABLE IF NOT EXISTS public.favorite_recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  recipe_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, recipe_id)
);

-- Enable RLS
ALTER TABLE public.favorite_recipes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own favorites"
  ON public.favorite_recipes
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
  ON public.favorite_recipes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorites"
  ON public.favorite_recipes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_favorite_recipes_user_id ON public.favorite_recipes(user_id);
CREATE INDEX idx_favorite_recipes_recipe_id ON public.favorite_recipes(recipe_id);

-- >>> Migration: 20251119233835_4ecf0966-a0b2-44dc-ad25-e496b6bdd1a8.sql <<<
-- Create recipe_views table for tracking recipe view history
CREATE TABLE IF NOT EXISTS public.recipe_views (
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

-- >>> Migration: 20251119234137_06f8fae5-c213-444d-92db-35b3126a8e95.sql <<<
-- Add dietary preferences column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN dietary_preferences TEXT[] DEFAULT '{}';

-- Create index for faster queries on dietary preferences
CREATE INDEX idx_profiles_dietary_preferences ON public.profiles USING GIN(dietary_preferences);

-- >>> Migration: 20251119234659_b18eea25-7767-4efc-9360-65a4a9f6057c.sql <<<
-- Add prepared tracking to meal plans
ALTER TABLE meal_plans ADD COLUMN prepared BOOLEAN DEFAULT false;

-- Add index for faster queries on prepared meals
CREATE INDEX idx_meal_plans_prepared ON meal_plans(user_id, prepared);

-- >>> Migration: 20251120002151_c45ead7f-99d6-48b4-9724-a457216bc209.sql <<<
-- Create push_subscriptions table for PWA update notifications
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  keys JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own subscriptions"
  ON public.push_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions"
  ON public.push_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
  ON public.push_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions"
  ON public.push_subscriptions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- >>> Migration: 20251120011541_c913fae8-14cf-4fd5-b5f6-3f1f7140f74b.sql <<<
-- Create table for chat message history
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  conversation_id UUID NOT NULL DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own chat messages"
ON public.chat_messages
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat messages"
ON public.chat_messages
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat messages"
ON public.chat_messages
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_chat_messages_user_conversation ON public.chat_messages(user_id, conversation_id, created_at);

-- Create table for daily motivational tips
CREATE TABLE IF NOT EXISTS public.daily_tips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tip_text TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert some motivational tips
INSERT INTO public.daily_tips (tip_text, category) VALUES
  ('Every meal is a chance to nourish your baby''s growth and development 💪', 'nutrition'),
  ('Babies learn by watching you eat - model healthy eating habits! 🥗', 'parenting'),
  ('Introducing one new food at a time helps identify potential allergies 🍎', 'safety'),
  ('Homemade baby food retains more nutrients than store-bought options 🌟', 'nutrition'),
  ('Patience is key - babies may need 10-15 tries before accepting new foods 🍽️', 'parenting'),
  ('Colorful plates encourage babies to try different foods 🌈', 'tips'),
  ('Meal planning saves time and reduces stress during busy weeks 📅', 'planning'),
  ('Track your baby''s favorite recipes to build personalized meal rotations 📝', 'planning'),
  ('Fresh herbs add flavor without salt - perfect for baby meals 🌿', 'nutrition'),
  ('Batch cooking and freezing meals is a game-changer for busy parents! ❄️', 'tips');

-- Make daily_tips readable by authenticated users
ALTER TABLE public.daily_tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view daily tips"
ON public.daily_tips
FOR SELECT
USING (auth.role() = 'authenticated');

-- >>> Migration: 20251124162306_dbde842a-83c4-46ce-972a-7bec47fbaf95.sql <<<
-- Create table for notification preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'morning-snack', 'lunch', 'afternoon-snack', 'dinner')),
  hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
  minute INTEGER NOT NULL CHECK (minute >= 0 AND minute <= 59),
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, meal_type)
);

-- Enable Row Level Security
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own notification preferences" 
ON public.notification_preferences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notification preferences" 
ON public.notification_preferences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences" 
ON public.notification_preferences 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notification preferences" 
ON public.notification_preferences 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- >>> Migration: 20251126103851_66845978-7b83-4752-b0a9-58fa02a852c6.sql <<<
-- Fix handle_new_user trigger to support Google OAuth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_full_name text;
  v_mother_name text;
  v_baby_name text;
BEGIN
  -- Extract name from Google OAuth or email signup
  v_full_name := COALESCE(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1),
    'User'
  );
  
  v_mother_name := COALESCE(
    new.raw_user_meta_data->>'mother_name',
    v_full_name
  );
  
  v_baby_name := new.raw_user_meta_data->>'baby_name';
  
  INSERT INTO public.profiles (id, full_name, mother_name, baby_name)
  VALUES (new.id, v_full_name, v_mother_name, v_baby_name);
  
  RETURN new;
END;
$function$;

-- Create user_sessions table for activity tracking
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_login timestamp with time zone DEFAULT now(),
  last_active timestamp with time zone DEFAULT now(),
  total_sessions integer DEFAULT 1,
  device_info text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own sessions"
ON public.user_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
ON public.user_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
ON public.user_sessions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all sessions"
ON public.user_sessions FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_active ON public.user_sessions(last_active DESC);

-- Backfill missing profiles for existing users with proper fallbacks
INSERT INTO public.profiles (id, full_name, mother_name, baby_name)
SELECT 
  au.id,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    split_part(au.email, '@', 1),
    'User'
  ) as full_name,
  COALESCE(
    au.raw_user_meta_data->>'mother_name',
    au.raw_user_meta_data->>'name',
    split_part(au.email, '@', 1),
    'User'
  ) as mother_name,
  au.raw_user_meta_data->>'baby_name' as baby_name
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- >>> Migration: 20251202184829_7d66eea3-c492-4d9d-a85b-d445adbc7c44.sql <<<
-- Create food_analyses table for AI food analysis history
CREATE TABLE IF NOT EXISTS public.food_analyses (
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

-- >>> Migration: 20251204113818_f4aa2496-0887-4f72-b0ed-0384e70b612a.sql <<<
-- Create user_streaks table for tracking daily streaks
CREATE TABLE IF NOT EXISTS public.user_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  total_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create user_badges table for achievements
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Enable RLS
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_streaks
CREATE POLICY "Users can view their own streaks" ON public.user_streaks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streaks" ON public.user_streaks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks" ON public.user_streaks
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for user_badges
CREATE POLICY "Users can view their own badges" ON public.user_badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badges" ON public.user_badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_streaks_updated_at
  BEFORE UPDATE ON public.user_streaks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- >>> Migration: 20251210232818_557197cd-4be6-4a27-8e89-e20b70b46087.sql <<<
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

-- >>> Migration: 20251218182113_f383d2c9-91ae-40c3-a695-4d6894bdca9f.sql <<<
-- Create daily_checkins table for one-click emotional check-ins
CREATE TABLE IF NOT EXISTS public.daily_checkins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL CHECK (status IN ('ate_well', 'rejected', 'tried_new')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, checkin_date)
);

-- Enable RLS
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own checkins" ON public.daily_checkins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own checkins" ON public.daily_checkins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checkins" ON public.daily_checkins
  FOR UPDATE USING (auth.uid() = user_id);

-- Create weekly_challenges table for time-limited challenges
CREATE TABLE IF NOT EXISTS public.weekly_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  goal_count INTEGER NOT NULL DEFAULT 5,
  reward_points INTEGER NOT NULL DEFAULT 50,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('variety', 'consistency', 'exploration', 'recipes')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS - challenges are public to view
ALTER TABLE public.weekly_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active challenges" ON public.weekly_challenges
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create user_challenge_progress to track user progress on challenges
CREATE TABLE IF NOT EXISTS public.user_challenge_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES public.weekly_challenges(id) ON DELETE CASCADE,
  current_count INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

-- Enable RLS
ALTER TABLE public.user_challenge_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own challenge progress" ON public.user_challenge_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own challenge progress" ON public.user_challenge_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own challenge progress" ON public.user_challenge_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Add age_range to daily_tips for personalized tips
ALTER TABLE public.daily_tips ADD COLUMN IF NOT EXISTS age_range TEXT DEFAULT 'all';
ALTER TABLE public.daily_tips ADD COLUMN IF NOT EXISTS display_date DATE;

-- Create trigger for updated_at on user_challenge_progress
CREATE TRIGGER update_user_challenge_progress_updated_at
  BEFORE UPDATE ON public.user_challenge_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- >>> Migration: 20251218182907_0b4911c3-62df-4267-8877-1d91506d02ee.sql <<<
-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage to postgres user
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- >>> Migration: 20251218184211_c5d1452a-e0dd-4bae-b14d-ab55c4466d08.sql <<<
-- Schedule the rotate-challenges edge function to run daily at midnight UTC
SELECT cron.schedule(
  'rotate-weekly-challenges',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://bdkfoxzlndwxvzbbrbgl.supabase.co/functions/v1/rotate-challenges',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJka2ZveHpsbmR3eHZ6YmJyYmdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMDEyODIsImV4cCI6MjA3NTc3NzI4Mn0.HRzvs3g2hhRHnebFSAr6LLIqOHcPWpOOrWI8UwAfYlc'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- >>> Migration: 20251218184902_fa67750b-d1da-453f-a9f8-80ac9d45a302.sql <<<
-- =====================================================
-- FASE 4: Tabela de Conteúdo Diário Enriquecido
-- =====================================================
CREATE TABLE IF NOT EXISTS public.daily_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL CHECK (content_type IN ('safe_food', 'common_mistake', 'quick_tip', 'try_today')),
  title TEXT NOT NULL,
  content_text TEXT NOT NULL,
  age_range TEXT,
  icon TEXT DEFAULT '💡',
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_content ENABLE ROW LEVEL SECURITY;

-- Public read policy for daily content
CREATE POLICY "Anyone can read daily content"
ON public.daily_content FOR SELECT
USING (is_active = true);

-- =====================================================
-- FASE 5: Adicionar campos de recuperação de streak
-- =====================================================
ALTER TABLE public.user_streaks 
ADD COLUMN IF NOT EXISTS streak_freezes_available INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS last_freeze_reset_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS grace_period_eligible BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS grace_period_days_missed INTEGER DEFAULT 0;

-- =====================================================
-- FASE 2: Tabela de preferências de notificações de engagement
-- =====================================================
ALTER TABLE public.notification_preferences 
ADD COLUMN IF NOT EXISTS checkin_reminder_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS challenge_alerts_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS achievement_celebration_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS streak_risk_alerts_enabled BOOLEAN DEFAULT true;

-- =====================================================
-- Inserir conteúdo inicial para Fase 4
-- =====================================================
INSERT INTO public.daily_content (content_type, title, content_text, age_range, icon, day_of_week) VALUES
-- Segunda-feira: Dica rápida
('quick_tip', 'Dica Rápida', 'Ofereça o mesmo alimento pelo menos 10-15 vezes antes de desistir. A rejeição inicial é normal!', '6-12', '⚡', 1),
('quick_tip', 'Dica Rápida', 'Deixe o bebé explorar a comida com as mãos. Isso ajuda no desenvolvimento sensorial.', '6-9', '⚡', 1),

-- Terça-feira: Alimento seguro
('safe_food', 'Alimento Seguro do Dia', 'Banana madura é perfeita para começar! Rica em potássio e fácil de mastigar.', '6-12', '🥕', 2),
('safe_food', 'Alimento Seguro do Dia', 'Abacate amassado é rico em gorduras saudáveis essenciais para o cérebro do bebé.', '6-12', '🥕', 2),

-- Quarta-feira: Erro comum
('common_mistake', 'Erro Comum', '90% das mães adicionam sal antes dos 12 meses. Os rins do bebé ainda não processam bem o sódio!', '6-12', '⚠️', 3),
('common_mistake', 'Erro Comum', 'Misturar muitos alimentos novos de uma vez dificulta identificar alergias. Introduza um de cada vez.', '6-12', '⚠️', 3),

-- Quinta-feira: Experimentar hoje
('try_today', 'Para Experimentar Hoje', 'Que tal palitos de cenoura cozida? Ótimos para praticar a pinça e mastigação!', '9-12', '🍽️', 4),
('try_today', 'Para Experimentar Hoje', 'Purê de maçã com canela é uma ótima opção para apresentar novos sabores.', '6-9', '🍽️', 4),

-- Sexta-feira: Dica rápida
('quick_tip', 'Dica Rápida', 'Comer em família ajuda o bebé a aprender observando. Façam refeições juntos!', '6-12', '⚡', 5),
('quick_tip', 'Dica Rápida', 'Temperatura morna é ideal. Teste sempre no pulso antes de oferecer.', '6-12', '⚡', 5),

-- Sábado: Conteúdo especial
('safe_food', 'Fim de Semana Saudável', 'Panquecas de banana são perfeitas para um café da manhã em família!', '9-12', '🌟', 6),

-- Domingo: Conteúdo especial  
('try_today', 'Domingo de Novidades', 'Aproveite o fim de semana para preparar receitas novas com calma.', '6-12', '🌟', 0);

-- =====================================================
-- Tabela para histórico de desafios completados (Fase 3)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.completed_challenges_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES public.weekly_challenges(id) ON DELETE CASCADE,
  challenge_title TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reward_points INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.completed_challenges_history ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own challenge history"
ON public.completed_challenges_history FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own challenge history"
ON public.completed_challenges_history FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_completed_challenges_user_id 
ON public.completed_challenges_history(user_id);

-- =====================================================
-- Trigger para guardar histórico quando desafio é completado
-- =====================================================
CREATE OR REPLACE FUNCTION public.save_challenge_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed = true AND (OLD.completed = false OR OLD.completed IS NULL) THEN
    INSERT INTO public.completed_challenges_history (user_id, challenge_id, challenge_title, reward_points)
    SELECT NEW.user_id, NEW.challenge_id, wc.title, wc.reward_points
    FROM public.weekly_challenges wc
    WHERE wc.id = NEW.challenge_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_challenge_completed ON public.user_challenge_progress;

CREATE TRIGGER on_challenge_completed
  AFTER UPDATE ON public.user_challenge_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.save_challenge_completion();

-- >>> Migration: 20251218193419_2cda4110-7892-44f4-8830-aea100128ffb.sql <<<
-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars bucket
CREATE POLICY "Users can upload own avatar" ON storage.objects 
  FOR INSERT TO authenticated 
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own avatar" ON storage.objects 
  FOR UPDATE TO authenticated 
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view avatars" ON storage.objects 
  FOR SELECT TO public 
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can delete own avatar" ON storage.objects 
  FOR DELETE TO authenticated 
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Add week_start_date to meal_plans for weekly tracking
ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS week_start_date DATE DEFAULT CURRENT_DATE;

-- Create baby birthday notifications table
CREATE TABLE IF NOT EXISTS baby_birthday_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  baby_age_months INTEGER NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  insight_text TEXT,
  seen BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, baby_age_months)
);

-- Enable RLS
ALTER TABLE baby_birthday_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own birthday notifications" ON baby_birthday_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own birthday notifications" ON baby_birthday_notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_birthday_notifications_user ON baby_birthday_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_week ON meal_plans(user_id, week_start_date);

-- >>> Migration: 20251218211659_c675f6ad-e445-4458-9d74-310cadd6cc75.sql <<<
-- Add timezone column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

-- Add a comment explaining the column
COMMENT ON COLUMN public.profiles.timezone IS 'User timezone in IANA format (e.g., Africa/Maputo, Europe/Lisbon)';

-- >>> Migration: 20251221221643_29392d1e-ad0b-4cf5-bf4f-8b0755f0101d.sql <<<
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

-- >>> Migration: 20251221231536_f82cd2ef-76d7-402b-adff-8056843cbf4c.sql <<<

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


-- >>> Migration: 20251221233927_7b6d77cf-05a6-42ba-bb93-54de8edb6beb.sql <<<

-- Sistema de referência viral
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL,
  referred_email TEXT,
  referred_user_id UUID,
  code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending',
  reward_claimed BOOLEAN DEFAULT false,
  reward_points INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Policies for referrals
CREATE POLICY "Users can view own referrals" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

CREATE POLICY "Users can create referrals" ON public.referrals
  FOR INSERT WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Users can update own referrals" ON public.referrals
  FOR UPDATE USING (auth.uid() = referrer_id);

-- Horários de refeição preferidos do bebê
CREATE TABLE IF NOT EXISTS public.baby_meal_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  meal_type TEXT NOT NULL,
  preferred_hour INTEGER NOT NULL,
  preferred_minute INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, meal_type)
);

-- Enable RLS
ALTER TABLE public.baby_meal_times ENABLE ROW LEVEL SECURITY;

-- Policies for baby_meal_times
CREATE POLICY "Users can view own meal times" ON public.baby_meal_times
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create meal times" ON public.baby_meal_times
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update meal times" ON public.baby_meal_times
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete meal times" ON public.baby_meal_times
  FOR DELETE USING (auth.uid() = user_id);

-- Timeline de primeiros alimentos (celebrações)
CREATE TABLE IF NOT EXISTS public.food_firsts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  food_name TEXT NOT NULL,
  category TEXT NOT NULL,
  reaction TEXT,
  first_tried_at DATE DEFAULT CURRENT_DATE,
  photo_url TEXT,
  celebrated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.food_firsts ENABLE ROW LEVEL SECURITY;

-- Policies for food_firsts
CREATE POLICY "Users can view own food firsts" ON public.food_firsts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create food firsts" ON public.food_firsts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update food firsts" ON public.food_firsts
  FOR UPDATE USING (auth.uid() = user_id);

-- Campanhas de win-back para usuárias inativas
CREATE TABLE IF NOT EXISTS public.winback_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  campaign_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  opened_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  message_sent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.winback_campaigns ENABLE ROW LEVEL SECURITY;

-- Policies for winback_campaigns
CREATE POLICY "Users can view own campaigns" ON public.winback_campaigns
  FOR SELECT USING (auth.uid() = user_id);

-- Onboarding progress tracking
CREATE TABLE IF NOT EXISTS public.onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  completed_steps TEXT[] DEFAULT '{}',
  first_recipe_prepared BOOLEAN DEFAULT false,
  first_checkin_done BOOLEAN DEFAULT false,
  meal_times_configured BOOLEAN DEFAULT false,
  seven_day_challenge_started BOOLEAN DEFAULT false,
  seven_day_challenge_completed BOOLEAN DEFAULT false,
  day_of_journey INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Policies for onboarding_progress
CREATE POLICY "Users can view own progress" ON public.onboarding_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own progress" ON public.onboarding_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON public.onboarding_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Daily engagement polls
CREATE TABLE IF NOT EXISTS public.daily_polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  poll_date DATE DEFAULT CURRENT_DATE,
  question TEXT NOT NULL,
  answer TEXT,
  answered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, poll_date)
);

-- Enable RLS
ALTER TABLE public.daily_polls ENABLE ROW LEVEL SECURITY;

-- Policies for daily_polls
CREATE POLICY "Users can view own polls" ON public.daily_polls
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create polls" ON public.daily_polls
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update polls" ON public.daily_polls
  FOR UPDATE USING (auth.uid() = user_id);

-- Create trigger for updated_at on new tables
CREATE TRIGGER update_baby_meal_times_updated_at
  BEFORE UPDATE ON public.baby_meal_times
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_onboarding_progress_updated_at
  BEFORE UPDATE ON public.onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- >>> Migration: 20251225124659_dd96f879-a7b1-4d09-b7e6-08526e50e422.sql <<<
-- Enable realtime for meal_plans table
ALTER PUBLICATION supabase_realtime ADD TABLE public.meal_plans;

-- >>> Migration: 20251226180952_0e06124a-a9f0-4fc2-bb37-b6cd285c1c58.sql <<<
-- Add has_completed_tour field to user_preferences table
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS has_completed_tour BOOLEAN DEFAULT FALSE;

-- >>> Migration: 20251230120458_ba6e9980-70af-4727-9913-8d5697804930.sql <<<
-- Backfill data from notification_preferences to baby_meal_times
-- This ensures all existing meal time configurations are available for push notifications

-- Create unique constraint if it doesn't exist (for upsert operations)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'baby_meal_times_user_meal_unique'
  ) THEN
    ALTER TABLE public.baby_meal_times
    ADD CONSTRAINT baby_meal_times_user_meal_unique UNIQUE (user_id, meal_type);
  END IF;
END $$;

-- Insert meal times from notification_preferences into baby_meal_times
-- Only insert if not already exists
INSERT INTO public.baby_meal_times (user_id, meal_type, preferred_hour, preferred_minute, enabled)
SELECT 
  np.user_id,
  np.meal_type,
  np.hour as preferred_hour,
  np.minute as preferred_minute,
  np.enabled
FROM public.notification_preferences np
WHERE np.meal_type IN ('breakfast', 'morning-snack', 'lunch', 'afternoon-snack', 'dinner')
ON CONFLICT (user_id, meal_type) 
DO UPDATE SET
  preferred_hour = EXCLUDED.preferred_hour,
  preferred_minute = EXCLUDED.preferred_minute,
  enabled = EXCLUDED.enabled,
  updated_at = now();

-- >>> Migration: 20260107145720_891a4534-1c96-4ced-98b1-34d80acdef96.sql <<<
-- First, deduplicate existing meal_plans keeping only the most recent record for each unique combination
WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY user_id, week_start_date, day_of_week, meal_type
           ORDER BY created_at DESC NULLS LAST, id DESC
         ) as rn
  FROM public.meal_plans
)
DELETE FROM public.meal_plans
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Add unique constraint for meal plans
ALTER TABLE public.meal_plans
ADD CONSTRAINT meal_plans_unique_slot 
UNIQUE (user_id, week_start_date, day_of_week, meal_type);

-- >>> Migration: 20260107212702_82ad9618-4a24-4e03-9c93-c821978ea363.sql <<<
-- Drop the old unique constraint that doesn't include week_start_date
ALTER TABLE public.meal_plans 
DROP CONSTRAINT IF EXISTS meal_plans_user_id_day_of_week_meal_type_key;

-- >>> Migration: 20260112002741_f4db6e8a-4844-49bd-abe2-1ed8c64c21f2.sql <<<
-- Create notification logs table to prevent duplicates
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  meal_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  sent_date DATE DEFAULT CURRENT_DATE,
  UNIQUE(user_id, meal_type, sent_date)
);

-- Enable RLS
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own notification logs
CREATE POLICY "Users can view their own notification logs"
ON public.notification_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Service role can insert logs (from edge function)
CREATE POLICY "Service role can insert notification logs"
ON public.notification_logs
FOR INSERT
WITH CHECK (true);

-- Add index for faster lookups
CREATE INDEX idx_notification_logs_user_date ON public.notification_logs(user_id, sent_date);
CREATE INDEX idx_notification_logs_sent_at ON public.notification_logs(sent_at DESC);

-- >>> Migration: 20260117010248_b626d710-2c67-4d7f-aabc-dc7083434bc7.sql <<<
-- Adicionar campos de ban à tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned_at timestamp with time zone;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banned_reason text;

-- Função para verificar se utilizador está banido
CREATE OR REPLACE FUNCTION public.is_user_banned(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(is_banned, false)
  FROM profiles
  WHERE id = check_user_id
$$;

-- Activar Realtime nas tabelas necessárias
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;

-- >>> Migration: 20260206124503_caa585a6-05ea-4ff2-929c-7d306900c333.sql <<<
-- Create recipe image overrides table for the duplicate repair pipeline
CREATE TABLE IF NOT EXISTS public.recipe_image_overrides (
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

-- >>> Migration: 20260307130359_47640d8a-6dca-4cac-b2b7-9f34bd6fabfe.sql <<<
ALTER TABLE public.meal_plans ADD COLUMN IF NOT EXISTS plan_type text NOT NULL DEFAULT 'custom';

-- >>> Migration: 20260307130829_a9a4a0d2-926b-4faa-b093-19a5f9670483.sql <<<
ALTER TABLE public.meal_plans DROP CONSTRAINT meal_plans_unique_slot;
ALTER TABLE public.meal_plans ADD CONSTRAINT meal_plans_unique_slot UNIQUE (user_id, week_start_date, day_of_week, meal_type, plan_type);

-- >>> Migration: 20260308141019_debcf642-d7ee-48ae-bec2-5b63a62eae0f.sql <<<

-- 1. Fix profiles SELECT policy: restrict to own data + limited public view for forums
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can view public profile fields"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Actually, we can't have column-level RLS in Postgres. 
-- Better approach: users see own full profile, others see via a view.
-- Let's just restrict to own profile for now and create a public view for forum needs.
DROP POLICY IF EXISTS "Users can view public profile fields" ON public.profiles;

CREATE POLICY "Authenticated users can view basic profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id 
  OR true  -- Allow reading but we'll create a view for limited fields
);

-- Actually the simplest secure approach: restrict SELECT to own profile only
DROP POLICY IF EXISTS "Authenticated users can view basic profiles" ON public.profiles;

-- For forum/community features, create a secure view
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT id, full_name, avatar_url, bio, is_verified_pediatrician
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- Now the main profiles table only allows own data
CREATE POLICY "Users can view own full profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 2. Fix notification_logs INSERT policy
DROP POLICY IF EXISTS "Service role can insert notification logs" ON public.notification_logs;

CREATE POLICY "Service role can insert notification logs"
ON public.notification_logs
FOR INSERT
TO service_role
WITH CHECK (true);

-- 3. Remove direct INSERT on user_badges (should be server-side only)
DROP POLICY IF EXISTS "Users can insert their own badges" ON public.user_badges;

CREATE POLICY "Service role can insert badges"
ON public.user_badges
FOR INSERT
TO service_role
WITH CHECK (true);

-- 4. Remove direct INSERT on completed_challenges_history (trigger handles this)
DROP POLICY IF EXISTS "Users can insert their own challenge history" ON public.completed_challenges_history;

CREATE POLICY "Service role can insert challenge history"
ON public.completed_challenges_history
FOR INSERT
TO service_role
WITH CHECK (true);

-- 5. Restrict user_streaks UPDATE to non-gamification columns only
DROP POLICY IF EXISTS "Users can update their own streaks" ON public.user_streaks;

-- Create a function to handle streak updates securely
CREATE OR REPLACE FUNCTION public.update_user_streak(
  p_user_id uuid,
  p_last_activity_date date
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_streak integer;
  v_longest_streak integer;
  v_last_activity date;
  v_new_streak integer;
BEGIN
  -- Only allow users to update their own streak
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT current_streak, longest_streak, last_activity_date
  INTO v_current_streak, v_longest_streak, v_last_activity
  FROM user_streaks
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date, total_points)
    VALUES (p_user_id, 1, 1, p_last_activity_date, 10);
    RETURN;
  END IF;

  -- If already logged today, skip
  IF v_last_activity = p_last_activity_date THEN
    RETURN;
  END IF;

  -- Calculate new streak
  IF v_last_activity = p_last_activity_date - interval '1 day' THEN
    v_new_streak := v_current_streak + 1;
  ELSE
    v_new_streak := 1;
  END IF;

  UPDATE user_streaks
  SET current_streak = v_new_streak,
      longest_streak = GREATEST(v_longest_streak, v_new_streak),
      last_activity_date = p_last_activity_date,
      total_points = total_points + 10,
      updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;

-- 6. Restrict user_challenge_progress UPDATE
DROP POLICY IF EXISTS "Users can update own challenge progress" ON public.user_challenge_progress;

-- Create secure function for challenge progress
CREATE OR REPLACE FUNCTION public.increment_challenge_progress(
  p_user_id uuid,
  p_challenge_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_goal_count integer;
  v_current_count integer;
BEGIN
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Get goal from challenge
  SELECT goal_count INTO v_goal_count
  FROM weekly_challenges
  WHERE id = p_challenge_id AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Challenge not found or inactive';
  END IF;

  -- Get or create progress
  INSERT INTO user_challenge_progress (user_id, challenge_id, current_count)
  VALUES (p_user_id, p_challenge_id, 1)
  ON CONFLICT (user_id, challenge_id) DO UPDATE
  SET current_count = user_challenge_progress.current_count + 1,
      completed = (user_challenge_progress.current_count + 1) >= v_goal_count,
      completed_at = CASE 
        WHEN (user_challenge_progress.current_count + 1) >= v_goal_count THEN now()
        ELSE NULL
      END,
      updated_at = now()
  WHERE user_challenge_progress.completed = false;
END;
$$;


-- >>> Migration: 20260308141029_5747ae4a-5b94-4a44-9c3e-b35759770cd5.sql <<<

-- Fix security definer view - use SECURITY INVOKER instead
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = true)
AS
SELECT id, full_name, avatar_url, bio, is_verified_pediatrician
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- Also clean up duplicate SELECT policies on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
-- Keep only "Users can view own full profile"


-- >>> Migration: 20260308141056_27ab2ba2-895b-44fb-9be0-b2b357b426d5.sql <<<

-- Allow admins to read all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update profiles (for ban actions)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));


-- >>> Migration: 20260308143055_aff0cdf6-2405-4b10-b395-58d3f90f5228.sql <<<
-- 1. Fix referral reward fraud: remove client-side UPDATE entirely
DROP POLICY IF EXISTS "Users can update own referrals" ON public.referrals;

-- 2. Fix fake challenge completion on insert: enforce initial values
DROP POLICY IF EXISTS "Users can create own challenge progress" ON public.user_challenge_progress;

CREATE POLICY "Users can create own challenge progress"
ON public.user_challenge_progress
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND completed = false
  AND current_count = 0
);

-- 3. Fix forum data exposure to unauthenticated users
DROP POLICY IF EXISTS "Forum posts are viewable by everyone" ON public.forum_posts;
CREATE POLICY "Forum posts viewable by authenticated users"
ON public.forum_posts
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.post_comments;
CREATE POLICY "Comments viewable by authenticated users"
ON public.post_comments
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.post_likes;
CREATE POLICY "Likes viewable by authenticated users"
ON public.post_likes
FOR SELECT
TO authenticated
USING (true);

-- >>> Migration: 20260313050823_14f35961-f8f6-4dfe-a158-f161d9c7d5d4.sql <<<
CREATE UNIQUE INDEX IF NOT EXISTS notification_logs_user_meal_date_unique ON public.notification_logs (user_id, meal_type, sent_date);

-- >>> Migration: 20260315203811_39667571-eff2-4d5e-9d2d-7511f2404545.sql <<<
-- Delete all push subscriptions (they were created with old VAPID keys and cause 403 errors)
DELETE FROM public.push_subscriptions;

-- Delete orphan user_sessions that have no matching profile
DELETE FROM public.user_sessions
WHERE user_id NOT IN (SELECT id FROM public.profiles);

-- >>> Migration: 20260402150204_ca5f37a2-3bfa-42f3-a678-d7a74259b20f.sql <<<
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- >>> Migration: 20260402151037_155e1cd0-d683-4e0c-9b63-f8212c2c9177.sql <<<

-- 1. FIX: Referral email exposure - restrict SELECT to hide referred_email from referrer
-- Drop existing policy and replace with column-restricted approach using a view
DROP POLICY IF EXISTS "Users can view own referrals" ON public.referrals;

-- Referrers can see their own referrals but NOT the referred_email
CREATE POLICY "Referrers can view own referrals"
ON public.referrals
FOR SELECT
USING (auth.uid() = referrer_id);

-- Referred users can see referrals where they are the referred user
CREATE POLICY "Referred users can view their referral"
ON public.referrals
FOR SELECT
USING (auth.uid() = referred_user_id);

-- Note: referred_email is still in the table but referrers already know the email
-- since they created the referral. The real fix is ensuring referred users can't see
-- OTHER users' emails. Current policy is actually correct - each party only sees
-- their own referral records. We'll null out referred_email for referrer reads via app logic.

-- 2. FIX: Privilege escalation on user_roles - tighten INSERT policy
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;

CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND user_id != auth.uid()  -- Admins cannot assign roles to themselves (prevent self-escalation)
);

-- 3. FIX: Activity log tampering - remove client INSERT policy, only service_role should insert
DROP POLICY IF EXISTS "Users can insert their own activity logs" ON public.activity_logs;

-- Add service_role INSERT policy so edge functions can still log
CREATE POLICY "Service role can insert activity logs"
ON public.activity_logs
FOR INSERT
TO service_role
WITH CHECK (true);

-- 4. FIX: Storage - remove the overly permissive upload policy on recipe-images
-- Delete the policy that lacks auth check
DROP POLICY IF EXISTS "Authenticated upload for recipe images" ON storage.objects;


-- >>> Migration: 20260402152351_227f35ce-b5f2-4f3d-8d88-130ce39348e5.sql <<<

-- 1. Remove unused referred_email column from referrals
ALTER TABLE public.referrals DROP COLUMN IF EXISTS referred_email;

-- 2. Protect privileged profile fields with a BEFORE UPDATE trigger
CREATE OR REPLACE FUNCTION public.protect_privileged_profile_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If the caller is NOT an admin, revert privileged fields to their old values
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.is_verified_pediatrician := OLD.is_verified_pediatrician;
    NEW.is_banned := OLD.is_banned;
    NEW.banned_at := OLD.banned_at;
    NEW.banned_reason := OLD.banned_reason;
  END IF;
  RETURN NEW;
END;
$$;

-- Attach the trigger
DROP TRIGGER IF EXISTS protect_profiles_privileged_fields ON public.profiles;
CREATE TRIGGER protect_profiles_privileged_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_privileged_profile_fields();


-- >>> Migration: 20260403231023_5754d92e-7178-4786-990b-7dea3a4fb085.sql <<<

-- Step 1: Delete duplicate user_sessions, keeping only the most recent per user_id
DELETE FROM public.user_sessions
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM public.user_sessions
  ORDER BY user_id, COALESCE(last_active, created_at) DESC
);

-- Step 2: Add unique constraint on user_id
ALTER TABLE public.user_sessions
ADD CONSTRAINT user_sessions_user_id_unique UNIQUE (user_id);


-- >>> Migration: 20260404221043_c33724e2-c717-4f11-a67e-ad624a6d61c2.sql <<<

CREATE TABLE IF NOT EXISTS public.food_introduction_progress (
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


-- >>> Migration: 20260415132747_367b4798-f32f-48b3-bf7e-3220be299518.sql <<<

-- Step 1: Add new flat columns
ALTER TABLE public.push_subscriptions 
  ADD COLUMN IF NOT EXISTS p256dh text,
  ADD COLUMN IF NOT EXISTS auth text,
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'Africa/Maputo';

-- Step 2: Migrate existing data from keys jsonb to flat columns
UPDATE public.push_subscriptions
SET 
  p256dh = keys->>'p256dh',
  auth = keys->>'auth'
WHERE keys IS NOT NULL AND p256dh IS NULL;

-- Step 3: Make new columns required
ALTER TABLE public.push_subscriptions 
  ALTER COLUMN p256dh SET NOT NULL,
  ALTER COLUMN auth SET NOT NULL;

-- Step 4: Drop old keys column
ALTER TABLE public.push_subscriptions DROP COLUMN IF EXISTS keys;

-- Step 5: Add unique constraint on user_id + endpoint
ALTER TABLE public.push_subscriptions 
  ADD CONSTRAINT push_subscriptions_user_endpoint_unique UNIQUE (user_id, endpoint);


-- >>> Migration: 20260416091238_3ff73c99-d5df-4045-965a-28b0361f696e.sql <<<

CREATE OR REPLACE FUNCTION public.protect_privileged_profile_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  -- Service role (edge functions) and admins can change privileged fields
  IF current_setting('role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;
  
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.is_verified_pediatrician := OLD.is_verified_pediatrician;
    NEW.is_banned := OLD.is_banned;
    NEW.banned_at := OLD.banned_at;
    NEW.banned_reason := OLD.banned_reason;
  END IF;
  RETURN NEW;
END;
$$;


-- >>> Migration: 20260416091517_a1018470-c7ac-49a5-8182-d04ffe2293ad.sql <<<

-- Update the trigger function to also check current_user
CREATE OR REPLACE FUNCTION public.protect_privileged_profile_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  -- Service role and superuser bypass
  IF current_setting('role', true) = 'service_role' 
     OR current_setting('request.jwt.claims', true) IS NULL
     OR current_setting('request.jwt.claims', true) = '' THEN
    RETURN NEW;
  END IF;
  
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.is_verified_pediatrician := OLD.is_verified_pediatrician;
    NEW.is_banned := OLD.is_banned;
    NEW.banned_at := OLD.banned_at;
    NEW.banned_reason := OLD.banned_reason;
  END IF;
  RETURN NEW;
END;
$$;


-- >>> Migration: 20260614091502_2f1eaa66-4b2a-4a00-8853-3ba5f4f8e32d.sql <<<

CREATE TABLE IF NOT EXISTS public.video_recipes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  short_title TEXT NOT NULL,
  description TEXT NOT NULL,
  age_label TEXT NOT NULL,
  min_age_months INTEGER NOT NULL DEFAULT 6,
  prep_time TEXT NOT NULL,
  cook_time TEXT NOT NULL,
  total_time TEXT NOT NULL,
  servings TEXT NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'Easy',
  video_url TEXT NOT NULL,
  poster_url TEXT NOT NULL,
  video_duration TEXT NOT NULL DEFAULT '0:30',
  ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  storage TEXT NOT NULL DEFAULT '',
  expert_tip TEXT NOT NULL DEFAULT '',
  nutrition_highlights JSONB NOT NULL DEFAULT '[]'::jsonb,
  allergen_note TEXT,
  published BOOLEAN NOT NULL DEFAULT true,
  views_count INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.video_recipes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_recipes TO authenticated;
GRANT ALL ON public.video_recipes TO service_role;

ALTER TABLE public.video_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published video recipes"
  ON public.video_recipes FOR SELECT
  USING (published = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert video recipes"
  ON public.video_recipes FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update video recipes"
  ON public.video_recipes FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete video recipes"
  ON public.video_recipes FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_video_recipes_updated_at
  BEFORE UPDATE ON public.video_recipes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed existing 4 video recipes
INSERT INTO public.video_recipes (id, title, short_title, description, age_label, min_age_months, prep_time, cook_time, total_time, servings, difficulty, video_url, poster_url, video_duration, ingredients, steps, storage, expert_tip, nutrition_highlights, allergen_note, sort_order) VALUES
(
  'video-cheesy-carrot-fingers',
  'Cheesy Carrot Fingers',
  'Cheesy Carrot Fingers',
  'Soft, nutritious and irresistibly cheesy — these golden carrot fingers are made with only 5 ingredients and are perfect for baby-led weaning. The soft texture is gentle on little gums, and the finger shape is ideal for tiny hands learning to self-feed.',
  '8 months+', 8, '10 min', '18 min', '28 min', '8–10 fingers', 'Easy',
  '/__l5e/assets-v1/4226cf11-6bd4-428f-97cb-0a58a4c4aa1e/cheesy-carrot-fingers.mp4',
  '/__l5e/assets-v1/b169a560-642c-4c1b-9904-f4392f17bc47/cheesy-carrot-fingers-poster.jpg',
  '0:25',
  '["2 carrots, finely grated","2 eggs","¼ cup shredded mozzarella (plus extra for sprinkling on top)","¼ cup all-purpose flour","½ tsp baking powder"]'::jsonb,
  '["Preheat the oven to 350°F (175°C) and line a loaf pan with parchment paper.","Finely grate the carrots into a mixing bowl, using the small side of the grater for the softest texture.","Add the eggs and mozzarella, and mix until well combined.","Add the flour and baking powder, then mix into a thick batter.","Pour the batter into the lined loaf pan and spread it evenly. Sprinkle a little extra mozzarella on top.","Bake for 17–18 minutes, until set and lightly golden on top.","Let it cool completely, then slice into finger-sized strips about the width of an adult finger — perfect for little hands to grip."]'::jsonb,
  'Keep in an airtight container in the fridge for up to 3 days, or freeze for up to 2 months. Reheat gently or serve at room temperature.',
  'Grating the carrot very finely is the secret here — it keeps the fingers soft and moist, releases natural sweetness, and makes them safe and easy for babies practicing self-feeding.',
  '["Vitamin A for eyes & immunity","Protein from eggs & cheese","Calcium for growing bones"]'::jsonb,
  NULL, 1
),
(
  'video-pb-banana-biscuits',
  '3-Ingredient Peanut Butter Banana Biscuits',
  'PB Banana Biscuits',
  'An easy, wholesome snack the whole family will love — made with only natural ingredients: ripe banana, peanut butter and flour. No added sugar, no butter, no eggs. One batch makes around 55–60 little biscuits, perfect for snack time at home or on the go.',
  '6 months+', 6, '15 min', '12 min', '27 min', '55–60 biscuits', 'Easy',
  '/__l5e/assets-v1/9073819e-dc01-4bdb-b811-cd66e6db5a93/pb-banana-biscuits.mp4',
  '/__l5e/assets-v1/aaa68ce6-eb44-4fa2-9e5a-331c440a91e8/pb-banana-biscuits-poster.jpg',
  '0:22',
  '["1 large very ripe banana (about 140 g, peeled)","2 tbsp natural peanut butter (almond or any seed butter works too)","1¼ cups (180 g) self-raising flour"]'::jsonb,
  '["Preheat the oven to 180°C (355°F) and line a baking tray with parchment paper.","Peel and mash the banana in a bowl, then stir in the peanut butter until fully combined.","Add the flour and mix, finishing with your hands to bring it together into a soft dough.","Roll out the dough to about ½ cm thickness.","Cut out the biscuits using small cookie cutters or a knife. Gather the excess dough, roll it out again, and repeat until all the dough is used — you''ll get around 55–60 biscuits.","Bake for 10–12 minutes, until lightly golden and cooked through.","Allow to cool completely before serving."]'::jsonb,
  'Store in a container on the bench for 3 days, in the fridge for a week, or freeze for up to 2 months.',
  'The riper the banana, the sweeter the biscuits — no sugar needed. For younger babies, offer a softened biscuit (dipped briefly in milk or water) until chewing skills develop.',
  '["Natural energy from banana","Healthy fats & protein from nut butter","No added sugar"]'::jsonb,
  'Suitable from 6 months once peanut has been safely introduced. If allergens haven''t been exposed yet, introduce peanut butter separately first and watch for any reaction.',
  2
),
(
  'video-carrot-lentil-puree',
  'Golden Carrot, Potato & Red Lentil Purée',
  'Carrot Lentil Purée',
  'A silky, golden purée packed with plant-based iron and protein — one of the best first meals for your baby. Sweet carrot and creamy potato balance the lentils beautifully, while a gentle pinch of cumin adds a warm flavor that introduces baby''s palate to new tastes.',
  '6 months+', 6, '10 min', '18 min', '28 min', '4–6 baby portions', 'Easy',
  '/__l5e/assets-v1/54069870-b0c9-47a2-90ca-7160dd20ddc2/lentil-puree.mp4',
  '/__l5e/assets-v1/c9c06ddd-997b-441b-9d81-606a728d700c/lentil-puree-poster.jpg',
  '0:26',
  '["2 carrots, peeled and diced","1 medium potato, peeled and diced","⅓ cup (60 g) red lentils, rinsed well","¼ tsp ground cumin","2 cups water (or low-sodium homemade vegetable stock)"]'::jsonb,
  '["Rinse the red lentils under cold water until the water runs clear.","Peel and dice the carrots and potato into small, even cubes so they cook evenly.","Add the lentils, carrots and potato to a pot and pour in the water.","Bring to a boil, then lower the heat and simmer for 15–18 minutes, until everything is completely soft.","Stir in the ground cumin and cook for 1 more minute.","Blend until silky smooth, adding a little of the cooking liquid as needed to reach the perfect texture for your baby.","Let it cool to a safe temperature and serve in a baby bowl."]'::jsonb,
  'Keep in the fridge for up to 3 days, or freeze in ice cube trays for up to 3 months — defrost one cube at a time for perfect portions.',
  'Red lentils are one of the richest plant sources of iron — essential from 6 months as baby''s natural iron stores start to run low. The vitamin A in carrots and the gentle cumin also support digestion and immunity.',
  '["Iron-rich for development","Plant protein from lentils","Smooth stage-1 texture"]'::jsonb,
  NULL, 3
),
(
  'video-cheesy-baby-tots',
  '3-Ingredient Cheesy Baby Tots',
  'Cheesy Baby Tots',
  'Soft, melty mini veggie tots made with just potato, carrot and cheese. Their shape makes them perfect for little hands learning the pincer grasp, and they''re baked — not fried — for a healthy, golden finish your baby will adore.',
  '6 months+', 6, '15 min', '15 min', '30 min', '12–14 tots', 'Easy',
  '/__l5e/assets-v1/3024c89e-6aa6-4cd5-82d3-9b6d82dc1f71/cheesy-baby-tots.mp4',
  '/__l5e/assets-v1/30fb2ccc-2764-4ece-a3d3-244feb18f572/cheesy-baby-tots-poster.jpg',
  '0:23',
  '["1 large potato, peeled and chopped","1 large carrot, grated","¼ cup cheese (mild cheddar or mozzarella)"]'::jsonb,
  '["Preheat the oven to 200°C (390°F) and line a baking tray with parchment paper.","Peel and chop the potato into chunks.","Steam or boil the potato together with the grated carrot until completely soft.","Drain very well — this is key for tots that hold their shape — then mash everything together.","Stir in the cheese until evenly combined.","Shape the mixture into small balls or tots, easy for little hands to grip.","Bake for about 15 minutes, until lightly golden. Cool before serving."]'::jsonb,
  'Refrigerate in an airtight container for up to 3 days, or freeze for up to 2 months. Reheat in the oven to bring back the golden finish.',
  'Draining the mash thoroughly is the secret to tots that don''t fall apart. Their soft, melty texture makes them an ideal early finger food for babies starting to self-feed.',
  '["Energy from potato","Vitamin A from carrot","Calcium & protein from cheese"]'::jsonb,
  NULL, 4
);

