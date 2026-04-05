
Objetivo: corrigir de vez o fluxo de push notifications no app publicado e refazer a experiência da aba Bonus para ficar organizada, com navegação por detalhe e conteúdo muito mais útil.

1. Diagnóstico real do problema de notificações
- O backend de reminders está a correr, mas os logs mostram `4 no-sub`, ou seja: os lembretes não estão a falhar no cron; estão a falhar antes, porque os utilizadores nem chegam a ficar gravados em `push_subscriptions`.
- Também não há logs recentes em `get-vapid-key`, `test-push-notification` e `send-meal-reminder`, o que confirma que a falha principal está no cliente antes do registo/salvamento/teste.
- Hoje existem demasiados pontos a disparar o mesmo fluxo:
  - `NotificationPromptModal`
  - `useAutoResubscribe`
  - `WelcomeModal`
  - `Home`
  - `Settings`
  - `NotificationPreferences`
- Isso cria corrida entre prompts, subscribe, unsubscribe e save.
- Além disso, `saveSubscription()` apaga e reinsere o registo, engole erros, e o hook marca `subscription` local antes de confirmar que o backend guardou e que o teste real funcionou.

2. Plano para corrigir Push Notifications
2.1 Unificar o fluxo
- Transformar `usePushNotifications.tsx` numa fonte única de verdade, com estado explícito:
  - `idle`
  - `requesting_permission`
  - `preparing_service_worker`
  - `subscribing`
  - `saving`
  - `testing`
  - `ready`
  - `error`
- Centralizar toda a lógica de:
  1) pedir permissão
  2) garantir service worker pronto
  3) obter/criar subscription
  4) persistir no backend
  5) testar entrega real

2.2 Eliminar concorrência
- Remover autosubscribe agressivo do `NotificationPromptModal` quando `Notification.permission === 'granted'`.
- Impedir que `useAutoResubscribe` concorra com clique manual do utilizador.
- Fazer `WelcomeModal`, `Home`, `Settings` e `NotificationPreferences` apenas chamarem um mesmo método central, sem repetir `requestPermission()` fora do hook.
- Garantir que só existe uma tentativa ativa por utilizador/sessão.

2.3 Corrigir persistência da subscription
- Refazer `saveSubscription()` para:
  - validar `p256dh` e `auth`
  - guardar com estratégia segura (`upsert`/substituição controlada), sem sequência frágil de deletes
  - devolver erro detalhado
- Só marcar notificações como ativadas depois de:
  - existir subscription no browser
  - existir registo no backend
  - teste de push retornar sucesso

2.4 Teste real obrigatório após ativação
- Logo após guardar a subscription, invocar `test-push-notification`.
- Se o teste falhar:
  - mostrar erro específico
  - não deixar a UI em falso positivo
  - orientar re-registo/reparo automaticamente quando possível

2.5 Melhorar feedback ao utilizador
- Parar de mostrar mensagem genérica tipo “enable notifications in your browser” quando o utilizador já aceitou.
- Mostrar erro por etapa:
  - permission denied
  - service worker not ready
  - vapid fetch failed
  - subscribe failed
  - save failed
  - delivery test failed
- Em `NotificationPreferences`, mostrar diagnóstico real:
  - browser permission
  - browser subscription
  - backend subscription
  - last delivery test
  - enabled meal reminders

2.6 Reforçar envio e branding admin
- Manter o composer simples: título + mensagem + botão de teste + botão enviar para todos.
- Ajustar funções de envio para usar sempre branding/app icon automaticamente.
- Rever coerência entre:
  - `test-push-notification`
  - `send-meal-reminder`
  - `notify-all-users`
  - `check-meal-reminders`

3. Plano para refazer a aba Bonus
3.1 Nova estrutura de navegação
- Deixar de usar expansão em cascata.
- Transformar a Bonus num hub com navegação por níveis:
  - nível 1: lista das grandes secções
  - nível 2: detalhe da secção escolhida
  - nível 3 (quando fizer sentido): detalhe do item individual
- Cada item abre uma vista própria com botão “Back”, em vez de abrir tudo por baixo.

3.2 Checklist organizada
- Primeiro ecrã: stages por idade.
- Ao clicar num stage: abrir ecrã desse stage.
- Dentro do stage: lista de categorias/alimentos.
- Ao clicar num alimento: abrir detalhe do alimento com:
  - best form to serve
  - texture guidance
  - allergen notes
  - repeat advice
  - next-step suggestion
  - controlos de estado
- Manter gravação do progresso no backend.

3.3 Menus mais premium
- Aplicar a mesma lógica de drill-down:
  - lista de planos por idade
  - clique abre plano detalhado
  - dentro do plano, cada dia pode abrir numa subview limpa
- Melhorar layout para leitura mobile:
  - cards mais claros
  - menos conteúdo esmagado
  - secções de prep/swaps/texture visualmente separadas

3.4 Picky Eaters muito mais completo
- Expandir fortemente o conteúdo em inglês, com secções mais profundas e realmente úteis:
  - why babies refuse food
  - what to do tonight
  - how to respond at the table
  - 7-day reset
  - repetition strategy
  - texture transitions
  - appetite fluctuations
  - teething/sickness setbacks
  - portion examples by stage
  - pressure-free phrases parents can say
  - what not to do
  - when to seek professional help
  - recovery after food jags
  - routines that reduce refusal
- Estruturar em blocos acionáveis, não em texto corrido genérico.

4. Ficheiros a alterar
- `src/hooks/usePushNotifications.tsx`
- `src/hooks/useAutoResubscribe.tsx`
- `src/components/NotificationPromptModal.tsx`
- `src/components/NotificationPreferences.tsx`
- `src/components/auth/WelcomeModal.tsx`
- `src/pages/Home.tsx`
- `src/pages/Settings.tsx`
- `supabase/functions/test-push-notification/index.ts`
- `supabase/functions/send-meal-reminder/index.ts`
- `supabase/functions/notify-all-users/index.ts`
- `src/pages/Bonus.tsx`
- `src/data/bonusContent.ts`

5. Resultado esperado
- Ao aceitar notificações no site publicado, o utilizador fica realmente subscrito, gravado no backend e recebe teste real.
- Os meal reminders voltam a funcionar porque deixam de existir utilizadores “sem subscription”.
- A Bonus deixa de parecer “tudo aberto ao mesmo tempo” e passa a ter navegação limpa, com abrir detalhe e voltar.
- A secção Picky Eaters passa a entregar conteúdo muito mais sério, prático e valioso.

6. Validação final
- Testar no site publicado:
  1) clicar ativar notificações
  2) aceitar no browser
  3) confirmar registo em `push_subscriptions`
  4) disparar `test-push-notification`
  5) confirmar receção fora do app
  6) confirmar envio admin para todos
  7) confirmar reminder automático no horário
- Testar Bonus em mobile:
  - abrir secção
  - entrar no detalhe
  - voltar
  - persistir checklist
  - ler menus sem poluição visual
  - validar nova profundidade do conteúdo picky eaters
