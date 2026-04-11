import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bell, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { supabase } from '@/integrations/supabase/client';

const VAPID_VERSION = 'v2';
const STORAGE_KEY = `push_notifications_activated_${VAPID_VERSION}`;

const STEP_LABELS: Record<string, string> = {
  requesting_permission: 'Requesting permission...',
  subscribing: 'Setting up notifications...',
  saving: 'Saving preferences...',
};

export const NotificationPromptModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const { subscribeToPushNotifications, isSupported, pushState, lastError } = usePushNotifications();
  const isActivating = pushState === 'requesting_permission' || pushState === 'subscribing' || pushState === 'saving';

  useEffect(() => {
    const checkShouldPrompt = async () => {
      if (!isSupported) return;
      if (localStorage.getItem(STORAGE_KEY) === 'true') return;
      if (Notification.permission === 'granted') {
        localStorage.setItem(STORAGE_KEY, 'true');
        return;
      }
      if (Notification.permission === 'denied') return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setTimeout(() => setIsOpen(true), 2000);
    };
    checkShouldPrompt();
  }, [isSupported]);

  useEffect(() => {
    if (pushState === 'error') setFailed(true);
    else if (pushState === 'ready') setFailed(false);
  }, [pushState]);

  const handleActivate = async () => {
    setFailed(false);
    const success = await subscribeToPushNotifications();
    if (success) {
      localStorage.setItem(STORAGE_KEY, 'true');
      setIsOpen(false);
    } else {
      setFailed(true);
    }
  };

  if (!isSupported) return null;

  const stepLabel = STEP_LABELS[pushState] || '';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!isActivating) setIsOpen(open); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Bell className="h-16 w-16 text-primary animate-pulse" />
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            Never Miss a Meal Time! 🍽️
          </DialogTitle>
          <DialogDescription className="text-center space-y-3 pt-2">
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
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-4">
          {isActivating && stepLabel && (
            <p className="text-center text-sm text-muted-foreground animate-pulse">{stepLabel}</p>
          )}

          {failed && !isActivating && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>
                {lastError === 'permission_denied'
                  ? 'Permission denied. Enable notifications in your browser settings.'
                  : lastError === 'sw_not_ready'
                  ? 'Service not ready. Refresh the page and try again.'
                  : 'Something went wrong. Please try again.'}
              </span>
            </div>
          )}

          {failed && !isActivating ? (
            <Button onClick={handleActivate} size="lg" className="w-full text-base font-semibold gap-2">
              <RefreshCw className="h-5 w-5" />
              Try Again
            </Button>
          ) : (
            <Button onClick={handleActivate} size="lg" disabled={isActivating} className="w-full text-base font-semibold">
              {isActivating ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" />{stepLabel || 'Activating...'}</>
              ) : (
                <><Bell className="mr-2 h-5 w-5" />Activate Reminders</>
              )}
            </Button>
          )}

          <Button onClick={() => setIsOpen(false)} variant="outline" size="lg" disabled={isActivating} className="w-full">
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
