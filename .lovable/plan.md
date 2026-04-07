

# Plan: Smart Age-Based System, Shopping List Sync, Notifications Fix, Performance & Admin Upgrade

This plan addresses all 8 requests in priority order, grouped into logical implementation phases.

---

## Phase 1: Smart Age-Based Recipe Sorting (Requests 1 & 2)

**Goal**: Recipes page and Meal Planner automatically adapt to baby's age.

### Recipes Page (`src/pages/Recipes.tsx`)
- On mount, fetch baby's birth date from profile and calculate age in months
- Auto-set `selectedAge` filter to the baby's age group (e.g., "6-9 months")
- Within the filtered results, sort recipes: easiest first (by prepTime + ingredient count), harder ones after
- Show a "Recommended for [Baby Name]" section at top with age-matched recipes
- Other age groups still accessible below, but baby's age comes first by default

### Meal Planner (`src/utils/mealPlanGenerator.ts`)
- Already has `getRecipesForAge()` logic — verify it's correctly using the profile's `baby_birth_date`
- Ensure `generateWeeklyMealPlan` always passes the real baby age, not a hardcoded default

---

## Phase 2: Shopping List Sync with Meal Planner (Request 3)

**Goal**: Shopping list ingredients come directly from the current week's meal plan recipes.

### Current State
- `syncShoppingListFromMealPlans` in `src/utils/shoppingListSync.ts` already does this correctly — it fetches `meal_plans` for the current week, maps `recipe_id` to ingredients, and syncs to `shopping_list_items`
- The ShoppingList page calls `syncShoppingListFromMealPlans` on load

### Fix
- Verify that when the meal planner generates/regenerates a plan, it triggers a shopping list re-sync
- Add a "Sync from Meal Plan" button on the shopping list page if auto-sync isn't reflecting changes
- Debug: check if `week_start_date` calculation matches between meal planner and shopping list sync

---

## Phase 3: Push Notifications Architecture Fix (Requests 4 & 7)

**Goal**: Notifications work end-to-end — subscription, delivery, and admin broadcast.

### Browser Subscription Fix (`src/hooks/usePushNotifications.tsx`)
- Review the `acquireServiceWorker` flow for common failure points
- Add better error recovery: if subscription fails, clear stale registrations and retry
- Ensure the VAPID key fetch has proper error handling
- Add diagnostic logging to identify where the flow breaks

### Admin Broadcast Fix (`supabase/functions/notify-all-users/index.ts`)
- Verify the edge function deploys correctly and CORS headers are present
- Test the function end-to-end using `curl_edge_functions`
- Ensure the `NotificationComposer` properly invokes the function with auth headers

### Service Worker
- Verify `sw-listener.js` handles push events correctly
- Ensure `sw.js` (workbox) doesn't interfere with push subscription

---

## Phase 4: Performance Optimization (Request 5)

**Goal**: Ultra-fast loading, all images optimized.

### Image Optimization
- Scan `src/assets/` for remaining `.jpg` and `.png` files used in recipe cards
- Convert all to WebP format using a batch script
- Update all imports in `recipeImages.ts` to use `.webp` versions
- Add `loading="lazy"` and `decoding="async"` to all recipe card images (already has `loading="lazy"`)

### Bundle Optimization
- Already uses lazy loading for routes — verify all heavy pages are lazy-loaded
- Check for any large inline data or unused imports
- Ensure recipe data files aren't all bundled together if only a subset is needed

---

## Phase 5: Smart Install Banner (Request 8)

**Goal**: Show download/install button when user is in browser, hide after install.

### Current State
- `SmartInstallBanner.tsx` exists and handles Chrome install prompt + iOS instructions
- Already hides when installed or in standalone mode

### Enhancement
- Make the banner more prominent (sticky bottom bar instead of dismissible)
- When user installs (detected via `display-mode: standalone`), auto-hide permanently
- Add a prominent "Download App" button in the header or bottom nav for browser users

---

## Phase 6: Admin Panel Enhancement (Request 9)

**Goal**: Comprehensive admin dashboard with detailed user analytics and activity tracking.

### New Admin Features
1. **User Activity Detail View**: Click on any user to see their full activity — recipes viewed, tabs visited, meal plans created, last active time
2. **Enhanced Metrics Dashboard**: 
   - Daily/Weekly/Monthly Active Users (DAU/WAU/MAU)
   - Recipe popularity rankings
   - Meal plan completion rates
   - Notification delivery success rates
   - User retention cohorts
3. **Activity Feed**: Real-time feed of user actions (recipe views, meal plans, check-ins)
4. **Better Notification Management**: Segment users by activity level, send targeted notifications

### Database
- The `activity_logs` table exists but may need more granular tracking
- Enhance `useSessionTracking` to log page views and key actions to `activity_logs`
- Create a new admin view component that queries these logs per user

### Implementation
- Add new admin tabs or expand existing ones
- Create `UserActivityDetail` component showing per-user analytics
- Add charts for retention, engagement trends, recipe popularity

---

## Technical Summary

| Phase | Files Modified | Priority |
|-------|---------------|----------|
| 1 - Age-based recipes | `Recipes.tsx`, `mealPlanGenerator.ts` | High |
| 2 - Shopping list sync | `shoppingListSync.ts`, `ShoppingList.tsx` | High |
| 3 - Notifications fix | `usePushNotifications.tsx`, edge functions | High |
| 4 - Performance | `recipeImages.ts`, asset conversion | Medium |
| 5 - Install banner | `SmartInstallBanner.tsx`, `Header.tsx` | Medium |
| 6 - Admin upgrade | Admin components, `useSessionTracking.tsx` | Medium |

Each phase is independent and can be implemented sequentially. Phases 1-3 are the highest priority as they directly impact user experience and core functionality.

