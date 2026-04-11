

# Fix: Receitas 404 + Notificações que nunca funcionam

## Problema 1: Receitas dão 404

**Causa raiz encontrada**: Em `src/components/home/WhatToCookWidget.tsx` linha 110, o botão "Let's Cook This!" navega para `/recipes/${id}` (plural) em vez de `/recipe/${id}` (singular). A rota definida em `App.tsx` é `/recipe/:id`. Resultado: 404 imediato.

**Fix**: Mudar `/recipes/${recommendation.id}` para `/recipe/${recommendation.id}` — uma linha.

---

## Problema 2: Notificações nunca completam — sempre processam

**Causa raiz real identificada** (depois de analisar todo o fluxo):

1. **`esbuild.drop: ['console', 'debugger']` em produção** (vite.config.ts linha 14) — Remove TODOS os `console.log`, `console.error` e `console.warn` do bundle de produção. Isto significa que TODOS os diagnósticos do fluxo push são invisíveis e qualquer erro é silenciosamente engolido.

2. **`navigator.serviceWorker.ready` pode nunca resolver** — Em produção, VitePWA regista o SW com `registerType: "prompt"`. Se o utilizador não aceitar a atualização do SW (prompt que aparece via `useServiceWorkerUpdate`), o worker pode ficar em estado `waiting` indefinidamente, e `navigator.serviceWorker.ready` só resolve quando há um worker `active`. O timeout de 10s dispara, o master timeout de 15s dispara, e o utilizador vê "processing forever".

3. **Race condition com master timeout** — Quando o master timeout (15s) dispara, ele marca `globalSubscribing = false`, mas a Promise do `acquireServiceWorker` continua pendente em background. Ao tentar novamente, pode haver estados inconsistentes.

4. **O fluxo é demasiado longo e frágil**: permissão → SW → VAPID → subscribe → save → test = 6 passos síncronos, qualquer falha silenciosa trava tudo.

**Fix completo**:

### a) `vite.config.ts`
- Remover `console` do `esbuild.drop` em produção — manter apenas `debugger`. Isto permite que os logs de diagnóstico do push apareçam na consola do browser real do utilizador, facilitando debug futuro.

### b) `usePushNotifications.tsx` — Reescrever `acquireServiceWorker` para ser mais resiliente
- Usar `navigator.serviceWorker.ready` SEM timeout como fallback principal (se já há SW active, retorna imediato)
- Antes de tentar registar um novo SW, verificar se já existe um registration com `active` worker
- Se `navigator.serviceWorker.controller` existe, usar o registration dele directamente
- Adicionar AbortController pattern para cancelar limpo quando master timeout dispara
- Reduzir complexidade: se permissão já está granted E já existe subscription válida no browser, reutilizar directamente sem re-registar nada

### c) `NotificationPromptModal.tsx`
- Mostrar feedback por etapa ao utilizador (ex: "Requesting permission...", "Preparing...", "Almost done...")
- Se falhar, mostrar botão "Try Again" em vez de fechar o modal
- Adicionar timeout visual de 8s — se não completou, mostrar mensagem de erro amigável com opção de retry

### d) `useServiceWorkerUpdate.tsx`
- Verificar `isPushFlowActive()` antes de qualquer `skipWaiting` para não interromper subscrição ativa (já implementado, verificar que funciona)

---

## Ficheiros a modificar

| Ficheiro | Alteração |
|----------|-----------|
| `src/components/home/WhatToCookWidget.tsx` | `/recipes/` → `/recipe/` (1 linha) |
| `vite.config.ts` | Remover `'console'` do `esbuild.drop` |
| `src/hooks/usePushNotifications.tsx` | Reescrever acquireServiceWorker + simplificar fluxo |
| `src/components/NotificationPromptModal.tsx` | Feedback por etapa + retry button |

