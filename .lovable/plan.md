# Video Recipes — Native In-App Videos

## What you'll get

### 1. The 4 videos, hosted natively (no TikTok branding, no external hosting)
All 4 videos (22–26s each, 4–6.6 MB) will be uploaded to the app's CDN — they'll play instantly, look 100% native, and carry zero third-party branding.

- Video 4 (Cheesy Baby Tots) is in a format some phones can't play in-browser — I'll convert it to the universal MP4/H.264 format first so it works everywhere.

### 2. Professionally rewritten recipe content (English, no hashtags)
Each messy TikTok description becomes a clean, complete recipe with: title, age badge, prep/cook time, servings, difficulty, full ingredient list with measurements, numbered step-by-step instructions, nutrition highlights, storage instructions, and a Dr. NutriExpert tip.

1. **Cheesy Carrot Fingers** — 8 months+ · 5 ingredients · bake 17–18 min at 350°F/175°C · perfect for BLW self-feeding
2. **3-Ingredient Peanut Butter Banana Biscuits** — 6 months+ (after allergen exposure) · makes ~55 biscuits · storage: 3 days bench / 1 week fridge / 2 months freezer
3. **Carrot, Potato & Red Lentil Purée with Cumin** — 6 months+ · I reviewed the video and will write the full method: dice potato and carrot, rinse red lentils, simmer all together in water until soft, blend to a smooth golden purée with a pinch of cumin (steps, timings, and texture tips for stage-1 weaning included)
4. **Cheesy Baby Tots (Mini Veggie Tots)** — 6 months+ · 3 ingredients · steam, mash, shape, bake 15 min at 200°C

### 3. Featured "Video Recipes" section — FIRST in the Recipes tab
- A stunning hero section at the very top of the Recipes page: horizontal cards with the video's own frame as the cover (real food, authentic), a gold "VIDEO" badge, age chip, and a glowing play button
- Premium Gold aesthetic matching the app (soft rose / gold gradients, subtle shimmer)

### 4. Full recipe page with native video player
Tapping a card opens the complete recipe page:
- Video at the top with poster cover, play/pause, mute, and a **fullscreen button** (true edge-to-edge fullscreen playback, portrait-optimized)
- Below: the beautifully organized recipe — ingredients with checkboxes, numbered steps, storage info, expert tip
- Same layout language as existing recipe pages so it feels seamless

### 5. Push notification to ALL users (works outside the app)
Sent via the existing push system so users receive it even with the app closed:

> **🎬 Video Recipes Are Here!**
> Hello mamas! We're excited to share that BabyBites now features step-by-step VIDEO recipes — watch, cook, and enjoy with your little one. Tap to see them! 🍲✨

- Tapping the notification deep-links straight to the Video Recipes section in the Recipes tab
- Also recorded as an in-app notification (bell) for anyone who misses the push

## Technical details
- Videos uploaded via Lovable CDN assets (`.asset.json` pointers) — repo stays light, global fast delivery
- New `src/data/videoRecipes.ts` with the 4 structured recipes
- New `VideoRecipeCard` + `VideoRecipeDetail` components; route `/video-recipe/:id`
- Poster images extracted from the best frame of each video
- Notification sent through the existing `notify-all-users` edge function with deep-link URL
- Video 4 transcoded HEVC → H.264 before upload

Ready to build when you approve!