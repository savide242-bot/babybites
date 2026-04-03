

# Plan: Fix Notification Subscription Bug + Fix Admin Metrics + Simplify Admin Notification Sender

## What's Wrong

### Bug 1: Notification Subscription Hangs Forever
The subscription flow in `usePushNotifications.tsx` has **no timeouts** on any async step. If `navigator.serviceWorker.ready` never resolves (common in non-PWA browsers), or if the VAPID key fetch hangs, or if `pushManager.subscribe()` stalls — the UI shows "Activating..." forever with no way out.

The `NotificationPromptModal.tsx` also has no safety timeout — once `isActivating` is true, the modal locks and never closes if any step hangs.

### Bug 2: Admin Dashboard Shows Fake Numbers (235 Online)
The `user_sessions` table has no `UNIQUE` constraint on `user_id`. The `useSessionTracking.tsx` uses `.maybeSingle()` which returns `null` when duplicates exist — so it inserts yet another row every time. One user has 235 duplicate rows. The admin dashboard counts rows, not unique users, so it shows 235 "Online Now."

### Bug 3: Admin Notification Composer Is Too Complex
You want a simple button: type title + message, click Send — it delivers push notifications to all users outside the app. The current form has unnecessary fields (Icon URL, Button Text, Action URL, "Show Preview" banner style). You want it clean and direct.

---

## Changes

### 1. Fix Push Subscription — Add Timeouts (usePushNotifications.tsx)
- Add 10s timeout on `navigator.serviceWorker.ready`
- Add 5s timeout on VAPID key fetch
- Add 15s timeout on `pushManager.subscribe()`
- Show specific error toast for each failure point
- If any step fails, return `false` immediately so UI unblocks

### 2. Fix Notification Modal — Add Safety Timeout (NotificationPromptModal.tsx)
- Wrap `handleActivate` with a 25s master timeout
- If subscription hangs, force-close modal and show error toast
- Never let `isActivating` stay true forever

### 3. Fix Session Tracking Duplicates (Database Migration + useSessionTracking.tsx)
- **Migration**: Delete all duplicate `user_sessions` rows (keep most recent per user), then add `UNIQUE(user_id)` constraint
- **Code**: Replace `.maybeSingle()` pattern with `.upsert()` on `user_id` to prevent future duplicates
- Admin dashboard queries will then show real numbers automatically

### 4. Simplify Admin Notification Composer (NotificationComposer.tsx)
- Remove Icon URL, Button Text, Action URL, and Preview banner fields
- Keep only: **Title** + **Message** + two buttons: **Test on Me** and **Send to All**
- The app icon is used automatically
- Clean, minimal card — no tabs, just the form + history below it

---

## Files Summary

| File | Change |
|------|--------|
| `src/hooks/usePushNotifications.tsx` | Add timeouts to SW ready, VAPID fetch, push subscribe |
| `src/components/NotificationPromptModal.tsx` | Add master 25s timeout, force-close on failure |
| DB Migration | Delete duplicate user_sessions, add UNIQUE(user_id) |
| `src/hooks/useSessionTracking.tsx` | Replace maybeSingle with upsert |
| `src/components/admin/NotificationComposer.tsx` | Simplify: title + message + Test + Send only |

