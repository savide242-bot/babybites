
Objetivo: corrigir de vez a subscrição/delivery de push notifications no app publicado e adicionar uma nova aba “Bonus” realmente útil, toda em inglês, com conteúdo detalhado e persistência onde fizer sentido.

1. O que encontrei
- O problema de push não parece ser só “browser settings”. No código atual há várias entradas a tentar mexer no mesmo fluxo: modal global, Home, Settings, Welcome modal e auto-resubscribe.
- O hook `usePushNotifications` é instanciado em vários componentes ao mesmo tempo e já faz efeitos automáticos no mount. Isso é um forte candidato a corrida/conflito entre tentativas de subscrição.
- O app hoje mostra mensagens genéricas como “enable notifications in browser” mesmo quando a falha pode ser do próprio fluxo interno.
- O save da subscrição ainda é frágil: apaga e volta a inserir, em vez de fazer um registo controlado + validação + teste real.
- Não apareceram hits recentes nas funções de push nos logs consultados, o que reforça que muita falha está a acontecer antes mesmo do backend receber a subscrição.

2. Plano para corrigir Push Notifications
2.1 Centralizar o fluxo
- Transformar a lógica de push numa única fonte de verdade, para impedir múltiplas subscrições concorrentes.
- Remover tentativas automáticas espalhadas que hoje competem entre si.
- Manter apenas um fluxo controlado para:
  1) pedir permissão
  2) confirmar service worker ativo
  3) criar/renovar subscrição
  4) guardar no backend
  5) validar com teste real

2.2 Tornar o erro explícito e útil
- Separar claramente os erros por etapa:
  - permissão negada
  - service worker não pronto
  - `pushManager.subscribe()` falhou
  - gravação da subscrição falhou
  - teste de entrega falhou
- Parar de culpar o browser com mensagem genérica quando o erro for do app.
- Mostrar estado real no Settings: permission, browser subscription, backend subscription, last test result.

2.3 Validar a subscrição de ponta a ponta
- Depois de guardar a subscrição com sucesso, disparar um teste real para o próprio utilizador.
- Só marcar como “ativado” quando:
  - a subscrição estiver no browser
  - o registo existir no backend
  - o teste push responder com sucesso
- Se o teste falhar, mostrar instrução concreta para repetir/reparar, em vez de deixar o utilizador preso num estado falso.

2.4 Fortalecer o backend de push
- Uniformizar as funções de push para usar sempre artwork/app icon da BabyBites automaticamente.
- Garantir URLs absolutas nos payloads de notificação para evitar falhas em alguns dispositivos/PWAs.
- Rever `test-push-notification`, `send-meal-reminder`, `notify-all-users` e `notify-update` para o mesmo padrão de payload e limpeza de subscrições expiradas.
- Manter o composer admin simples: título + mensagem + “Test on Me” + “Send to All”, com branding da app aplicado automaticamente.

2.5 Áreas do app a ajustar
- `src/hooks/usePushNotifications.tsx`
- `src/components/NotificationPromptModal.tsx`
- `src/components/NotificationPreferences.tsx`
- `src/pages/Home.tsx`
- `src/pages/Settings.tsx`
- `src/components/auth/WelcomeModal.tsx`
- `src/hooks/useAutoResubscribe.tsx`
- funções de backend relacionadas a push
- possivelmente `public/sw-listener.js` se eu precisar alinhar o comportamento do click/ícone e feedback

3. Plano para a nova aba “Bonus”
3.1 Estrutura
- Criar uma nova página `/bonus`.
- Trocar a navegação “Community” por “Bonus” no menu principal.
- Manter `/community` como alias/redirect para `/bonus` para não quebrar links antigos.
- Todo o conteúdo desta área ficará em inglês, como pediu.

3.2 Bonus 1: Private nutrition support group
- Criar um cartão premium, discreto e elegante.
- Ao abrir, terá apenas a explicação curta e um botão camuflado/subtil para entrar no grupo:
  `https://chat.whatsapp.com/BF1UCtY4julCp0jz44NqKJ`
- Não será um banner gritante tipo WhatsApp community atual; será mais reservado.

3.3 Bonus 2: Food Introduction Checklist
- Isto não será só texto; será uma ferramenta útil.
- Criar checklist interativa por faixas etárias, com alimentos organizados por stage.
- Cada alimento poderá ter estado como:
  - Not introduced
  - Introduced
  - Loved it
  - Retry later
  - Watch reaction
- Incluir notas úteis em inglês por alimento/grupo:
  - best form to serve
  - texture guidance
  - allergen watch-outs
  - how often to repeat
  - what to offer next
- Guardar progresso por utilizador no backend para não perder dados entre sessões/dispositivos.

3.4 Bonus 3: Ready-made menus by age
- Criar secções detalhadas por fase etária do bebé.
- Cada fase terá um plano semanal completo, não resumido:
  - breakfast
  - lunch
  - dinner
  - snack ideas where appropriate
  - prep notes
  - swap options
  - texture adjustments
- Sempre que possível, ligar aos recipes já existentes e ao planner.
- Destacar automaticamente o menu mais adequado à idade atual do bebé.

3.5 Bonus 4: Suggestions for picky babies
- Criar um guia realmente prático, não superficial.
- Estruturar em inglês com blocos acionáveis:
  - what to do tonight
  - 7-day reset approach
  - how to re-offer refused foods
  - portion strategy
  - pressure-free scripts parents can use
  - sensory-friendly serving ideas
  - red flags for professional help
- Reaproveitar a base do conteúdo de Advice onde fizer sentido, mas expandir bastante para virar um bônus próprio e mais valioso.

4. Backend e segurança
- Adicionar uma nova tabela para progresso da checklist alimentar, ligada ao utilizador com RLS correta.
- Cada utilizador só poderá ver/editar o próprio progresso.
- Não preciso de mexer em permissões admin para essa parte.

5. Ficheiros prováveis
- `src/App.tsx`
- `src/components/Header.tsx`
- nova página `src/pages/Bonus.tsx`
- possivelmente substituir/reaproveitar `src/pages/Community.tsx`
- novo ficheiro de conteúdo estruturado para os bônus
- migração para progresso da checklist
- ficheiros de push listados acima

6. Validação final
- Testar no app publicado:
  1) abrir prompt de notificação
  2) aceitar
  3) confirmar criação da subscrição no backend
  4) receber push de teste fora do app
  5) enviar push pelo admin e confirmar entrega real
- Testar também o fluxo de reminders com horários guardados.
- Testar a nova aba Bonus em mobile, incluindo:
  - abertura do botão discreto do grupo
  - persistência da checklist
  - menus por idade
  - leitura confortável do conteúdo detalhado
