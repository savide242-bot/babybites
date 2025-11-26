import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

const STORAGE_KEY = 'notification_prompt_dismissed';
const REPROMPT_DAYS = 3;

export const NotificationPromptModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { subscribeToPushNotifications, isSupported } = usePushNotifications();

  useEffect(() => {
    // Check if we should show the prompt
    const checkShouldPrompt = async () => {
      if (!isSupported) return;

      // Check browser notification permission
      if (Notification.permission === 'granted' || Notification.permission === 'denied') {
        return; // Already decided
      }

      // Check if user dismissed recently
      const dismissedData = localStorage.getItem(STORAGE_KEY);
      if (dismissedData) {
        const { timestamp } = JSON.parse(dismissedData);
        const daysSince = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
        if (daysSince < REPROMPT_DAYS) {
          return; // Too soon to ask again
        }
      }

      // Show the prompt after a short delay
      setTimeout(() => setIsOpen(true), 2000);
    };

    checkShouldPrompt();
  }, [isSupported]);

  const handleActivate = async () => {
    setIsOpen(false);
    const success = await subscribeToPushNotifications();
    
    if (success) {
      // Mark as permanently handled
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
        timestamp: Date.now(),
        activated: true 
      }));
    }
  };

  const handleMaybeLater = () => {
    setIsOpen(false);
    // Store timestamp for re-prompting later
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
      timestamp: Date.now(),
      activated: false 
    }));
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
              <li>🍳 <strong>Breakfast</strong> at 7:30 AM</li>
              <li>🍎 <strong>Morning Snack</strong> at 10:00 AM</li>
              <li>🥗 <strong>Lunch</strong> at 12:30 PM</li>
              <li>🍌 <strong>Afternoon Snack</strong> at 3:30 PM</li>
              <li>🍽️ <strong>Dinner</strong> at 6:00 PM</li>
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
