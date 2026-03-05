

# Performance, Visual Impact & Data Accuracy Fix

## Issues Identified

1. **Recipes page slow**: Rendering 315 recipe cards with framer-motion `initial/animate` per card is expensive. Each card runs its own animation on mount, causing jank.
2. **Auth page lies**: Shows "500+ recipes" (actual: 315) and "10,000+ moms" (inflated). Must use real numbers.
3. **Home page animations too subtle**: The current effects (tiny pulse orbs, soft gradients) are barely noticeable. Need bold, eye-catching animations.
4. **App feels "stiff"**: Transitions between sections lack fluidity.

---

## Changes

### 1. Recipes Page Performance (`src/pages/Recipes.tsx`)

- **Remove per-card framer-motion `initial/animate`** from `RecipeCard`. Replace with CSS-only `animation` using a staggered `animation-delay` via inline style. This eliminates 315 React animation instances.
- **Virtualize rendering**: Only render first 30 recipes initially, add "Load More" or intersection observer to load batches of 30. This cuts initial DOM nodes from 315 to 30.
- **Remove `whileHover={{ y: -8, scale: 1.02, rotateY: 2 }}`** from motion.div — replace with pure CSS `hover:` transforms (GPU-accelerated, no JS).
- Change `RecipeCard` wrapper from `motion.div` to plain `div` with CSS classes.

### 2. Auth Page Data Fix (`src/pages/Auth.tsx`)

- Line 299: Change `10,000+ moms` → `300+ moms`
- Line 308: Change `500+ recipes` → `315 recipes`

### 3. Home Page Bold Effects (`src/pages/Home.tsx`)

- **Floating food emojis**: Add 5-6 animated food emojis (🥑🍌🥕🍠🥦) floating across the background with CSS `@keyframes float-across` — large, visible, slow drift.
- **Animated gradient background**: Replace static gradient with a slowly shifting animated gradient using `bg-[length:400%_400%] animate-[gradient-shift_8s_ease_infinite]`.
- **Greeting text**: Make the name gradient text shimmer visibly with `animate-[shimmer_2s_ease-in-out_infinite]`.
- **Recipe of the Day card**: Add a pulsing golden border glow animation (`animate-[glow-pulse_3s_ease-in-out_infinite]`).
- **Card entrance**: Increase stagger to 0.15s and add scale from 0.9→1 for more dramatic reveal.

### 4. New CSS Animations (`src/index.css`)

Add these keyframes:
- `gradient-shift`: shifts background-position for animated gradients
- `float-across`: moves emojis diagonally across screen (translateX + translateY + rotate)
- `card-entrance`: opacity 0→1 + translateY 30px→0 + scale 0.95→1
- `shimmer-strong`: more aggressive shimmer for text gradients

### 5. Glass Card Enhancement (`src/components/ui/glass-card.tsx`)

- Add a subtle `animate-[card-entrance_0.4s_ease-out_both]` CSS class instead of framer-motion `initial/animate` (lighter).

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Recipes.tsx` | Remove framer-motion from cards, add CSS animations, add pagination/lazy loading (show 30, load more) |
| `src/pages/Auth.tsx` | Fix "500+ recipes" → "315 recipes", "10,000+ moms" → "300+ moms" |
| `src/pages/Home.tsx` | Add floating food emojis, animated gradient BG, stronger card animations |
| `src/index.css` | Add `gradient-shift`, `float-across`, `card-entrance`, `shimmer-strong` keyframes |
| `src/components/ui/glass-card.tsx` | Replace framer-motion with CSS animation for lighter rendering |
| `src/components/ui/emotional-header.tsx` | Make greeting name shimmer more visibly |

