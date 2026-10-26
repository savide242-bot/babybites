-- ==============================================================================
-- AGENDADOR AUTOMÁTICO DE REFEIÇÕES (SUPABASE CRON) - VERSÃO LIMPA
-- No Supabase, o pg_cron e pg_net já vêm ativos e configurados de fábrica.
-- Execute APENAS este bloco limpo:
-- ==============================================================================

-- 1. Remove agendamento antigo se já existir
SELECT cron.unschedule('check-meal-reminders-job')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'check-meal-reminders-job');

-- 2. Cria o agendamento para verificar a cada 5 minutos (* / 5 * * * *)
SELECT cron.schedule(
  'check-meal-reminders-job',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://fcrtrdnrnwfuamoyflay.supabase.co/functions/v1/check-meal-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'sb_publishable_40X4jgCMfNu4oaxTGHXI1Q_A7wbn-hk',
      'Authorization', 'Bearer sb_publishable_40X4jgCMfNu4oaxTGHXI1Q_A7wbn-hk'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- 3. Para verificar se o agendamento foi criado com sucesso:
SELECT jobid, jobname, schedule, active FROM cron.job WHERE jobname = 'check-meal-reminders-job';
