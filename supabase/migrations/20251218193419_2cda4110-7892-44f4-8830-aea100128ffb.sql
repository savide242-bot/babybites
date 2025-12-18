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