# BabyBites PWA Auto-Update System

## Overview
Complete auto-update system that automatically updates the PWA when new versions are deployed without user intervention.

## Features Implemented

### 1. Service Worker Auto-Update
- **skipWaiting**: Immediately activates new service worker
- **clientsClaim**: Takes control of all pages immediately
- **cleanupOutdatedCaches**: Automatically removes old caches
- **Auto-refresh detection**: Checks for updates every 60 seconds

### 2. Client-Side Auto-Update
- Detects new service worker versions automatically
- Shows toast notification: "Update Available! Updating now..."
- Auto-reloads the app after 2 seconds
- No user interaction required

### 3. Push Notifications (Optional)
- Web Push API integration
- VAPID keys for secure push
- Database storage of subscriptions
- Broadcast updates to all users

## Files Modified

### Core Files
- `vite.config.ts` - PWA configuration with auto-update settings
- `src/App.tsx` - Integrated auto-update hook
- `src/hooks/useServiceWorkerUpdate.tsx` - Auto-update detection and reload
- `src/hooks/usePushNotifications.tsx` - Push notification subscription management
- `supabase/functions/notify-update/index.ts` - Edge function to send push notifications

## How It Works

### Automatic Update Flow
1. User opens the PWA
2. Service worker checks for updates every 60 seconds
3. When new version detected:
   - Toast notification appears: "Update Available! Updating now..."
   - After 2 seconds, app automatically reloads
   - New version is active immediately
4. Old caches are cleaned automatically

### Version Detection
- Vite automatically generates hashed filenames: `app-abc123.js`
- When you rebuild, new hash is created: `app-xyz789.js`
- Service worker detects the difference and triggers update

## Testing the Auto-Update System

### Local Testing (Development)
1. **First Load**:
   ```bash
   npm run dev
   ```
   Open browser at `http://localhost:8080`

2. **Simulate Update**:
   - Make a small change to any component (e.g., change text)
   - Save the file
   - Wait 60 seconds OR refresh the page
   - You should see: "Update Available! Updating now..."
   - App auto-reloads with new version

### Production Testing
1. **Deploy Version 1**:
   ```bash
   npm run build
   # Deploy to your hosting
   ```

2. **Make Changes**:
   - Change some text or add a feature
   - Build again: `npm run build`

3. **Deploy Version 2**:
   - Upload new build to hosting
   - Users with open PWA will see update notification within 60 seconds
   - App auto-updates without reinstalling

### Testing Push Notifications (Advanced)

#### Step 1: Generate VAPID Keys
You need the `web-push` library to generate keys:

```bash
npm install -g web-push
web-push generate-vapid-keys
```

This outputs:
```
Public Key: BPxQl0dVhOp...
Private Key: yS8bT9eDd...
```

#### Step 2: Add Keys to Supabase
In Lovable/Supabase, add these secrets:
- `VAPID_PUBLIC_KEY` = Your public key
- `VAPID_PRIVATE_KEY` = Your private key

#### Step 3: Update Client Code
In `src/hooks/usePushNotifications.tsx`, replace:
```typescript
const VAPID_PUBLIC_KEY = 'BPxQl0dVhOpGx9aK-generated-vapid-key-placeholder';
```
with your actual public key.

#### Step 4: Create Push Subscriptions Table

Run this migration in Supabase:

```sql
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  keys TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own subscriptions"
ON push_subscriptions
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

#### Step 5: Subscribe Users
Add this to your Settings page:

```typescript
import { usePushNotifications } from '@/hooks/usePushNotifications';

function Settings() {
  const { subscribeToPushNotifications, subscription } = usePushNotifications();

  return (
    <button onClick={subscribeToPushNotifications}>
      {subscription ? 'Push Enabled ✅' : 'Enable Push Notifications'}
    </button>
  );
}
```

#### Step 6: Send Update Notification
When you deploy a new version:

```bash
# Call the edge function
curl -X POST https://your-project.supabase.co/functions/v1/notify-update \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY"
```

All subscribed users receive: "🎉 BabyBites Updated! New features and improvements are now available."

## Verification Checklist

✅ **Service Worker Installed**
- Open DevTools → Application → Service Workers
- Should see service worker registered

✅ **Auto-Update Working**
- Make a change, rebuild
- Wait 60 seconds or refresh
- Should see update toast and auto-reload

✅ **Caches Cleaned**
- Open DevTools → Application → Cache Storage
- After update, only latest cache version remains

✅ **No Manual Reinstall Needed**
- Users NEVER need to uninstall/reinstall
- Updates happen automatically in background

## Troubleshooting

### Update Not Detected
- Check browser DevTools → Application → Service Workers → "Update on reload" is OFF
- Ensure 60 seconds have passed
- Hard refresh (Ctrl+Shift+R) forces check

### Old Version Stuck
- Implemented `skipWaiting()` and `clientsClaim()` prevent this
- If stuck, clear all site data and reload once

### Push Notifications Not Working
- Verify VAPID keys are correct
- Check notification permission is granted
- Ensure HTTPS (required for push)
- Check push_subscriptions table has entries

## Deployment Workflow

### Every Time You Deploy:

1. **Make Your Changes**
   ```bash
   # Edit code
   npm run build
   ```

2. **Deploy New Version**
   ```bash
   # Upload to hosting
   git push
   ```

3. **Notify Users (Optional)**
   ```bash
   # Send push notification to all users
   curl -X POST https://your-project.supabase.co/functions/v1/notify-update \
     -H "Authorization: Bearer YOUR_KEY"
   ```

4. **Automatic Update**
   - Within 60 seconds, all active users see update notification
   - App auto-reloads with new version
   - No user action required

## Key Benefits

✅ **Zero User Friction**: Users never uninstall/reinstall  
✅ **Instant Updates**: New features go live within 60 seconds  
✅ **Automatic Cleanup**: Old caches deleted automatically  
✅ **Reliable**: skipWaiting + clientsClaim ensure updates always work  
✅ **Professional**: Like native apps (WhatsApp, Instagram, etc.)  

## Version Control

Vite automatically versions your files:
- `app-v1abc123.js` → `app-v2xyz789.js`
- Service worker detects the hash change
- Triggers automatic update

No manual version management needed!

## Support

If auto-update not working:
1. Check service worker is registered (DevTools)
2. Verify 60 seconds have passed since last check
3. Ensure `skipWaiting: true` in vite.config.ts
4. Check browser console for errors

The system is now production-ready and will handle all updates automatically! 🚀
