

# Update VAPID Keys + Automatic Notifications Setup

## Current State
The app already has pg_cron jobs running automatically for:
- **Meal reminders**: every minute (`check-meal-reminders`)
- **Baby birthday check**: daily at 8 UTC
- **Challenge rotation**: midnight daily

However, these are **missing automatic scheduling**:
- **Engagement notifications** (check-in reminders, streak risk, challenge expiring) -- no cron job
- **Daily admin report** -- no cron job AND has a bug (wrong function call signature)

## Changes

### 1. Update VAPID Keys
Replace both `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` secrets with the new values provided.

### 2. Fix `daily-admin-report/index.ts` Bug
Line 159 calls `sendWebPushNotification(pushSub, payload, vapidKeys)` with 3 args but the function expects 4 (subscription, notification, publicKey, privateKey). Fix to use `vapidKeys.publicKey` and `vapidKeys.privateKey`.

### 3. Add Missing pg_cron Jobs (SQL Migration)
Create cron jobs for the notifications that currently have NO automatic trigger:

- **`send-engagement-checkin`**: Daily at 20:00 UTC -- sends check-in reminders to users who haven't logged today
- **`send-engagement-streak-risk`**: Daily at 10:00 UTC -- alerts users whose streaks are at risk
- **`send-engagement-challenge-expiring`**: Daily at 14:00 UTC -- notifies about challenges ending soon
- **`daily-admin-report`**: Daily at 21:00 UTC -- sends metrics report to admins

### 4. Deduplicate Existing Cron Jobs
There are two duplicate meal reminder jobs (jobid 3 and 7) both running every minute. Remove one.

### Files Modified
- `supabase/functions/daily-admin-report/index.ts` (fix bug)
- New SQL migration (add cron jobs, remove duplicate)

