

# Rebuild Push Notifications from Scratch

## What's wrong now

The current system has a complex custom VAPID/encryption implementation (`_shared/webpush.ts` — 400 lines of manual crypto), the frontend fetches the VAPID key via an edge function call (extra network hop that can fail), and the `push_subscriptions` table stores keys as a nested JSON object (`{p256dh, auth}`) instead of flat columns. The `check-meal-reminders` edge function depends on `baby_meal_times` table for scheduling, adding unnecessary complexity. All of this creates fragile chains where any link can silently fail.

## What the new system looks like

```text
User clicks "Ativar" → Browser asks permission → granted?
  YES → Register SW → Subscribe with VAPID key → Save to DB → Done (modal closes)
  NO  → Modal closes, nothing saved

pg_cron (every hour) → Edge Function → check user timezone → match meal hour → send push via web-push npm library
```

## Plan

### 1. Alter `push_subscriptions` table
Drop the current `keys` (jsonb) column, add `p256dh` (text), `auth` (text), `timezone` (text) columns, add unique constraint on `(user_id, endpoint)`. Keep existing RLS policies.

### 2. Rewrite `public/sw.js`
Create a clean, standalone service worker file at `public/sw.js` with only two event listeners:
- `push` — parse JSON, call `showNotification`
- `notificationclick` — close notification, open/focus app window

No fetch interception, no caching, no complex logging. The existing `sw-listener.js` (imported by Workbox) stays for PWA caching — this new `sw.js` is specifically for push.

**Wait** — there's a conflict. The Vite PWA plugin already generates a `sw.js` in the build output. The push service worker code currently lives in `sw-listener.js` which is imported by the Workbox-generated SW. So we keep the push handlers in `sw-listener.js` but simplify them drastically.

### 3. Rewrite `usePushNotifications.tsx`
Clean, simple hook matching the user's spec:
- `urlBase64ToUint8Array` helper
- States: `isSubscribed`, `isLoading`, `error`
- `subscribe()`: request permission → register SW → subscribe with `VITE_VAPID_PUBLIC_KEY` env var (no edge function call) → upsert to DB with flat columns
- `unsubscribe()`: unsubscribe from push manager → delete from DB
- Preview guard (instant return, no processing)

### 4. Add `VITE_VAPID_PUBLIC_KEY` to frontend
Since secrets show `VAPID_PUBLIC_KEY` is already set, we need to also expose it as a build-time env var. We'll use the `get-vapid-key` edge function on first subscribe only as fallback, but primarily use the env var.

**Problem**: We can't set `VITE_*` env vars directly — the `.env` is auto-managed. So we keep the edge function approach for getting the VAPID key but make it bulletproof, OR we hardcode the public key (it's a public key, safe to embed).

**Decision**: Fetch VAPID public key from the existing `get-vapid-key` edge function (it works — already deployed). This is one simple fetch, no processing hang.

### 5. Rewrite `NotificationPromptModal.tsx`
Simple modal:
- Click "Ativar" → close modal immediately → call `subscribe()` silently in background
- Click "Mais tarde" → close modal
- No spinners, no error states in UI, no retry buttons

### 6. Rewrite `send-meal-reminders` edge function
New edge function using `npm:web-push` library (not custom crypto):
- Read all subscriptions with timezone
- Check which meal hour matches current local hour
- Send push via `webpush.sendNotification()`
- Clean up expired (410) subscriptions
- No dependency on `baby_meal_times` table — use fixed schedule (7, 10, 12, 15, 19)

### 7. Add `VAPID_MAILTO` secret
Need to add this secret for the `web-push` library.

### 8. Update cron job
Existing cron `check-meal-reminders-5min` calls `check-meal-reminders`. We'll update it to call the new `send-meal-reminders` function hourly instead (every hour at minute 0).

### 9. Clean up consumers
Update `Settings.tsx`, `NotificationPreferences.tsx`, `useAutoResubscribe.tsx`, `IOSPushSetup.tsx` to use the new hook API (`isSubscribed`, `subscribe`, `unsubscribe` instead of `subscribeToPushNotifications`, etc.).

### 10. Simplify `sw-listener.js`
Strip down to just: push handler + notificationclick handler + skip-waiting + activate. Remove all the verbose logging and complex parsing.

---

## Files to modify/create

| File | Action |
|------|--------|
| `push_subscriptions` table | Migration: add p256dh, auth, timezone columns; drop keys column |
| `public/sw-listener.js` | Simplify push + click handlers |
| `src/hooks/usePushNotifications.tsx` | Full rewrite |
| `src/components/NotificationPromptModal.tsx` | Simplify |
| `supabase/functions/send-meal-reminders/index.ts` | Full rewrite with npm:web-push |
| `src/hooks/useAutoResubscribe.tsx` | Update to new API |
| `src/pages/Settings.tsx` | Update hook usage |
| `src/components/NotificationPreferences.tsx` | Update hook usage |
| `src/pages/IOSPushSetup.tsx` | Update hook usage |
| Cron job | Update to hourly schedule calling send-meal-reminders |

## Important notes
- VAPID keys already exist as secrets
- Need to add `VAPID_MAILTO` secret
- Push only works on published domain (babybites.lovable.app), never in preview
- The `web-push` npm library handles all VAPID signing and payload encryption — no custom crypto needed

