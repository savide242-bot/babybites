

## Plan: Add 15 New 24+ Months Recipes with Unique Images

### Task 1: Create 15 New Recipes (IDs 326-340)

**Create `src/data/recipes326-340.ts`** with 15 nutrient-dense, development-focused recipes for toddlers 24+ months. All in English, with highly detailed step-by-step instructions (matching the quality of existing recipes 316-325). Each recipe will include:
- Full description, ingredients with exact measurements, 6-8 detailed instruction steps
- Complete nutrition data, allergens, storage tips
- `ageGroup: "24+ months"` (never "24-36")

Recipes planned (all focused on strong nutrients and baby development):
1. **326** - Salmon & Sweet Potato Cakes (Omega-3, brain development)
2. **327** - Iron-Rich Beef & Lentil Stew (Iron, growth)
3. **328** - Spinach & Cheese Mini Muffins (Calcium, Vitamin K)
4. **329** - Turkey & Vegetable Meatloaf Bites (Protein, B12)
5. **330** - Creamy Avocado & Chickpea Wrap (Healthy fats, fiber)
6. **331** - Baked Cod with Mango Salsa (DHA, Vitamin C)
7. **332** - Broccoli & Cheddar Stuffed Potatoes (Calcium, Vitamin C)
8. **333** - Lentil & Carrot Shepherd's Pie (Iron, Vitamin A)
9. **334** - Banana Oat Energy Balls (Energy, fiber)
10. **335** - Greek Yogurt Chicken Dippers (Protein, probiotics)
11. **336** - Veggie-Loaded Mini Frittatas (Eggs, varied vitamins)
12. **337** - Peanut Butter Banana Toast Fingers (Healthy fats, energy)
13. **338** - Butternut Squash & Apple Risotto (Beta-carotene, fiber)
14. **339** - Mini Fish Pie with Cheesy Mash (Omega-3, Calcium)
15. **340** - Berry & Oat Breakfast Crumble (Antioxidants, whole grains)

### Task 2: Generate 15 Unique Images

Create 15 new image assets in `src/assets/recipes/`:
- `recipe-326-salmon-sweet-potato-cakes.jpg` through `recipe-340-berry-oat-crumble.jpg`
- Each generated with professional baby food photography styling

### Task 3: Update Registry Files

**`src/data/recipeImages.ts`**:
- Import all 15 new images
- Add entries 326-340 to `recipeImageMap`

**`src/data/recipes.ts`**:
- Import `recipes326to340` from the new file
- Add `...recipes326to340` to the recipes array

### Task 4: Verify English-Only

All text across the new recipes and any modified files will be exclusively in English.

### Files Summary
1. **Create** `src/data/recipes326-340.ts` — 15 detailed recipes
2. **Create** 15 image files in `src/assets/recipes/`
3. **Edit** `src/data/recipeImages.ts` — import + map 15 images
4. **Edit** `src/data/recipes.ts` — import + spread new recipes

