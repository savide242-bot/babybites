
-- Sistema de referência viral
CREATE TABLE public.referrals (
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
CREATE TABLE public.baby_meal_times (
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
CREATE TABLE public.food_firsts (
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
CREATE TABLE public.winback_campaigns (
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
CREATE TABLE public.onboarding_progress (
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
CREATE TABLE public.daily_polls (
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
