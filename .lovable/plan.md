
## Goal (what will change)
1) **All existing recipes** will use **food-type categories** (Puree, Soup, Finger Food, Pasta, Bowl, etc.) — **no more Breakfast/Lunch/Dinner/Snack as categories**.  
2) **Recipe images will stop repeating** due to mapping/fallback issues, and we’ll add a **systematic “detect duplicates → regenerate → permanently fix”** pipeline so this doesn’t keep coming back.

---

## Why you’re still seeing duplicated images (root causes)
Even though `recipeImageMap` exists, **some recipes still choose images using non-ID keywords** (example in `src/data/recipes.ts`: `getRecipeImage(["tropical"])`, `getRecipeImage(["egg"])`, etc.).  
When an ID is not included, `getRecipeImage()` can:
- map multiple recipes to the same keyword-based ID, or
- fall back to a **hash-based fallbackId**, which inevitably creates collisions over time.

That’s why you “see one or two recipes” with the same image: it’s not a manual mistake — it’s the current selection method allowing collisions.

---

## Deliverable A — Reclassify 300 recipes to food-type categories (without editing 300 entries manually)
### Strategy
Instead of editing every recipe file (risky and slow), we’ll do **central normalization** in `src/data/recipes.ts` when exporting the final `recipes[]`.

### Changes
1) **Extend the recipe model**
- Add a new optional field like:
  - `mealTime?: "Breakfast" | "Lunch" | "Dinner" | "Snack"` (metadata only; not used as category)
- Keep `category` as the **food type** used by filters.

2) **Create a food-type inference function**
In `src/data/recipes.ts`, implement:
- `inferFoodTypeCategory(recipe): string`
  - Uses robust English keyword heuristics from `recipe.title`, `recipe.description`, and `recipe.ingredients`.

Example rules (high-level):
- If title contains: `soup | broth | chowder | stew | minestrone` → `Soup`
- `puree` → `Puree`
- `mash | mashed` → `Mash`
- `porridge | oatmeal | congee | rice pudding` → `Porridge`
- `pancake | waffle` → `Pancakes`
- `pasta | noodle | macaroni | lasagna | gnocchi` → `Pasta`
- `smoothie | lassi` → `Smoothie`
- `bites | balls | cookies | muffins | popsicles | bark` → `Bites`
- `fingers | tots | patties | quesadilla | wedges | sticks | pizza | tacos | pinwheels` → `Finger Food`
- Otherwise: `Bowl` (default for “mixed meals” like rice/quinoa/risotto/couscous dishes)

3) **Normalize every recipe at export time**
When building the final exported array, apply:
- `normalizeRecipe()` before `addDefaultFields()`, so every recipe ends up with a valid food-type `category`.

This will reclassify all imported shards:
- `additionalRecipes.ts`
- `recipes47-100.ts`
- `recipes101-150.ts`
- `recipes151-200.ts`
- `recipes201-205.ts`
- `recipes206-238.ts`
- `recipes239-271.ts`
- `recipes272-300.ts`
- `recipes301-310.ts`

4) **Update any UI logic that still assumes old categories**
At minimum:
- `src/pages/FirstDay.tsx` currently sorts by `["Puree", "Breakfast"]`, `["Finger Food","Lunch","Dinner"]`, etc.  
  We’ll update that to prefer food types (example):
  - <9 months: `["Puree","Mash","Soup"]`
  - 9–12: `["Finger Food","Puree","Mash","Soup"]`
  - 12+: `["Finger Food","Bowl","Pasta","Soup","Bites","Smoothie"]`

Also update:
- `src/utils/mealPlanGenerator.ts` mapping that currently references meal-time categories.

### Result
- Filters in `Recipes` will finally be consistent because **all 300+ recipes will have category values from the same food-type taxonomy**.

---

## Deliverable B — Fix duplicated recipe images permanently (not “today it’s fixed, tomorrow it’s broken”)
### Strategy (two-layer protection)
1) **Stop collisions at the source**: enforce **ID-based image selection everywhere**.
2) **Add an automated repair system**: detect duplicates → regenerate only the needed images → serve overrides from backend storage.

### Step 1 — Enforce ID-based images everywhere
1) In `src/data/recipes.ts` normalization:
- Override image assignment to always be ID-based:
  - `recipe.image = getRecipeImageById(recipe.id)`
This eliminates all keyword/fallback collisions in the recipe list used by:
- `src/pages/Recipes.tsx`
- `src/pages/RecipeDetail.tsx`
- `src/pages/Favorites.tsx`

2) Update other components still computing images ad-hoc:
- `src/components/meal-planner/MealCard.tsx` uses `getRecipeImage([recipe.id, recipe.title])`.  
  We’ll switch it to `getRecipeImageById(recipe.id)` for consistency and to avoid any future regressions.

### Step 2 — Add a “duplicate detection + auto-fix” pipeline
Because you’re also describing the case “two different IDs but same visual image”, we need detection that goes beyond just comparing URLs.

We’ll implement:

#### 2.1 Backend: a small table for overrides
Create a table (via migration):
- `recipe_image_overrides`
  - `recipe_id text primary key`
  - `image_url text not null`
  - `updated_at timestamptz default now()`
  - `created_at timestamptz default now()`

Policies:
- Authenticated users: **read** (so the app can display overrides)
- Writes: **only via backend function** (service role), not from the client

#### 2.2 Backend function: regenerate images for selected recipes
Create a backend function (edge function) like:
- `fix-recipe-images`
Input:
- `recipes: Array<{ id: string; title: string; ingredients: string[] }>`
- `maxCount?: number` safety limit

Behavior:
- For each recipe:
  - Generate a new high-quality image prompt that explicitly matches the recipe title + top ingredients
  - Generate image (Lovable AI image model)
  - Upload to file storage bucket using a deterministic filename:
    - `recipe-{id}.png` (upsert true)
  - Save public URL in `recipe_image_overrides` (upsert)

This gives you a permanent, centrally managed “correct image per recipe”.

#### 2.3 Frontend: automatic duplicate detector (admin tool)
Add an internal page/tool (admin-only or hidden route) that:
- Loads all recipes
- Loads the final resolved image for each recipe (override if exists, else default)
- Downloads images and computes **SHA-256 hash of bytes** in the browser (`crypto.subtle.digest`)
- Detects **exact duplicates** even if filenames differ
- Shows groups like:
  - “Hash XYZ used by recipes: 88, 142, 170”
- Button: “Fix duplicates automatically”
  - Sends all but one ID from each duplicate group to `fix-recipe-images`

This is the missing piece that makes it feel like “the app can finally identify duplicates and repair them”.

#### 2.4 Use overrides everywhere images are rendered
Create a small hook:
- `useRecipeImageOverrides()` → returns `{[recipeId]: imageUrl}`
Then introduce a single helper/component:
- `<RecipeImage recipeId fallbackSrc alt className />`
So all screens become consistent:
- Recipes grid
- Recipe detail
- Favorites
- Meal planner cards
- FirstDay page cards (it currently uses `getRecipeImageById()` already in one place; we’ll unify)

### Result
- Even if any local asset duplication exists, overrides will replace it.
- You can repair future duplicates in minutes, not weeks.

---

## Quality controls (to ensure “super functional and no bugs”)
1) **Category coverage check**
- Add a dev-only console report (or small internal UI widget) showing:
  - counts per category
  - categories with 0 recipes (must be none)

2) **Image uniqueness check**
- Dev-only report:
  - duplicates by src string (fast)
  - duplicates by SHA-256 hash (accurate)

3) **End-to-end verification checklist**
- Recipes page: filter each category and confirm it returns matching recipes
- Meal Planner: ensure meal plan generation still works and picks sensible types
- Favorites + Recipe detail: images remain consistent and correct

---

## Files we will touch (high confidence list)
### Category normalization
- `src/data/recipes.ts` (normalization + inference + mealTime metadata)
- `src/pages/FirstDay.tsx` (remove old preferredCategories)
- `src/utils/mealPlanGenerator.ts` (remove old category references; use food types)

### Image correctness + repair pipeline
- `src/components/meal-planner/MealCard.tsx` (use ID-based image)
- `src/pages/Recipes.tsx`, `src/pages/RecipeDetail.tsx`, `src/pages/Favorites.tsx` (render via resolved image)
- Add new backend function: `supabase/functions/fix-recipe-images/index.ts`
- Add new internal UI: `src/pages/AdminRecipeImages.tsx` (or similar)
- Add override-fetch hook: `src/hooks/useRecipeImageOverrides.ts`
- Database migration: create `recipe_image_overrides` + RLS

---

## Implementation order (so we stabilize quickly)
1) Enforce ID-based image selection in recipe export + key UI points (immediate win)
2) Add category normalization in `recipes.ts` (filters become correct without rewriting 300 recipes)
3) Update FirstDay + mealPlanGenerator to align with new taxonomy
4) Add overrides table + `fix-recipe-images` backend function
5) Add duplicate detector tool and run one clean-up batch
6) Final E2E testing on Recipes filters + Meal Planner + Favorites + Recipe detail

---

## What I need from you (one quick decision)
- Should the “duplicate repair tool” be:
  1) **Admin-only page** (recommended), or
  2) Hidden behind a secret key/gesture inside Settings?

If you approve this approach, I’ll implement it in a way that fixes today’s duplicates and prevents them from returning.
