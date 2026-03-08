

## Plan: Add 24+ Month Recipes, Fix Images, and Beautiful PDF Export

### Task 1: Add 10 Recipes for "24+ months"

**What changes:**
- Create `src/data/recipes316-325.ts` with 10 new recipes for toddlers 24+ months (e.g., Mini Chicken Tacos, Veggie Fried Rice, Fruit Salad Bowl, Mac & Cheese Bites, etc.)
- All recipes use `ageGroup: "24+ months"` (not "24-36 months")
- Each recipe has full details: id, title, description, ingredients, instructions, nutrition, allergens, storage
- Images use `getRecipeImageById` (will map to existing varied images in recipeImageMap for IDs 316-325)

**Files to modify:**
- Create `src/data/recipes316-325.ts` -- 10 complete recipes
- `src/data/recipes.ts` -- import and spread `recipes316to325`, add `"24+ months"` to `ageGroups` array
- `src/data/recipeImages.ts` -- add mappings for IDs 316-325 (reuse distinct existing images as placeholders since we can't generate static assets)
- `src/components/home/AgeCategoryCircles.tsx` -- add a "24+ months" circle with emoji "🍱", color `from-gold to-gold/70`, and update the `getActiveCategory` logic for 24+
- `src/pages/RecipeDetail.tsx` -- no changes needed (already supports any ageGroup string)

### Task 2: Generate Images for New Recipes via Edge Function

Since we cannot add static image files, the new 10 recipes will initially use fallback images from the existing pool (mapped to distinct images). The admin can use the existing `fix-recipe-images` edge function to generate AI images for them. No code changes needed for this -- the existing infrastructure handles it.

For duplicate image detection, the existing `/admin/recipe-images` page already handles scanning and fixing. No additional changes needed.

### Task 3: Beautiful PDF Export with Template

**Current state:** The "Export PDF" button actually exports a plain `.txt` file with emoji characters. This needs a complete rewrite.

**New approach:** Create a `RecipePDFExport` utility that generates a proper styled HTML page and uses `window.print()` to produce a beautiful PDF. The template will:

- Use a clean, mobile-optimized print layout
- Include BabyBites logo/branding header with gradient accent
- Recipe title, age group badge, prep time, servings in a styled hero section
- Recipe image (if available)
- Ingredients in a clean two-column grid with checkboxes
- Instructions with numbered steps in cards
- Nutrition info in a visual grid (calories, protein, carbs, fat, fiber)
- Allergen warnings in colored badges
- Storage tips and health benefits sections
- Footer with "Made with love by BabyBites" branding

**Files to create/modify:**
- Create `src/utils/recipePDFExport.ts` -- contains `exportRecipePDF(recipe: Recipe)` function that:
  1. Creates a hidden iframe
  2. Writes a fully styled HTML document with inline CSS (print-optimized)
  3. Calls `iframe.contentWindow.print()` which triggers native PDF save
  4. Removes iframe after print
- `src/pages/RecipeDetail.tsx` -- replace `handleExportPDF` to call the new utility function

The template dynamically populates based on whichever recipe the user exports -- same template, different data. Optimized for mobile with `@media print` rules.

### Summary of all file changes:
1. **Create** `src/data/recipes316-325.ts` -- 10 new 24+ months recipes
2. **Edit** `src/data/recipes.ts` -- import new recipes, add age group
3. **Edit** `src/data/recipeImages.ts` -- add image mappings for 316-325
4. **Edit** `src/components/home/AgeCategoryCircles.tsx` -- add 24+ months circle
5. **Create** `src/utils/recipePDFExport.ts` -- beautiful PDF export utility
6. **Edit** `src/pages/RecipeDetail.tsx` -- use new PDF export

