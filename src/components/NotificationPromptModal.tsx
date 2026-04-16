import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bell, CheckCircle, AlertCircle } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'push_prompt_shown_v5';

export const NotificationPromptModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activating, setActivating] = useState(false);
  const [activationResult, setActivationResult] = useState<'success' | 'error' | null>(null);
  const { subscribe, isSupported, isSubscribed } = usePushNotifications();

  useEffect(() => {
    if (!isSupported) return;
    if (isSubscribed) return; // Already subscribed
    if (localStorage.getItem(STORAGE_KEY) === 'true') return;
    if (typeof Notification !== 'undefined' && Notification.permission === 'denied') return;

    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Check if already has DB subscription
      const { data: existing } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();
      
      if (existing) {
        localStorage.setItem(STORAGE_KEY, 'true');
        return;
      }
      
      setTimeout(() => setIsOpen(true), 2000);
    };
    check();
  }, [isSupported, isSubscribed]);

  const handleActivate = async () => {
    setActivating(true);
    setActivationResult(null);
    
    const success = await subscribe();
    
    if (success) {
      setActivationResult('success');
      localStorage.setItem(STORAGE_KEY, 'true');
      // Auto-close after showing success
      setTimeout(() => setIsOpen(false), 1500);
    } else {
      setActivationResult('error');
    }
    setActivating(false);
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
              {activationResult === 'success' ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : (
                <Bell className="h-8 w-8 text-primary" />
              )}
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            {activationResult === 'success' 
              ? 'Notifications Activated! ✅' 
              : 'Never Miss a Meal Time! 🍽️'}
          </DialogTitle>
          {activationResult !== 'success' && (
            <DialogDescription className="text-center space-y-3 pt-2">
              <p className="text-base">
                Get gentle reminders throughout the day for your baby's meals:
              </p>
              <ul className="text-left space-y-2 text-sm">
                <li>🍳 <strong>Breakfast</strong> — 7:00</li>
                <li>🍎 <strong>Morning Snack</strong> — 10:00</li>
                <li>🥗 <strong>Lunch</strong> — 12:00</li>
                <li>🍌 <strong>Afternoon Snack</strong> — 15:00</li>
                <li>🍽️ <strong>Dinner</strong> — 19:00</li>
              </ul>
            </DialogDescription>
          )}
        </DialogHeader>

        {activationResult === 'error' && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-sm text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>Failed to activate. Please try again.</span>
          </div>
        )}

        {activationResult !== 'success' && (
          <div className="flex flex-col gap-3 mt-4">
            <Button 
              onClick={handleActivate} 
              size="lg" 
              className="w-full text-base font-semibold"
              disabled={activating}
            >
              {activating ? (
                <>Activating...</>
              ) : (
                <>
                  <Bell className="mr-2 h-5 w-5" />
                  Activate Reminders
                </>
              )}
            </Button>
            <Button onClick={handleDismiss} variant="outline" size="lg" className="w-full">
              Maybe Later
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
