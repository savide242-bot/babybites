

# Plan: Fix Push Notifications Not Being Received

## Root Cause Analysis

After investigating the logs and code, I found **two distinct bugs** preventing notifications from arriving:

### Bug 1: Missing Icon Files (Why YOU didn't receive the notification)
The push service returned **201 Created** (Apple accepted it), but the notification payload references `/icon-192x192.png` for both `icon` and `badge`. **This file does not exist** in the `public/` folder. On iOS Safari, a notification with broken icon URLs can be **silently dropped** by the OS without any error. The app's PWA icons are hosted externally on Google Storage, not locally.

### Bug 2: VapidPkHashMismatch (Why meal reminders fail for some users)
The `check-meal-reminders` cron logs show `VapidPkHashMismatch` errors. This means some subscriptions in the database were registered with an **old VAPID key** that no longer matches the current one. These stale subscriptions will never work, but the system keeps trying them instead of cleaning them up.

---

## Fix Plan

### 1. Fix notification icon references across all edge functions
Replace all hardcoded `/icon-192x192.png` references with the actual external icon URL used in the PWA manifest:
`https://storage.googleapis.com/gpt-engineer-file-uploads/L51M0kwelTgOzVygYpkcrDBNd6g2/uploads/1760365341349-yum.png`

**Files to update:**
- `supabase/functions/_shared/webpush.ts` (default icon/badge in `sendWebPushNotification`)
- `supabase/functions/send-direct-push/index.ts`
- `supabase/functions/send-meal-reminder/index.ts`
- `supabase/functions/test-push-notification/index.ts`
- `public/sw-listener.js` (fallback icon in push handler)

### 2. Auto-cleanup stale subscriptions on VapidPkHashMismatch
In `_shared/webpush.ts`, treat HTTP 400 with `VapidPkHashMismatch` as an expired subscription (same as 410 Gone). This will auto-delete stale subscriptions so the cron job stops wasting time on them.

### 3. Add local icon fallback
Create a simple redirect or copy the icon to `public/icon-192x192.png` so the service worker always has a valid local fallback, even when offline.

---

## Technical Details

The fix is straightforward:
- The icon URL change is a string replacement across ~5 files
- The VapidPkHashMismatch fix is adding `response.status === 400` to the `expired` check in `webpush.ts`
- A local icon file ensures offline notification display works

