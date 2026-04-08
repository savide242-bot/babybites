
Objetivo: corrigir a ativação de notificações no browser sem “Service worker not ready”, reorganizar a aba Receitas para ordenar todas as receitas pela idade do bebé sem aplicar filtro automático, e redesenhar o Admin para controlo muito mais completo por utilizador.

1. Corrigir a ativação de notificações
- Remover a dependência frágil de “esperar um service worker activo” para só depois subscrever.
- Unificar o fluxo para:
  1) pedir permissão
  2) obter/registrar o service worker correcto
  3) esperar o worker certo ficar pronto
  4) reaproveitar subscrição existente quando válida
  5) guardar no backend
  6) testar envio
- Ajustar `usePushNotifications.tsx` para:
  - usar primeiro `navigator.serviceWorker.ready` com fallback controlado
  - validar se o registo encontrado é mesmo o do app e não um registo antigo/inválido
  - não falhar só porque ainda não existe `active` imediatamente após o accept do utilizador
  - diferenciar erros reais: permissão, VAPID, subscribe, save, test
- Melhorar a mensagem para o utilizador:
  - se a permissão já foi aceite, mostrar que o problema é “ligação do browser ao sistema de entrega”, não “permissão”
  - orientar melhor quando estiver no browser publicado vs ambiente limitado
- Rever conflitos com atualização do PWA:
  - `useServiceWorkerUpdate.tsx`
  - `pwaRecovery.ts`
  - `public/sw-listener.js`
  - garantir que a subscrição não entra em corrida com update/skipWaiting/reload
- Rever o modal/botão de ativação para mostrar estado por etapa e opção de retry simples.

O que está a acontecer hoje:
- o utilizador aceita notificações, mas isso só dá permissão do browser
- ainda falta o app conseguir obter um service worker válido, criar a subscrição push e guardá-la
- o erro actual acontece nessa fase técnica, não na permissão em si

2. Corrigir a aba Receitas do jeito pedido
- Remover a lógica que está a auto-definir `selectedAge` com a idade do bebé.
- Manter todos os filtros manuais disponíveis, mas sem aplicar nenhum automaticamente por conta própria.
- Reordenar a lista principal inteira de 300+ receitas por prioridade:
  1) receitas da faixa etária do bebé primeiro
  2) dentro desse bloco, mais fáceis primeiro
  3) depois restantes receitas
  4) dentro das restantes, continuar a ordenar por facilidade e relevância
- Preservar pesquisa, categoria, preferências alimentares e easy mode como controlos opcionais do utilizador.
- Ajustar o topo da página para comunicar “ordered for your baby’s age” em vez de parecer que foi aplicado filtro automático.
- Rever/remover a secção “Recommended for baby” se ela duplicar o mesmo conteúdo da ordenação principal.

3. Melhorar ligação Meal Planner -> Lista de compras
- Garantir que ao aceitar/gerar/regenerar plano semanal, a sincronização da lista de compras é disparada automaticamente.
- Garantir que a lista reflecte exactamente os ingredientes das receitas do plano activo da semana.
- Rever consistência entre:
  - `MealPlanner.tsx`
  - `mealPlanGenerator.ts`
  - `shoppingListSync.ts`
  - `ShoppingList.tsx`
- Se necessário, adicionar ação manual “Sync from current meal plan” como reforço administrativo/usuário.

4. Redesenhar e fortificar o Admin
- Reestruturar `/admin` como command center, com secções mais claras:
  - Overview
  - Users
  - User Detail
  - Notifications
  - Activity
  - Content
  - System Health
- Melhorar `AdminDashboard` com métricas realmente úteis:
  - total users
  - online now
  - active 24h / 7d / 30d
  - push enabled users
  - novos utilizadores
  - retenção
  - meal plans gerados
  - refeições registadas
  - receitas mais vistas
  - páginas/abas mais visitadas
  - falhas/sucessos de notificações
- Melhorar `UserManagement` para cada utilizador mostrar mais detalhe:
  - nome da mãe
  - nome do bebé
  - idade do bebé
  - data de registo
  - último acesso
  - timezone
  - push activo ou não
  - sessões
  - estado admin / ban
- Adicionar drill-down por utilizador:
  - perfil completo
  - receitas vistas e top receitas
  - páginas visitadas
  - actividade recente cronológica
  - meal plans e interações
  - engagement/resumo de uso
- Melhorar `ActivityLogs` para ficar útil de verdade:
  - filtros por utilizador, tipo de evento, intervalo
  - detalhes legíveis
  - agrupamento por categoria
  - ligação directa ao utilizador relacionado

5. Fortalecer rastreamento de actividade
- Hoje o sistema já lê `recipe_views`, `user_sessions` e `activity_logs`, mas o tracking está incompleto.
- Expandir `useSessionTracking.tsx` para registar eventos estruturados em `activity_logs`, como:
  - route/page viewed
  - recipe viewed
  - meal plan generated/accepted
  - shopping sync
  - notification activation result
  - admin actions
- Aproveitar `recipe_views` para ranking e comportamento por utilizador.
- Se faltar estrutura para guardar eventos mais ricos, preparar mudanças de base de dados focadas em analytics/admin.

6. Ajustes de dados/backend
- Rever tabelas já existentes antes de mexer:
  - `profiles`
  - `user_sessions`
  - `recipe_views`
  - `activity_logs`
  - `push_subscriptions`
  - `admin_notifications`
  - `meal_plans`
  - `shopping_list_items`
- Se necessário, preparar migração para enriquecer analytics/admin sem quebrar dados existentes.
- Manter segurança com permissões adequadas para leitura admin e dados privados de utilizadores.

7. Ordem de implementação recomendada
- Primeiro: notificações/browser/service worker
- Segundo: receitas sem filtro automático, apenas ordenação inteligente
- Terceiro: sync meal planner -> shopping list
- Quarto: redesign e expansão do admin
- Quinto: tracking adicional para alimentar o novo admin

Detalhes técnicos principais
- Problema actual das notificações: permissão do browser != subscrição push concluída; o gargalo está na obtenção/estado do service worker e no encadeamento do fluxo.
- Problema actual de receitas: o código está mesmo a aplicar `selectedAge` automaticamente; isso será removido e substituído por ordenação prioritária.
- Limite actual do admin: ele mostra listas e contagens básicas, mas não tem visão por utilizador nem tracking granular suficiente; o redesign precisa de UI + tracking + possivelmente ajustes de dados.
