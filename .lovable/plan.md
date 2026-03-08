

# Comprehensive Update Plan

This is a large multi-part request. I'll address each item plus the critical build errors that need fixing first.

---

## 0. Fix Build Errors (BLOCKING - must fix first)

The `pushManager` TypeScript error occurs because the default `ServiceWorkerRegistration` type doesn't include `pushManager`. Fix by adding a type assertion `(registration as any).pushManager` in all 4 files:

- `src/hooks/usePushNotifications.tsx` (lines 100, 150, 175)
- `src/components/admin/SystemHealth.tsx` (line 171)
- `src/components/NotificationPreferences.tsx` (line 179)
- `src/pages/IOSPushSetup.tsx` (line 148)

---

## 1. Daily Admin Report Edge Function

Create `supabase/functions/daily-admin-report/index.ts` that:
- Queries `user_sessions` for DAU (distinct users active today)
- Queries `profiles` for new signups (created_at = today)
- Queries `recipe_views` for top 5 most viewed recipes today
- Queries `user_streaks` for average current_streak
- Queries `meal_plans` for total meals planned today
- Sends a formatted push notification to admin's push subscription
- Add to `supabase/config.toml` with `verify_jwt = false` (called by cron)

---

## 2. Add 5 New Recipes

Add 5 new recipes (IDs 311-315) to a new file `src/data/recipes311-315.ts` and import in `src/data/recipes.ts`. Recipes will cover underrepresented categories for variety. Then trigger a notification to all users about new recipes via the existing `notify-all-users` edge function from the admin panel.

---

## 3. Performance Optimization

- Add `React.memo` to heavy list items: recipe cards in `Recipes.tsx`
- Add `useMemo` for filtered recipe lists
- Lazy-load recipe images with `loading="lazy"` attribute
- Minimize re-renders in Home.tsx by memoizing derived values

---

## 4. UI/UX Enhancements ("Crazy Effects")

Enhance visual experience across key pages:

**Home Page:**
- Add animated gradient text for greetings using CSS `background-clip: text`
- Add staggered card entrance animations (already has framer-motion, enhance timing)
- Add parallax floating food emojis in background
- Add shimmer/shine effect on Recipe of the Day card

**Recipe Cards:**
- Add 3D tilt effect on hover using `transform: perspective()` with framer-motion
- Add gradient border glow on favorite recipes
- Add micro-interaction: heart button with particle burst on favorite

**Recipes Page:**
- Add count badges on category filters showing recipe count per category
- Add smooth skeleton loading with wave animation

**General:**
- Add page transition animations between routes
- Add pull-to-refresh gesture feel on mobile
- Add confetti burst when completing all daily meals

---

## 5. Precision & Weak Points Fix

- Ensure all nutrition data uses consistent units (g, mg, kcal)
- Fix any recipes with missing or placeholder nutrition values
- Verify allergen data completeness across all recipes
- Ensure dietary filter tags are correctly mapped for all 315 recipes

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/hooks/usePushNotifications.tsx` | Fix pushManager type |
| `src/components/admin/SystemHealth.tsx` | Fix pushManager type |
| `src/components/NotificationPreferences.tsx` | Fix pushManager type |
| `src/pages/IOSPushSetup.tsx` | Fix pushManager type |
| `supabase/functions/daily-admin-report/index.ts` | NEW - admin metrics |
| `supabase/config.toml` | Add daily-admin-report config |
| `src/data/recipes311-315.ts` | NEW - 5 new recipes |
| `src/data/recipes.ts` | Import new recipes |
| `src/pages/Recipes.tsx` | Perf + UI enhancements |
| `src/pages/Home.tsx` | Visual effects upgrade |
| `src/components/ui/glass-card.tsx` | Enhanced glow effects |
| `src/index.css` | New animation keyframes |

---

## Implementation Order

1. Fix TypeScript build errors (unblocks everything)
2. Create daily-admin-report edge function
3. Add 5 new recipes
4. Performance optimizations (memo, lazy loading)
5. UI/UX crazy effects (animations, transitions, 3D)
6. Precision fixes on recipe data

