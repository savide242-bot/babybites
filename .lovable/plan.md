

# Plan: 3 Fixes - Admin Popup, Push Notifications, Premium eBook PDF

## 1. Admin Preview: Replace Auto-Redirect with Dismissible Popup

**Problem**: The current code at `useAdminPreviewRedirect.ts` line 54-57 does `window.location.href = previewUrl` which creates an infinite redirect loop — the admin gets forced to preview and can never stay on production.

**Solution**: 
- Change `useAdminPreviewRedirect.ts` to show a **dismissible banner** instead of auto-redirecting
- Update `AdminPreviewBanner.tsx` to show a floating popup with "View Latest Version" and "Dismiss" buttons
- Store dismissal in `sessionStorage` so it only shows once per session (reappears when they reopen the app)
- Remove the `window.location.href` auto-redirect entirely

## 2. Push Notifications: Fix Subscription Flow

**Problem**: Only 3 out of 44 users have push subscriptions. The subscription process likely fails silently on mobile browsers.

**Root Causes Identified**:
- `applicationServerKey: applicationServerKey.buffer as ArrayBuffer` — the `.buffer` property on a `Uint8Array` can return a shared `ArrayBuffer` that includes extra bytes if the array is a view of a larger buffer. This breaks `pushManager.subscribe()` on some mobile browsers
- The `NotificationPromptModal` closes before `subscribeToPushNotifications()` completes (`setIsOpen(false)` is called first on line 50), which can cause the permission prompt to fail since it's no longer triggered from a user gesture context
- `endpoint UNIQUE` constraint in the DB can cause insert failures if a user re-subscribes from the same device

**Fixes**:
- Fix `applicationServerKey` to use a proper copy: `new Uint8Array(applicationServerKey).buffer` or just pass the `Uint8Array` directly (modern browsers accept it)
- In `NotificationPromptModal`, keep the modal open during subscription, close only after success/failure
- Add better error recovery: if insert fails due to unique constraint on endpoint, delete-then-insert
- Add a `try/catch` wrapper with user-visible toast feedback for every failure point

## 3. Recipe eBook PDF: Complete Visual Redesign

**Problem**: The current PDF uses system fonts (`Segoe UI`), tiny font sizes (9-10px), cramped spacing, and looks like a data dump rather than a premium cookbook.

**Solution — Premium Magazine Redesign**:
- **Google Fonts**: Import `Playfair Display` (serif, for titles) + `Inter` (body text) via `<link>` in the generated HTML
- **Cover Page**: Larger title (56px), elegant serif font, refined gradient, more whitespace
- **Recipe Pages**: 
  - Larger hero image (260px height)
  - Title in serif font at 22px, description at 13px
  - Ingredients section with clean bullet list (12px), not cramped 2-column
  - Instructions with larger step numbers and 12px text
  - Nutrition card redesigned as a clean horizontal bar
  - More padding (36px sides, 28px top)
- **Typography hierarchy**: Titles 22px serif, section headers 13px bold sans, body 12px, min 11px anywhere
- **Page structure**: Keep `max-height: 100vh` + `overflow: hidden` but with better space utilization
- **Age Group Dividers**: Larger, more dramatic with serif fonts
- **Print CSS**: Ensure `@import` Google Fonts works in print, proper `@page` margins

## 4. Fix Build Errors

**Problem**: `NodeJS.Timeout` type not found in `BarcodeScanner.tsx:83` and `RecipeDetail.tsx:45`.

**Fix**: Replace `NodeJS.Timeout` with `ReturnType<typeof setTimeout>` in both files.

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useAdminPreviewRedirect.ts` | Remove auto-redirect, set `showBanner: true` for admins on production |
| `src/components/AdminPreviewBanner.tsx` | Add sessionStorage dismissal, make it a proper popup |
| `src/hooks/usePushNotifications.tsx` | Fix `applicationServerKey` buffer issue, improve error handling |
| `src/components/NotificationPromptModal.tsx` | Keep modal open during subscription, add loading state |
| `src/utils/recipeEbookExport.ts` | Complete visual redesign with Google Fonts and premium layout |
| `src/pages/RecipeDetail.tsx` | Fix `NodeJS.Timeout` type |
| `src/pages/BarcodeScanner.tsx` | Fix `NodeJS.Timeout` type |

