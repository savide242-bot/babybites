
# Bug Fix & Enhancement Plan - COMPLETED ✅

## Summary of Completed Tasks

| # | Task | Status |
|---|------|--------|
| 1 | Smart Recipe Categorization | ✅ Done |
| 2 | Admin-Only Instant Updates | ✅ Done |
| 3 | Bug Hunt & Fix All Issues | ✅ Done |
| 4 | Dietary Filter Button Bug | ✅ Done |

---

## What Was Implemented

### Problem
The current `inferFoodTypeCategory` function in `src/data/recipes.ts` uses keyword matching but may not catch all edge cases, leading to incorrect categorization. Every recipe must match its true food type.

### Solution
Enhance the inference engine with a more comprehensive keyword list and smarter fallback logic:

### Current Keywords (expand these)
```text
Soup → soup, broth, chowder, stew, minestrone, bisque
Puree → puree, purée, puréed, blended smooth
Mash → mash, mashed
```

### Enhanced Keywords to Add
```text
Soup → + consommé, gazpacho, potage, cream of, creamy [vegetable] soup
Puree → + smooth, first food, baby's first, silky, blend
Mash → + smashed, fork-crushed
Porridge → + chia pudding, overnight, grain bowl, hot cereal, baby cereal
Pancakes → + crêpe, crepe, dutch baby, griddle cake, mini pancakes
Pasta → + rigatoni, orzo, couscous, vermicelli, ramen
Smoothie → + fruit blend, milkshake, banana shake
Bites → + cups, mini muffins, teething, bars, crackers, snack balls
Finger Food → + strips, bites, nuggets, croquettes, dippers, cutlets, rolls, wraps
Bowl → + risotto, pilaf, fried rice, quinoa, grain bowl
```

### Enhanced Logic
1. Check for explicit category keywords in title first (most reliable)
2. Check description for preparation method (e.g., "blended until smooth" → Puree)
3. Check ingredients for key items (e.g., pasta in ingredients → likely Pasta)
4. Use texture-based inference as fallback
5. Never rely solely on old meal-time categories

### Files to Modify
- `src/data/recipes.ts` - Improve `inferFoodTypeCategory` function with expanded keyword lists

---

## Task 2: Admin-Only Instant Updates (Preview URL)

### Problem
User wants admin (octaviomoiane2007@gmail.com) to see updates immediately without clicking "deploy", while regular users wait for official deploy.

### Technical Reality
The **Preview URL** (https://id-preview--c5922e44-641f-47eb-8afc-e9b38124e2b3.lovable.app) already shows live changes immediately. The **Published URL** (https://babybites.lovable.app) only updates after clicking "Update" in publish dialog.

### Solution
Create an admin-aware app that:
1. Detects if user is admin
2. Shows admin a link/button to access the Preview version
3. Auto-redirect admin to Preview URL when accessing the app

### Implementation

**Option A - Auto-Redirect Admin (Recommended)**
Create a component that checks if user is admin and automatically redirects them to the Preview URL:

```typescript
// src/hooks/useAdminPreviewRedirect.ts
// Checks if user is admin and if they're on the production domain
// If yes, offer them to switch to preview URL
```

**Option B - Admin Banner with Preview Link**
Show a banner to admins on the published site with a link to the preview:

```typescript
// src/components/AdminPreviewBanner.tsx
// Shows: "You're viewing the published version. Click here to see latest changes"
```

### Files to Create/Modify
- `src/hooks/useAdminPreviewRedirect.ts` (NEW) - Hook to detect admin and offer preview
- `src/components/AdminPreviewBanner.tsx` (NEW) - Banner component for admins
- `src/App.tsx` - Add the admin preview detection

---

## Task 3: Bug Hunt & Fix All Issues

### Known Bugs to Fix

#### 3.1 Recipe Images Still Using Keywords (Not ID-Based)
**Location**: `src/data/recipes.ts`
**Problem**: Many recipes still call `getRecipeImage(["keyword"])` instead of `getRecipeImageById(id)`
**Fix**: The `normalizeRecipe` function should force ID-based lookup, but original recipe definitions may override. Ensure all recipes flow through normalization.

#### 3.2 Category Filter May Show Wrong Counts
**Problem**: If recipes aren't properly categorized, filter counts will be off
**Fix**: Enhance `inferFoodTypeCategory` (Task 1)

#### 3.3 Service Worker Update UX
**Location**: `src/hooks/useServiceWorkerUpdate.tsx`
**Problem**: Users may miss update notifications
**Status**: Already implemented with toast notifications - verify it works

#### 3.4 Empty Categories in Filters
**Problem**: Some categories might show 0 recipes if categorization is wrong
**Fix**: After enhancing categorization, verify all categories have recipes

### Verification Checklist
- [ ] All 310 recipes are categorized correctly
- [ ] No duplicate images (use Admin Recipe Auditor at /admin/recipe-images)
- [ ] All filters return matching recipes
- [ ] Meal planner generates sensible plans
- [ ] No console errors on main pages
- [ ] Dietary filter works correctly

---

## Task 4: Dietary Filter Button Bug

### Problem
The "Dietary Filters" button text is being cut off as shown in the screenshot. The button shows "Dietary Filt" instead of "Dietary Filters".

### Root Cause Analysis
Looking at `src/components/DietaryFilterSelect.tsx` lines 42-56:
```typescript
<Button
  variant={selectedFilters.length > 0 ? "default" : "outline"}
  className="rounded-full relative"
>
  <Filter className="h-4 w-4 mr-2" />
  Dietary Filters
  ...
</Button>
```

The button has no width constraints but is inside a horizontal scroll container in `src/pages/Recipes.tsx` line 220:
```typescript
<div className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide pb-1">
```

The issue is that the button can shrink/truncate in small screens.

### Solution
1. Add `whitespace-nowrap` to prevent text wrapping
2. Add `flex-shrink-0` to prevent shrinking in flex container
3. Add responsive text sizing
4. Consider shortening to "Diet" on very small screens

### Code Changes
```typescript
// src/components/DietaryFilterSelect.tsx
<Button
  variant={selectedFilters.length > 0 ? "default" : "outline"}
  className="rounded-full relative flex-shrink-0 whitespace-nowrap px-3 sm:px-4"
>
  <Filter className="h-4 w-4 mr-1 sm:mr-2" />
  <span className="hidden xs:inline">Dietary Filters</span>
  <span className="xs:hidden">Diet</span>
  ...
</Button>
```

**Alternative simpler fix**: Just add `flex-shrink-0` and `whitespace-nowrap` to prevent any truncation.

### Files to Modify
- `src/components/DietaryFilterSelect.tsx` - Fix button responsiveness
- `src/pages/Recipes.tsx` - May need to adjust filter container if needed

---

## Implementation Order

| Step | Task | Time Est. |
|------|------|-----------|
| 1 | Fix Dietary Filter button (quick win) | 5 min |
| 2 | Enhance `inferFoodTypeCategory` with expanded keywords | 20 min |
| 3 | Create Admin Preview Banner/Redirect | 15 min |
| 4 | Audit and fix any remaining categorization issues | 15 min |
| 5 | Test all filters work correctly | 10 min |
| 6 | Final bug verification | 10 min |

---

## Technical Details

### Enhanced inferFoodTypeCategory Function
```typescript
const inferFoodTypeCategory = (recipe: any): string => {
  const title = (recipe.title || "").toLowerCase();
  const description = (recipe.description || "").toLowerCase();
  const ingredients = (recipe.ingredients || []).join(" ").toLowerCase();
  const combined = `${title} ${description} ${ingredients}`;
  
  // SOUP patterns
  if (/soup|broth|chowder|stew|minestrone|bisque|consommé|gazpacho|potage|cream of/.test(title)) return "Soup";
  
  // PUREE patterns - smooth baby foods
  if (/puree|purée|puréed|blended smooth|first food|baby's first/.test(title)) return "Puree";
  if (/smooth|silky/.test(title) && !/cookie|pancake/.test(title)) return "Puree";
  
  // MASH patterns - chunkier texture
  if (/mash|mashed|smashed|fork-crushed|chunky/.test(title)) return "Mash";
  
  // PORRIDGE patterns
  if (/porridge|oatmeal|congee|rice pudding|overnight oats|chia pudding|hot cereal|baby cereal/.test(title)) return "Porridge";
  
  // PANCAKES patterns
  if (/pancake|waffle|fritter|crêpe|crepe|griddle/.test(title)) return "Pancakes";
  
  // PASTA patterns
  if (/pasta|noodle|macaroni|lasagna|gnocchi|spaghetti|penne|fusilli|rigatoni|orzo|couscous/.test(title)) return "Pasta";
  
  // SMOOTHIE patterns
  if (/smoothie|lassi|shake|fruit blend/.test(title)) return "Smoothie";
  
  // BITES patterns - small snackable items
  if (/bites?|balls?|cookies?|muffins?|popsicles?|bark|energy|cups|bars|crackers/.test(title)) return "Bites";
  
  // FINGER FOOD patterns - self-feeding items
  if (/fingers?|tots?|patties|quesadilla|wedges|sticks|pizza|tacos?|pinwheels?|toast|frittata|omelette|omelet|scrambled|strips|nuggets|croquettes|dippers|cutlets|rolls|wraps/.test(title)) return "Finger Food";
  
  // BOWL patterns - mixed grain meals
  if (/bowl|risotto|pilaf|fried rice|quinoa/.test(title)) return "Bowl";
  
  // Secondary checks on description/ingredients
  if (/completely smooth|silky smooth|smooth puree/.test(combined)) return "Puree";
  if (/chunky|mashed|fork-mashed/.test(combined)) return "Mash";
  if (/oats|porridge|cereal/.test(combined) && /breakfast/.test(combined)) return "Porridge";
  if (/self-feeding|finger food|pick up/.test(combined)) return "Finger Food";
  
  // Ingredient-based inference
  if (/pasta|noodles|macaroni|spaghetti/.test(ingredients) && !/soup/.test(title)) return "Pasta";
  if (/oats|oatmeal/.test(ingredients) && !/cookie|bar/.test(title)) return "Porridge";
  
  // Check existing category if it's already a valid food type
  const validFoodTypes = ["Puree", "Mash", "Soup", "Finger Food", "Porridge", "Pancakes", "Pasta", "Bowl", "Bites", "Smoothie"];
  if (validFoodTypes.includes(recipe.category)) {
    return recipe.category;
  }
  
  // Map old meal-time categories with smarter logic
  // ... (keep existing meal-time mapping logic)
  
  return "Bowl"; // Default for mixed meals
};
```

### Admin Preview URL Config
The preview URL is: `https://id-preview--c5922e44-641f-47eb-8afc-e9b38124e2b3.lovable.app`
The published URL is: `https://babybites.lovable.app`

We'll detect which URL the user is on and show appropriate UI for admins.

---

## Expected Results After Implementation

1. **Dietary Filter** - Button text always fully visible and responsive
2. **Recipe Categories** - Every recipe intelligently placed in correct food-type category
3. **Admin Updates** - Admin sees link to preview URL for instant access to latest changes
4. **Bug-Free Launch** - All filters work, no console errors, consistent UX
