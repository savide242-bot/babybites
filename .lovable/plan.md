

# Home Page CTA + Custom Plan Bug Fix

## Issues

1. **Home page needs a professional CTA** to guide moms to the personalized meal planner
2. **Custom plan add-meal bug**: The `onConflict` clause in `addMealToCustomPlan` (line 390) uses `'user_id,week_start_date,day_of_week,meal_type'` but the database unique constraint is now `(user_id, week_start_date, day_of_week, meal_type, plan_type)`. This mismatch causes upserts to fail because Postgres can't find a matching unique index.
3. Everything must be in English

## Changes

### 1. Home Page CTA (`src/components/home/PlanMealsPrompt.tsx`)

Replace the current simple "Plan today's meals" prompt with a professional, concise message:

**Title**: "A personalized plan for your baby"
**Subtitle**: "Balanced, nutritious meals tailored to your baby's age and needs — ready in seconds."
**CTA button**: "Create Personalized Plan" → navigates to `/planner` (which opens the Personalized Plan tab)

Keep it compact — no more than 3 lines of text plus the button.

### 2. Fix Custom Plan Bug (`src/pages/MealPlanner.tsx`)

Update ALL 3 `onConflict` references to include `plan_type`:
- Line 390: `onConflict: 'user_id,week_start_date,day_of_week,meal_type,plan_type'`
- Line 511: same fix
- Line 574: same fix

### 3. All text in English

Both files already use English text. The new CTA copy will be in English.

## Files to Modify

| File | Change |
|------|--------|
| `src/components/home/PlanMealsPrompt.tsx` | New professional CTA message + navigate to planner |
| `src/pages/MealPlanner.tsx` | Fix 3x `onConflict` to include `plan_type` |

