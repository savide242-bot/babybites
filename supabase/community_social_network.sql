-- ==============================================================================
-- BABYBITES SOCIAL NETWORK SCHEMA & MIGRATION (SUPABASE)
-- Rede Social Exclusiva para Mães BabyBites: Posts, Vídeos, Stories, DMs & Moderação
-- ==============================================================================

-- 1. EXTEND FORUM_POSTS TABLE FOR RICH MEDIA & MODERATION
ALTER TABLE IF EXISTS forum_posts 
  ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'image', -- 'image' | 'video'
  ADD COLUMN IF NOT EXISTS video_url TEXT,
  ADD COLUMN IF NOT EXISTS video_thumbnail TEXT,
  ADD COLUMN IF NOT EXISTS topic TEXT DEFAULT 'geral', -- 'blw', 'papinhas', 'duvidas', 'conquistas', 'dicas'
  ADD COLUMN IF NOT EXISTS age_tag TEXT DEFAULT '6-8 Months',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published', -- 'published' | 'under_review' | 'hidden' | 'banned'
  ADD COLUMN IF NOT EXISTS reports_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_verified_mom BOOLEAN DEFAULT false;

-- Create index for faster feed querying
CREATE INDEX IF NOT EXISTS idx_forum_posts_status_created ON forum_posts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_topic ON forum_posts(topic);
CREATE INDEX IF NOT EXISTS idx_forum_posts_age_tag ON forum_posts(age_tag);

-- 2. COMMUNITY STORIES TABLE (Expira em 24 Horas)
CREATE TABLE IF NOT EXISTS community_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_avatar TEXT,
  baby_name TEXT,
  baby_age TEXT,
  media_url TEXT NOT NULL,
  media_type TEXT DEFAULT 'image', -- 'image' | 'video'
  caption TEXT,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_community_stories_active ON community_stories(expires_at DESC);

-- 3. COMMUNITY FOLLOWS (Seguir Outras Mães)
CREATE TABLE IF NOT EXISTS community_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_community_follows_follower ON community_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_community_follows_following ON community_follows(following_id);

-- 4. DIRECT MESSAGES / DMS (Chat Privado entre Mães)
CREATE TABLE IF NOT EXISTS community_direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dm_conversation ON community_direct_messages(sender_id, recipient_id, created_at DESC);

-- 5. ADMIN COMMUNITY NOTIFICATIONS (Alerta imediato para octaviomoiane2007@gmail.com)
CREATE TABLE IF NOT EXISTS community_admin_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- 'new_post' | 'reported_post' | 'banned_user'
  post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id UUID,
  author_name TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT DEFAULT 'image',
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_alerts_unresolved ON community_admin_alerts(is_resolved, created_at DESC);

-- 6. EXTEND PROFILES FOR MOTHER SOCIAL IDENTITY
ALTER TABLE IF EXISTS profiles
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS instagram_handle TEXT;

-- 7. STORAGE BUCKET CONFIGURATION (community_media)
-- In Supabase dashboard: Storage -> Create new bucket 'community_media' (Public)
-- Policy to allow authenticated and public read:
INSERT INTO storage.buckets (id, name, public) 
VALUES ('community_media', 'community_media', true)
ON CONFLICT (id) DO NOTHING;

-- 8. TRIGGER TO NOTIFY ADMIN ON NEW POST CREATION
CREATE OR REPLACE FUNCTION notify_admin_on_new_post()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO community_admin_alerts (type, post_id, user_id, title, message, media_type)
  VALUES (
    'new_post',
    NEW.id,
    NEW.user_id,
    NEW.title,
    'Nova publicação criada na comunidade por ' || COALESCE(NEW.user_id::text, 'Uma Mãe'),
    NEW.media_type
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_notify_admin_on_new_post ON forum_posts;
CREATE TRIGGER trg_notify_admin_on_new_post
AFTER INSERT ON forum_posts
FOR EACH ROW
EXECUTE FUNCTION notify_admin_on_new_post();
