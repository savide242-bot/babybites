
## Goal

Let you, from your phone, open the Admin Panel → upload a recipe video → paste a rough caption → AI cleans it up into a full structured recipe → save → it appears live in the app for all users, without you ever editing code or "deploying" from Lovable.

Plus: your admin account always opens the latest version (preview build), even when other users are still on the old one — via a dedicated admin link.

---

## Part 1 — Admin Video Upload Panel

### New tab in `/admin`: "Video Recipes"
Located next to Dashboard, Users, Notifications, etc. Mobile-friendly form with:

1. **Video file picker** (accepts `.mp4`, `.mov`, `.webm`) — uploads to a new **public** storage bucket `recipe-videos`.
2. **Poster auto-extraction** — first frame extracted server-side and saved to the same bucket.
3. **Rough caption textarea** — you paste whatever (TikTok description, voice-typed notes, etc.).
4. **"✨ Organize with AI" button** — calls a new edge function `organize-video-recipe` (Gemini 2.5 Flash) that returns structured JSON:
   - Title (English, clean)
   - Age group (6m+, 8m+, etc.)
   - Prep / cook time, servings, difficulty
   - Ingredients list
   - Step-by-step instructions
   - Nutrition highlights
   - Storage tips
   - Dr. NutriExpert tip
5. **Editable preview** — you can tweak any AI-generated field before saving.
6. **"Publish video recipe" button** — inserts into a new `video_recipes` table. Instantly visible to all users (no Lovable deploy needed — it's just data).
7. **Notify users toggle** — sends a push notification "🎬 New video recipe: {title}" to everyone.

### List view below the form
Shows all published video recipes with: thumbnail, title, views, **Edit** / **Delete** buttons.

---

## Part 2 — Database

New table `video_recipes` (replaces the hardcoded `src/data/videoRecipes.ts`):
- Title, slug, age group, video_url, poster_url, prep_time, cook_time, servings, difficulty
- Ingredients (jsonb), steps (jsonb), nutrition (jsonb), storage, expert_tip
- published (boolean), views_count, created_by, created_at

RLS: anyone can read published; only admins can insert/update/delete.

The 4 existing hardcoded video recipes get migrated to this table automatically so nothing breaks.

`VideoRecipesSection.tsx` and `VideoRecipeDetail.tsx` switch from importing the static file to fetching from the database.

---

## Part 3 — Admin Always-Latest Preview Link

You already have an `AdminPreviewBanner` that redirects admins from `babybites.lovable.app` to the preview URL. I'll upgrade it:

1. **In the Admin Panel header**, add a permanent button: **"🔄 Open Latest Version"** → opens the Lovable preview URL (`id-preview--...lovable.app`) in a new tab. This URL **always serves the freshest build** — every code change I make is live there within seconds, with no manual deploy.
2. **Force-bypass service worker cache for admins**: when an admin logs in, the service worker `skipWaiting` is triggered immediately, so even on the production domain the admin sees the newest version after one quick reload.
3. **"Latest version" indicator** in the admin header showing the current build hash so you know you're on the newest one.

### Important clarification
On Lovable, "deploy" = clicking Publish here in chat. That publishes frontend code to `babybites.lovable.app`. **Adding video recipes via the admin panel is NOT a deploy** — it's a database write, so it's instant for all users without me publishing anything. You only need a Lovable deploy when the app's *code* changes (new features, UI changes).

So the workflow becomes:
- **New video recipe** → you do it alone from the phone, no Lovable needed ✅
- **New app feature** → still requires me + you clicking Publish

---

## Technical details

**Files to create:**
- `supabase/functions/organize-video-recipe/index.ts` — Gemini caption-to-structured-recipe
- `src/components/admin/VideoRecipeManager.tsx` — upload + AI organize + list UI
- `src/components/admin/VideoUploadForm.tsx` — file picker + progress bar
- Storage bucket `recipe-videos` (public, with admin-only write policy)
- Migration: `video_recipes` table + RLS + seed the 4 existing videos

**Files to modify:**
- `src/pages/Admin.tsx` — add "Videos" tab + "Open Latest Version" button
- `src/components/video-recipes/VideoRecipesSection.tsx` — fetch from DB
- `src/pages/VideoRecipeDetail.tsx` — fetch from DB by slug/id
- `src/hooks/useServiceWorkerUpdate.tsx` — force immediate update for admins
- `src/data/videoRecipes.ts` — kept temporarily as seed source, then deletable

**Upload size note:** Supabase Storage on Lovable Cloud accepts up to ~50 MB per file by default. For videos >20 MB, the form will show a "compress your video first" hint with a link to a free web compressor.

---

## Confirm and I'll build it.
