import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { supabase } from '@/integrations/supabase/client';

const VAPID_VERSION = 'v3';
const STORAGE_KEY = `push_activated_${VAPID_VERSION}`;

export const NotificationPromptModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { subscribeToPushNotifications, isSupported } = usePushNotifications();

  // Show modal once after 2s if not yet activated
  useEffect(() => {
    if (!isSupported) return;
    if (localStorage.getItem(STORAGE_KEY) === 'true') return;
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      localStorage.setItem(STORAGE_KEY, 'true');
      return;
    }
    if (typeof Notification !== 'undefined' && Notification.permission === 'denied') return;

    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setTimeout(() => setIsOpen(true), 2000);
    };
    check();
  }, [isSupported]);

  const handleActivate = async () => {
    // Close modal immediately — no spinners, no waiting
    setIsOpen(false);

    // Everything happens silently in the background
    const ok = await subscribeToPushNotifications();
    if (ok) {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    // If it fails or user denies — nothing happens, modal is already closed
  };

  const handleDismiss = () => {
    setIsOpen(false);
  };

  if (!isSupported) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Bell className="h-8 w-8 text-primary" />
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
          <Button onClick={handleActivate} size="lg" className="w-full text-base font-semibold">
            <Bell className="mr-2 h-5 w-5" />
            Activate Reminders
          </Button>
          <Button onClick={handleDismiss} variant="outline" size="lg" className="w-full">
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
