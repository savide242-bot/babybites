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