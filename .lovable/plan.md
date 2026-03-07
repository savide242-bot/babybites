

# Meal Planner Overhaul & Recipe Discovery Solution

## Problem Summary

7 issues to fix in the meal planner, plus a recipe discovery challenge:

1. Moms don't know what to choose from 315 recipes
2. New users need a clear "Generate plan for my baby's age" CTA
3. Plan generation feels instant/fake — needs loading animation
4. Personalized Plan and Custom Plan share the same data (critical bug)
5. "View AI Suggestions" text must be removed (no AI mentions)
6. Accepting personalized plan overwrites custom plan (critical bug)
7. Everything must be in English

---

## Root Cause of Bugs #4 and #6

In `loadMealPlan` (line 531-533), when a saved plan exists, it's loaded into **both** `mealPlan` and `autoPlan`:
```typescript
setMealPlan(plan);      // Custom plan state
setAutoPlan(plan);      // Personalized plan state
```

And in `acceptAIPlan` (line 441), accepting overwrites `mealPlan`:
```typescript
setMealPlan(newPlan);   // This IS the custom plan state
```

**Fix**: Separate the two plans completely. Use different database columns or a `plan_type` field to distinguish them. Store personalized plans with `plan_type = 'personalized'` and custom plans with `plan_type = 'custom'`.

---

## Task 1: Smart Recipe Recommendation ("What Should I Cook?")

Create a new feature on the Home page: **"What should I cook today?"** widget that gives moms a single, confident recommendation based on:
- Baby's age
- Time of day (breakfast/lunch/dinner/snack)
- What they haven't cooked recently (from `meal_plans` and `recipe_views`)
- Dietary preferences

This replaces decision paralysis with a single actionable suggestion. Shows one recipe card with a "Cook This" button and a "Show me another" link.

**Files**: Create `src/components/home/WhatToCookWidget.tsx`, add to `src/pages/Home.tsx`

---

## Task 2: Database Migration — Add `plan_type` Column

Add a `plan_type` column to `meal_plans` table to separate personalized vs custom plans:

```sql
ALTER TABLE public.meal_plans ADD COLUMN plan_type text NOT NULL DEFAULT 'custom';
-- Update existing records to 'custom' (they're currently mixed)
UPDATE public.meal_plans SET plan_type = 'custom' WHERE plan_type IS NULL OR plan_type = '';
```

This is the foundation for fixing bugs #4 and #6.

---

## Task 3: Complete Meal Planner Rewrite (Core Logic)

Rewrite `src/pages/MealPlanner.tsx` with these changes:

### Separate State
- `personalizedPlan` state — loaded/saved with `plan_type = 'personalized'`
- `customPlan` state — loaded/saved with `plan_type = 'custom'`
- These never cross-contaminate

### Personalized Plan Tab
- For new users: Show a prominent CTA button: **"✨ Generate a Weekly Plan for Your Baby"** with subtitle "Personalized meals based on your baby's age and dietary needs"
- On click: Show a **loading overlay** with animated spinner + message: *"Creating a personalized plan for your little one... 🍼"* — wait 2-3 seconds (artificial delay for UX trust), then reveal the plan
- After generation: Show "Accept & Save" and "Try Another" buttons
- Accepting saves with `plan_type = 'personalized'` — does NOT touch custom plan

### Custom Plan Tab
- Always starts empty for new users (no pre-populated data)
- Shows clear empty state: "This is your personal space. Add meals one by one to build your own weekly plan."
- Remove "View AI Suggestions" button text — replace with **"View Suggestions"** (no AI mention)
- Add visible "Save Changes" confirmation toast when meals are added
- Each meal addition auto-saves but shows a brief "✅ Saved" toast so moms know it persisted

### Loading Animation Component
Create `src/components/meal-planner/PlanGeneratingOverlay.tsx`:
- Full-overlay with blurred background
- Animated cooking pot/utensils icon
- Progress text cycling: "Selecting nutritious recipes..." → "Balancing vitamins & proteins..." → "Almost ready..."
- 2-3 second duration before revealing the actual plan

---

## Task 4: Remove All AI Mentions

Scan and replace in `MealPlanner.tsx`:
- "View AI Suggestions" → "View Suggestions" (line 1141)
- `aiPlanAccepted` variable → `personalizedPlanAccepted`
- "AI" in any user-visible text → remove or replace with "Smart"/"Personalized"
- The tab name "Personalized Plan" is already correct — keep it

---

## Task 5: "What to Cook" Widget on Home

**File**: `src/components/home/WhatToCookWidget.tsx`

Based on current time of day, baby age, and recent history, recommend ONE recipe with:
- Recipe image, title, prep time, nutrition highlights
- "Let's Cook This! 🍳" primary button → navigates to recipe
- "Show me another" secondary link → shuffles
- Subtle animated border to draw attention

Add to Home page between the greeting and Recipe of the Day sections.

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/pages/MealPlanner.tsx` | Major rewrite: separate plan states, loading animation, remove AI text, fix accept logic |
| `src/components/meal-planner/PlanGeneratingOverlay.tsx` | NEW — loading animation overlay |
| `src/components/home/WhatToCookWidget.tsx` | NEW — "What should I cook?" smart recommendation |
| `src/pages/Home.tsx` | Add WhatToCookWidget |

---

## Implementation Order

1. Rewrite MealPlanner with completely separated plan states (fixes bugs #4, #6)
2. Add plan generation loading overlay (fixes #3)
3. Add "Generate plan for my baby" CTA for new users (fixes #2)
4. Remove all AI mentions (fixes #5)
5. Create WhatToCookWidget for recipe discovery (fixes #1)
6. Verify everything is in English (#7)

