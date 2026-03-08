import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'push_notifications_activated';

export const NotificationPromptModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { subscribeToPushNotifications, isSupported } = usePushNotifications();

  useEffect(() => {
    const checkShouldPrompt = async () => {
      if (!isSupported) return;

      // If already activated and stored locally, never show again
      const activated = localStorage.getItem(STORAGE_KEY);
      if (activated === 'true') return;

      // Also check if browser permission is already granted (activated on another session)
      if (Notification.permission === 'granted') {
        localStorage.setItem(STORAGE_KEY, 'true');
        return;
      }

      // If permission was denied by the browser, don't show (can't do anything)
      if (Notification.permission === 'denied') return;

      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Show the prompt after a short delay
      setTimeout(() => setIsOpen(true), 1500);
    };

    checkShouldPrompt();
  }, [isSupported]);

  const handleActivate = async () => {
    setIsOpen(false);
    const success = await subscribeToPushNotifications();
    
    if (success) {
      // Permanently mark as activated - never show again
      localStorage.setItem(STORAGE_KEY, 'true');
    }
  };

  const handleMaybeLater = () => {
    // Just close - will show again next time they open the app
    setIsOpen(false);
  };

  if (!isSupported) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
            className="w-full text-base font-semibold"
          >
            <Bell className="mr-2 h-5 w-5" />
            Activate Reminders
          </Button>
          <Button 
            onClick={handleMaybeLater}
            variant="outline"
            size="lg"
            className="w-full"
          >
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
