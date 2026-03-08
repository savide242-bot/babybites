

# Plan: Recipe eBook PDF Export

## Overview
Create a premium eBook-style PDF with all 340 recipes, grouped by age group, with the same professional design language as the Advice eBook.

## eBook Structure

```text
Page 1:    Cover (BabyBites logo, "Livro de Receitas", date, recipe count)
Page 2:    Introduction (about the book, how to use)
Page 3-4:  Table of Contents (grouped by age: 6-9m, 9-12m, 12-18m, 18-24m, 24+)
           ── Age Group Divider: 6-9 Months ──
           Recipe pages (title, badges, ingredients, instructions, nutrition)
           ── Age Group Divider: 9-12 Months ──
           ...
Last:      Back Cover (disclaimer + credits)
```

## Recipe Page Layout
Each recipe gets a clean section with:
- Title + category/prep time/servings badges
- Ingredients list (two columns with checkboxes)
- Numbered instructions
- Nutrition grid (calories, protein, carbs, fat, fiber)
- Allergens + storage tips
- Separator line before next recipe (no forced page breaks between recipes to avoid blank pages)

## Technical Approach
- **All table-based layouts** (same as advice eBook -- no flexbox/grid for html2pdf compatibility)
- Reuse the same `html2pdf.js` + `html2pdf__page-break` pattern from the advice export
- Group recipes by `ageGroup` with colored divider pages per age group
- No images in PDF (html2canvas cross-origin issues with local assets) -- text-only clean design
- Download as `BabyBites-Livro-de-Receitas.pdf`

## Age Group Colors
- 6-9 months: `#ec4899` (pink)
- 9-12 months: `#f59e0b` (amber)
- 12-18 months: `#10b981` (green)
- 18-24 months: `#6366f1` (indigo)
- 24+ months: `#8b5cf6` (purple)

## Files
- **Create** `src/utils/recipeEbookExport.ts` -- full eBook generator
- **Edit** `src/pages/Recipes.tsx` -- add "Download eBook" button in the header area

