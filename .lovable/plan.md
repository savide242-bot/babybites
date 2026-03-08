

# Plan: Fix Push Notifications (Root Cause) + Implement Advice PDF Export

## 1. Push Notification Root Cause (The REAL Bug)

I just sent another test and Apple returned **201 Created** again -- meaning Apple accepted the message. But you never receive it. After deep analysis, the real bugs are:

### Bug A: iOS requires NO `vibrate` property
The service worker (`sw-listener.js` line 142) sets `vibrate: [200, 100, 200]`. **iOS Safari does not support the vibrate API** and including it in `showNotification()` options causes iOS to silently reject the notification. This is the primary reason notifications never appear on your iPhone.

### Bug B: `requireInteraction: true` fails on iOS  
Line 140 sets `requireInteraction: true` by default. iOS Safari PWA does not support this property and it can cause silent failures on some iOS versions.

### Bug C: `renotify: true` without unique tags
Line 144 sets `renotify: true` but the tag is `test-notification` (static). iOS may collapse/drop repeated notifications with the same tag and renotify flag.

### Fix
In `public/sw-listener.js`, detect iOS and build options conditionally:
- Remove `vibrate` on iOS (not supported)
- Set `requireInteraction: false` on iOS
- Remove `renotify` on iOS
- Generate unique tags per notification

### Files to modify
- `public/sw-listener.js` -- iOS-safe notification options

## 2. Advice Page: Expanded Content + PDF Export

### Content Expansion
Rewrite all 31 articles in `src/pages/Advice.tsx` to have 8-12 detailed paragraphs each instead of 5 short bullets. Each paragraph will be a substantial explanation with practical tips and evidence-based guidance.

### PDF Export Feature
Create `src/utils/advicePDFExport.ts` using `html2pdf.js` (already installed):
- Branded cover page with BabyBites logo, title, date
- Table of contents listing all articles by category
- Each article as a full styled section with category badge, icon representation, title, and all content paragraphs
- Professional footer on each page
- Downloads as `BabyBites-Knowledge-Hub.pdf`

Add an "Export All as PDF" button in the Advice page hero section.

### Files to create/modify
- `src/pages/Advice.tsx` -- expand all article content + add export button
- `src/utils/advicePDFExport.ts` -- new file for multi-article PDF generation

## Implementation Order
1. Fix `sw-listener.js` for iOS compatibility (blocking -- notifications)
2. Expand Advice article content (31 articles x 8-12 paragraphs)
3. Create `advicePDFExport.ts` utility
4. Add export button to Advice page
5. Re-send test notification to verify fix

