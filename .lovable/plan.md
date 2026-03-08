

# Shopping List Loading State Fix

## Problem
The Shopping List page shows a blank white screen (or the empty state) while data loads from the database. No visual feedback tells the user something is happening.

## Changes

### `src/pages/ShoppingList.tsx`

1. Add a `isLoading` state (default `true`), set to `false` after `loadShoppingList` completes (or if no user found)
2. While `isLoading === true`, show a polished loading skeleton with:
   - Animated shopping cart icon
   - Message: **"Building your shopping list..."** with subtitle "Checking your meal plan for this week"
   - Pulsing skeleton cards mimicking the category layout
3. Only show the empty state OR the items list AFTER loading is complete (`isLoading === false`)

This is a single-file change — no database or other file modifications needed.

