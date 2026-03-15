

# Plan: Fix Notifications, Clean Ghost Data, Improve AI & Recipe Guidance

## Root Cause Analysis

### 1. Ghost Users in Admin (219 sessions, 37 profiles)
The `user_sessions` table has 219 rows (44 unique user_ids) while `profiles` only has 37. The admin `UserManagement` fetches profiles and merges with sessions, but the filter on line 112 (`full_name !== 'User' || has_session`) lets through ghost entries. The Dashboard stats query may also count `user_sessions` rows instead of unique users.

**Fix**: Filter admin user list to only show profiles that actually exist. Clean orphan session rows.

### 2. Notifications NEVER Work — 403 VAPID Mismatch
The edge function logs show the exact error:
```
403 the VAPID credentials in the authorization header do not correspond 
to the credentials used to create the subscriptions.
```
All 3 existing push subscriptions were created with OLD VAPID keys. The server now sends with NEW VAPID keys → FCM/Apple returns 403.

**Critical bug**: The cleanup code in `_shared/webpush.ts` line 328 only catches `410`, `404`, `400+VapidPkHashMismatch`, `401+unsubscribed` — it does NOT catch **403**. So stale subscriptions are never deleted, and notifications permanently fail.

**Also**: `test-push-notification/index.ts` has its own 300-line copy of the webpush code (not using `_shared/webpush.ts`) with the same missing 403 handling.

**Fix**:
- Add `403` to the expired detection in `_shared/webpush.ts`
- Rewrite `test-push-notification` to use `_shared/webpush.ts` (delete 290 lines of duplicated code)
- Delete the 3 stale subscriptions now (DB cleanup migration)
- Auto-resubscribe users who have granted permission but have no valid subscription

### 3. AI Chatbot Feels Robotic
The system prompt says "200 recipes" (it's 340+), doesn't load the user's baby age/name from the database, and uses `gemini-2.5-flash` which is the cheaper/faster model.

**Fix**: 
- Fetch baby profile data before calling AI, inject into system prompt
- Update recipe count to 340+
- Upgrade model to `google/gemini-2.5-pro` for more nuanced, natural responses
- Add specific nutritional expertise instructions for starting solids at 6 months

### 4. Recipe Page — Users Feel Alone
Users requesting refunds because they feel unsupported. The recipe page is a grid of cards with no guidance.

**Fix**: Add a **"Starting Solids Guide"** banner for babies 6-8 months, and a **"Recommended for You"** section that shows age-appropriate recipes with nutritional context. Add a prominent link to the AI assistant (Bibi) with contextual prompts like "Ask Bibi what to cook today".

### 5. Fallbacks
- Edge functions: wrap all push sends in try/catch with graceful degradation
- Frontend: if notification subscription fails, show clear instructions instead of silent failure

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/_shared/webpush.ts` | Add 403 to expired detection (line 328) |
| `supabase/functions/test-push-notification/index.ts` | Rewrite: delete local webpush copy, import from `_shared/webpush.ts`, use `NotificationPayload` |
| `supabase/functions/check-meal-reminders/index.ts` | Add 403 handling for stale subs |
| `supabase/functions/bibi-chat/index.ts` | Fetch user profile, inject baby age into prompt, upgrade model, update recipe count |
| `src/components/admin/UserManagement.tsx` | Filter to real profiles only, show accurate count |
| `src/pages/Recipes.tsx` | Add "Starting Solids Guide" banner + "Ask Bibi" CTA + "Recommended for You" section |
| DB migration | Delete 3 stale push subscriptions, clean orphan user_sessions |

## Implementation Order
1. Fix `_shared/webpush.ts` (403 detection) — unblocks ALL notifications
2. Rewrite `test-push-notification` to use shared module
3. DB migration: clean stale subscriptions + orphan sessions
4. Fix admin user count
5. Upgrade AI chatbot (profile-aware + better model)
6. Add recipe page guidance sections

