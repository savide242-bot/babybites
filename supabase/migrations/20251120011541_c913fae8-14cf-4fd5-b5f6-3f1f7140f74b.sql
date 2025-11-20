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