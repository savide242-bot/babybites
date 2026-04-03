import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bell, Loader2 } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { supabase } from '@/integrations/supabase/client';

const VAPID_VERSION = 'v2';
const STORAGE_KEY = `push_notifications_activated_${VAPID_VERSION}`;
const MASTER_TIMEOUT_MS = 25000;

export const NotificationPromptModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const { subscribeToPushNotifications, isSupported } = usePushNotifications();

  useEffect(() => {
    const checkShouldPrompt = async () => {
      if (!isSupported) return;

      const activated = localStorage.getItem(STORAGE_KEY);
      if (activated === 'true') return;

      if (Notification.permission === 'granted') {
        const success = await subscribeToPushNotifications();
        if (success) {
          localStorage.setItem(STORAGE_KEY, 'true');
        }
        return;
      }

      if (Notification.permission === 'denied') return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setTimeout(() => setIsOpen(true), 1500);
    };

    checkShouldPrompt();
  }, [isSupported]);

  const handleActivate = async () => {
    setIsActivating(true);

    // Master timeout: force-close after 25s if subscription hangs
    const timeout = setTimeout(() => {
      setIsActivating(false);
      setIsOpen(false);
    }, MASTER_TIMEOUT_MS);

    try {
      const success = await subscribeToPushNotifications();
      if (success) {
        localStorage.setItem(STORAGE_KEY, 'true');
      }
    } finally {
      clearTimeout(timeout);
      setIsActivating(false);
      setIsOpen(false);
    }
  };

  const handleMaybeLater = () => {
    setIsOpen(false);
  };

  if (!isSupported) return null;

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
          <Button 
            onClick={handleActivate} 
            size="lg"
            disabled={isActivating}
            className="w-full text-base font-semibold"
          >
            {isActivating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Activating...
              </>
            ) : (
              <>
                <Bell className="mr-2 h-5 w-5" />
                Activate Reminders
              </>
            )}
          </Button>
          <Button 
            onClick={handleMaybeLater}
            variant="outline"
            size="lg"
            disabled={isActivating}
            className="w-full"
          >
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
