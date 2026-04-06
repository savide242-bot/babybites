

# Plan: Fix Push Notifications + Add 50 New Recipes

## Part 1: Fix Push Notification Subscription (the real problem)

**Root cause confirmed**: Zero logs in `get-vapid-key` — the client never reaches the VAPID step. It dies at `navigator.serviceWorker.ready`.

Why it fails:
- VitePWA uses `registerType: "prompt"` + `skipWaiting: false` — the SW can be stuck in "waiting" state
- `pwaRecovery.ts` unregisters ALL service workers on any chunk load error, nuking the SW mid-flow
- `navigator.serviceWorker.ready` can hang indefinitely if no active SW exists after recovery

**Fix in `usePushNotifications.tsx`** (Step 2 — SW acquisition):
- Instead of just waiting on `navigator.serviceWorker.ready`, first check `navigator.serviceWorker.getRegistrations()`
- If no registration exists or none has an active worker, manually register the SW via `navigator.serviceWorker.register('/sw.js')` and wait for it to activate
- If a registration exists with a waiting worker, call `skipWaiting()` on it to force activation
- Add detailed console logging at each step so failures are traceable

**Fix in `pwaRecovery.ts`**:
- Export a global `pushFlowActive` flag
- Set it to `true` during the subscription flow in `usePushNotifications`
- In `performPWARecovery()`, skip SW unregistration if the flag is active

**Fix in `saveSubscription()`**:
- Replace the fragile delete-then-insert with a proper upsert pattern using `onConflict: 'endpoint'` or similar, so the subscription is reliably persisted

---

## Part 2: Add 50 New Recipes (IDs 346–395)

The user uploaded a complete JSON file with 50 recipes. The task is:

1. **Create `src/data/recipes346-395.ts`** — Convert the JSON to the app's TypeScript format matching existing recipe files (like `recipes341-345.ts`). Each recipe gets:
   - `id`: "346" through "395" (JSON ids 1-50 mapped to 346-395)
   - `title`, `description` (from `why_good_for_baby`), `ageGroup`, `category`, `prepTime`, `servings`
   - `image: getRecipeImageById(id)` — will use hash fallback until AI images are generated
   - `ingredients` as `string[]` (combine quantity + unit + item)
   - `instructions` as `string[]`
   - `nutrition` in the app format (calories, protein, carbs, fat, fiber, vitamins)
   - `allergens` from `allergy_info`
   - `storage`, `healthBenefits` (from `why_good_for_baby`), `servingGuidance`

2. **Update `src/data/recipes.ts`** — Import and spread `recipes346to395`

3. **Update `src/data/recipeImages.ts`** — Add IDs 346–395 to `recipeImageMap` using hash-based fallback images (existing images from the pool) until unique AI images are generated later

---

## Files to change

| File | Change |
|------|--------|
| `src/hooks/usePushNotifications.tsx` | Robust SW acquisition: check registrations, force-register if needed, skipWaiting on waiting SW |
| `src/utils/pwaRecovery.ts` | Add `pushFlowActive` guard to prevent SW nuke during push flow |
| `src/data/recipes346-395.ts` | **New**: 50 recipes converted from JSON |
| `src/data/recipes.ts` | Import + spread new recipe array |
| `src/data/recipeImages.ts` | Add entries 346–395 to image map |

