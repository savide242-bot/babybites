-- Create notification logs table to prevent duplicates
CREATE TABLE public.notification_logs (
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