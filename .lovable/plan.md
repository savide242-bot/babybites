

# Plan: Install Prompt, Win-Back Notifications, Easy Cooking Filters, UI Polish

## Key Finding: Notifications ARE Working

The database proves meal reminders are being delivered successfully. Today alone (April 2), there are **25+ notification_logs** entries across 8 users with active subscriptions — breakfast, morning-snack, lunch, afternoon-snack, dinner — all sent at the correct local times per timezone. The system is working. The reason you may not see them on YOUR device is if your push subscription was purged during the cleanup. You need to re-enable notifications in Settings on the published app.

## Key Finding: Onboarding Has No Duplicate

Step 1 asks "What's your name?" (mother), Step 2 asks "What's your baby's name?" — these are different questions. However, Step 1's text says "Hi there! What's your name?" which could feel generic. I'll make the steps more visually distinct and polished.

---

## Changes

### 1. Smart Install Banner (Chrome/Safari detection)
Add a persistent, dismissible install banner that detects when the user is browsing via Chrome/Safari (not in standalone PWA mode) and shows a clear "Install BabyBites" prompt with one-tap install for Android/Chrome and iOS instructions for Safari.

**Files**: New `src/components/SmartInstallBanner.tsx`, update `src/App.tsx` to include it.

### 2. Win-Back Notifications for Inactive Users (2+ days)
Create a new Edge Function `send-winback-notification` that:
- Queries `user_sessions` for users inactive 2+ days who have active `push_subscriptions`
- Sends a personalized "We miss you, {motherName}!" push notification
- Logs to `winback_campaigns` table to prevent duplicate sends
- Schedule via pg_cron every 6 hours

**Files**: New `supabase/functions/send-winback-notification/index.ts`, DB insert for cron job.

### 3. Easy Cooking: Age Filter + Home Page CTA
- In Easy Cooking mode, auto-detect baby age from profile and pre-select the age filter
- Add age dropdown that stays visible in easy cooking mode
- On Home page, add a card: "Can't cook? No worries! We have super easy recipes ready in under 15 minutes" linking to `/recipes` with easy cooking mode

**Files**: `src/pages/Recipes.tsx`, `src/pages/Home.tsx`

### 4. Onboarding Polish
- Make Step 1 (mother name) more warm and distinct — "Welcome, mama!" with illustration
- Update StepWelcome to show "340+" instead of "300+"
- Ensure each step has unique visual identity so nothing feels repeated

**Files**: `src/components/onboarding/steps/StepMotherName.tsx`, `src/components/onboarding/steps/StepWelcome.tsx`

### 5. Humanize AI-Generated Content
- Remove emoji overuse in UI copy
- Replace generic phrases with natural, warm language
- Ensure recipe card badges, banners, and CTAs feel hand-crafted

**Files**: `src/pages/Recipes.tsx`, `src/pages/Home.tsx`

### 6. Recipes 341-345 Verification
Already verified: all 5 recipes have detailed multi-step instructions, full nutrition info, allergen data, storage tips, and generated images. They are complete.

---

## Cron Job Setup (User Action Required)

For the win-back notification, I'll provide the SQL to schedule a cron job that calls `send-winback-notification` every 6 hours. You'll need to confirm the execution.

## Files Summary

| File | Change |
|------|--------|
| `src/components/SmartInstallBanner.tsx` | New — detect browser, show install prompt |
| `src/App.tsx` | Add SmartInstallBanner |
| `supabase/functions/send-winback-notification/index.ts` | New — inactive user push notifications |
| `src/pages/Recipes.tsx` | Easy cooking age auto-select + polish |
| `src/pages/Home.tsx` | "Easy recipes" CTA card |
| `src/components/onboarding/steps/StepMotherName.tsx` | Visual polish |
| `src/components/onboarding/steps/StepWelcome.tsx` | Update "340+" count |
| DB cron insert | Schedule win-back every 6h |

