

# Fix: Notificações Travadas + Otimização de Imagens

## Problema 1: "Edit Meal Reminders" fica a processar para sempre

**Causa raiz**: `NotificationPreferences.handleSave()` (linha 374-383) chama `subscribeToPushNotifications()` de forma **síncrona** durante o save. Se a subscrição push trava (ex: service worker não pronto), o botão "Saving..." fica preso até o timeout de 30s.

**Fix**: Desacoplar a gravação dos horários da subscrição push.
- Salvar horários e timezone primeiro (operação rápida no DB)
- Mostrar sucesso ao utilizador imediatamente
- Tentar subscrição push como side-effect não-bloqueante (fire-and-forget com toast de resultado)

**Ficheiro**: `src/components/NotificationPreferences.tsx` — refactor `handleSave`

## Problema 2: "Service Worker not ready" na subscrição push

**Causa raiz**: `acquireServiceWorker()` chama `navigator.serviceWorker.ready` que pode ficar pendurado indefinidamente em certos cenários (SW em estado inconsistente, conflito com auto-update). O master timeout de 30s é demasiado longo para UX.

**Fixes**:
1. **`usePushNotifications.tsx`**: Adicionar timeout de 10s específico ao `navigator.serviceWorker.ready` em vez de depender apenas do master timeout de 30s
2. **`usePushNotifications.tsx`**: Se já existe permissão granted + SW ready com subscription válida, reutilizar directamente sem re-registar
3. **`usePushNotifications.tsx`**: Reduzir master timeout para 15s
4. **`vite.config.ts`**: Mudar `devOptions.enabled` para `false` — impede SW de correr no preview iframe do Lovable, evitando conflitos
5. **`useServiceWorkerUpdate.tsx`**: Verificar `isPushFlowActive()` antes de fazer `SKIP_WAITING` ou reload, para não interromper subscrição em curso

## Problema 3: Conflito useAutoResubscribe + NotificationPromptModal

Ambos podem tentar `subscribeToPushNotifications()` quase ao mesmo tempo. O `globalSubscribing` lock protege, mas o segundo chamador falha silenciosamente.

**Fix**: Garantir que `useAutoResubscribe` só corre depois do modal ter sido tratado (verificar storage key antes de tentar).

## Performance: Imagens sem `loading="lazy"`

Vários componentes carregam imagens sem lazy loading:
- `DailyActionCard.tsx` (2 `<img>` sem lazy)
- `RecipeDetail.tsx` (hero image sem lazy)
- `MealCard.tsx` (background image sem lazy)
- `RecipeOfTheDay.tsx` (sem lazy)
- `RecipePickerModal.tsx` (2 `<img>` sem lazy)
- `FirstDay.tsx` (sem lazy)

**Fix**: Adicionar `loading="lazy" decoding="async"` a todos os `<img>` nestes ficheiros.

## Ordem de implementação

1. `vite.config.ts` — devOptions.enabled: false
2. `usePushNotifications.tsx` — timeout no SW ready, reduzir master timeout
3. `useServiceWorkerUpdate.tsx` — guard durante push flow
4. `NotificationPreferences.tsx` — desacoplar save de push subscription
5. Todos os componentes com `<img>` — lazy loading

