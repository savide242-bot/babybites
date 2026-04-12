import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bell, Loader2, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { usePushNotifications, type PushError } from '@/hooks/usePushNotifications';
import { supabase } from '@/integrations/supabase/client';

const VAPID_VERSION = 'v3';
const STORAGE_KEY = `push_activated_${VAPID_VERSION}`;

/** Human-readable error messages */
const ERROR_MSG: Record<PushError, string> = {
  unsupported: 'Your browser does not support push notifications.',
  preview_blocked: 'Notifications only work on the published app (babybites.lovable.app). Open it there to activate.',
  permission_denied: 'Permission denied. Open your browser settings and allow notifications for this site.',
  sw_failed: 'Could not prepare the notification service. Refresh the page and try again.',
  vapid_failed: 'Could not reach the server. Check your internet and try again.',
  subscribe_failed: 'Browser refused the subscription. Refresh and try again.',
  save_failed: 'Could not save to the server. Try again in a moment.',
  timeout: 'The request took too long. Check your connection and try again.',
  no_user: 'You need to be logged in to activate notifications.',
  unknown: 'Something unexpected happened. Please try again.',
};

export const NotificationPromptModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { subscribeToPushNotifications, isSupported, pushState, lastError } = usePushNotifications();

  const isWorking = pushState === 'working';
  const isError = pushState === 'error';
  const isDone = pushState === 'ready';

  // Show modal after 2s if user hasn't activated yet
  useEffect(() => {
    if (!isSupported) return;
    if (localStorage.getItem(STORAGE_KEY) === 'true') return;
    if (Notification.permission === 'granted') {
      localStorage.setItem(STORAGE_KEY, 'true');
      return;
    }
    if (Notification.permission === 'denied') return;

    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setTimeout(() => setIsOpen(true), 2000);
    };
    check();
  }, [isSupported]);

  const handleActivate = async () => {
    const ok = await subscribeToPushNotifications();
    if (ok) {
      localStorage.setItem(STORAGE_KEY, 'true');
      // Brief success state, then close
      setTimeout(() => setIsOpen(false), 1200);
    }
  };

  if (!isSupported) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!isWorking) setIsOpen(open); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="relative">
              {isDone ? (
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              ) : (
                <>
                  <Bell className="h-16 w-16 text-primary animate-pulse" />
                  <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                </>
              )}
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            {isDone ? 'Notifications Activated! ✅' : 'Never Miss a Meal Time! 🍽️'}
          </DialogTitle>
          <DialogDescription className="text-center space-y-3 pt-2">
            {isDone ? (
              <p className="text-base text-green-600 font-medium">
                You'll receive meal reminders even when the app is closed.
              </p>
            ) : (
              <>
                <p className="text-base">
                  Get gentle reminders throughout the day for your baby's meals:
                </p>
                <ul className="text-left space-y-2 text-sm">
                  <li>🍳 <strong>Breakfast</strong> at 8:00 AM</li>
                  <li>🥗 <strong>Lunch</strong> at 12:30 PM</li>
                  <li>🍌 <strong>Snack</strong> at 4:00 PM</li>
                  <li>🍽️ <strong>Dinner</strong> at 7:00 PM</li>
                </ul>
                <p className="text-sm text-muted-foreground">
                  You can customize these times in Settings anytime!
                </p>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-4">
          {/* Error banner */}
          {isError && lastError && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{ERROR_MSG[lastError]}</span>
            </div>
          )}

          {/* Buttons */}
          {isDone ? (
            <Button onClick={() => setIsOpen(false)} size="lg" className="w-full text-base font-semibold">
              Great, let's go! 🎉
            </Button>
          ) : isError ? (
            <Button onClick={handleActivate} size="lg" className="w-full text-base font-semibold gap-2">
              <RefreshCw className="h-5 w-5" />
              Try Again
            </Button>
          ) : (
            <Button onClick={handleActivate} size="lg" disabled={isWorking} className="w-full text-base font-semibold">
              {isWorking ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Activating...</>
              ) : (
                <><Bell className="mr-2 h-5 w-5" />Activate Reminders</>
              )}
            </Button>
          )}

          {!isDone && (
            <Button onClick={() => setIsOpen(false)} variant="outline" size="lg" disabled={isWorking} className="w-full">
              Maybe Later
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
