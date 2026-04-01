

# Plan: Fix Notification Delivery Bug + Add "Easy Recipes" Tab

## 1. Notification System — Critical Bug Found

**Root cause discovered**: The `check-meal-reminders` function has a logic ordering bug:

```text
Current flow (BROKEN):
  1. Check if meal is in time window → YES
  2. INSERT into notification_logs (claims the "once per day" slot) ✅
  3. Check if user has push subscription → NO subscription found
  4. Skip (but the log entry already consumed the daily slot!)
  
Result: 80% of notification_logs entries are for users WITHOUT subscriptions.
Those users can never get a retry that day.
```

Additionally, the icon URL is `/icon-192x192.png` (relative path). Push services need absolute URLs. Apple/FCM may silently drop notifications with invalid icons.

**Evidence from database**: Of today's 20 most recent notification_logs entries, only 6 have `has_sub=1`. The other 14 were logged but never sent because the users had no push subscription. The system "thinks" it sent them.

**Fix**:
- Move subscription check BEFORE the notification_log insert — only claim the daily slot if the user actually has a subscription
- Replace all relative icon paths (`/icon-192x192.png`) with the absolute URL in `check-meal-reminders`, `notify-all-users`, and `test-push-notification`
- Add explicit success/failure logging after each push attempt so we can diagnose delivery

**Files**: `supabase/functions/check-meal-reminders/index.ts`, `supabase/functions/notify-all-users/index.ts`, `supabase/functions/test-push-notification/index.ts`

## 2. "Easy Recipes" Tab for Beginner Cooks

**Approach**: Classify recipes as "Super Easy" based on:
- `prepTime` <= 15 minutes
- `ingredients.length` <= 6

This covers purees, simple mashes, smoothies, and quick finger foods — perfect for moms who have never cooked before.

**Changes to Recipes page**:
- Add **"Easy Cooking"** as a quick-access filter button at the top of the filters (styled distinctly with a beginner-friendly icon)
- When active, show ONLY super-easy recipes with a friendly banner: "Simple recipes anyone can make — no cooking experience needed!"
- Add the filter to the existing category/age dropdown system so it works with other filters
- Sort easy recipes by prep time ascending (quickest first)

**File**: `src/pages/Recipes.tsx`

## Implementation Order
1. Fix `check-meal-reminders` logic ordering + icon URLs
2. Fix icon URLs in `notify-all-users` and `test-push-notification`
3. Deploy all 3 edge functions
4. Add "Easy Cooking" filter to Recipes page

