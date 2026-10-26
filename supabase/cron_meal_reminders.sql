-- ==============================================================================
-- ATIVAR O AGENDADOR AUTOMÁTICO DE NOTIFICAÇÕES DE REFEIÇÃO (SUPABASE PG_CRON)
-- Este script faz o Supabase verificar os horários de refeição a cada 5 minutos
-- e enviar a notificação push para os telemóveis mesmo com o app fechado!
-- ==============================================================================

-- 1. Certificar que as extensões pg_cron e pg_net estão ativas
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- 2. Remover qualquer agendamento antigo com o mesmo nome (evitar duplicados)
DO $$
BEGIN
  PERFORM cron.unschedule('check-meal-reminders-job');
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 3. Agendar o job para rodar a cada 5 MINUTOS (* / 5 * * * *)
-- Ele chama a Edge Function check-meal-reminders do seu projeto
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

-- 4. Como testar manualmente agora se o cron funciona:
-- Basta rodar no SQL Editor:
-- SELECT net.http_post(
--   url := 'https://fcrtrdnrnwfuamoyflay.supabase.co/functions/v1/check-meal-reminders',
--   headers := jsonb_build_object(
--     'Content-Type', 'application/json',
--     'apikey', 'sb_publishable_40X4jgCMfNu4oaxTGHXI1Q_A7wbn-hk'
--   ),
--   body := '{}'::jsonb
-- );
