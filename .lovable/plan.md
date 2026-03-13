Plano aprovado para resolver definitivamente os lembretes automáticos com app/PWA fechado, com foco em confiabilidade máxima e mensagens em inglês.

1) Diagnóstico confirmado (estado atual)
- O backend já tem a função `check-meal-reminders`, mas não há agendamento de cron dessa função nas migrations (só existe cron para `rotate-challenges`).
- Logs mostram: função roda, mas há poucas subscrições ativas e quase sempre “fora da janela”.
- Há inconsistências que confundem teste/entrega:
  - `send-meal-reminder` usa contrato diferente do frontend (`userId` vs `user_id`).
  - UI de teste espera `data.success`, mas a função retorna outro formato.
  - Janela de envio atual (15–45 min antes) não corresponde ao pedido “nos horários de refeição”.

2) Implementação que vou fazer
- Endurecer `supabase/functions/check-meal-reminders/index.ts`:
  - Mudar lógica para horário de refeição (janela curta de tolerância, ex.: -2 a +8 min).
  - Manter tudo em inglês nos textos.
  - Tornar prevenção de duplicado atômica (claim por `notification_logs` com `ON CONFLICT DO NOTHING` antes de enviar).
  - Fallback de timezone para `UTC` (não país fixo).
  - Manter retry + limpeza de subscrições expiradas.
- Limpar fluxo “lixo/inconsistente”:
  - Padronizar `send-meal-reminder` para o mesmo contrato do app e mesmo motor `_shared/webpush.ts` (ou redirecionar testes para `force-test-reminder`).
  - Corrigir `NotificationPreferences` para interpretar corretamente resposta de teste.
- Garantir lanches:
  - Unificar defaults de `usePushNotifications` com `baby_meal_times` (morning-snack + afternoon-snack, não apenas `snack` genérico).

3) Como programar o cron job (e deixar idempotente)
- Criar/ajustar job no banco (sem migration global, execução direta no backend do projeto):
```sql
-- 1) garantir extensões
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- 2) remover jobs antigos do meal reminder
select cron.unschedule(jobid)
from cron.job
where jobname in ('check-meal-reminders-5min','meal-reminders-auto','check-meal-reminders');

-- 3) criar job novo (ex.: a cada 5 min; posso subir para 2 min se quiseres)
select cron.schedule(
  'check-meal-reminders-5min',
  '*/5 * * * *',
  $$
  select net.http_post(
    url:='https://bdkfoxzlndwxvzbbrbgl.supabase.co/functions/v1/check-meal-reminders',
    headers:='{"Content-Type":"application/json","Authorization":"Bearer <ANON_KEY_ATUAL>"}'::jsonb,
    body:='{}'::jsonb
  );
  $$
);

-- 4) validar
select jobid, jobname, schedule, active from cron.job where jobname='check-meal-reminders-5min';
```

4) Resposta direta sobre “cron com VAPID keys antigas”
- O cron job NÃO usa VAPID keys; ele só dispara a função.
- VAPID antiga afeta as subscrições salvas no browser (ficam inválidas).
- Por isso vou garantir:
  - limpeza automática de `VapidPkHashMismatch`,
  - re-subscrição automática dos utilizadores com permissão já concedida,
  - e versionamento de subscrição para forçar refresh quando necessário.

5) Critério de pronto (fim-a-fim real)
- Teste no app publicado no telemóvel (não preview iframe).
- Configurar 1 refeição para 5–10 minutos à frente.
- Fechar PWA/app e esperar push chegar.
- Confirmar registro em `notification_logs`.
- Confirmar mensagem em inglês e sem duplicados.