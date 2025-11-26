import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface WelcomeModalProps {
  userId: string;
  userName: string;
}

const WelcomeModal = ({ userId, userName }: WelcomeModalProps) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { isSupported, subscribeToPushNotifications } = usePushNotifications();

  useEffect(() => {
    const checkFirstLogin = async () => {
      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('has_seen_welcome')
        .eq('user_id', userId)
        .single();

      if (!prefs?.has_seen_welcome) {
        setOpen(true);
        await supabase
          .from('user_preferences')
          .upsert({ 
            user_id: userId, 
            has_seen_welcome: true,
            language: 'en' 
          }, { 
            onConflict: 'user_id' 
          });
      }
    };

    checkFirstLogin();
  }, [userId]);

  const handleClose = () => {
    setOpen(false);
    navigate("/recipes");
  };

  const handleActivateReminders = async () => {
    if (isSupported) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await subscribeToPushNotifications();
      }
    }
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-primary/5 via-mint/5 to-background border-border/50">
        <div className="flex flex-col items-center text-center space-y-4 py-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-mint flex items-center justify-center animate-bounce-soft">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary via-mint to-primary bg-clip-text text-transparent">
              Welcome to BabyBites, {userName}! 💕
            </h2>
            <p className="text-muted-foreground">
              We're so excited to have you here! Let's start your baby's nutrition journey.
            </p>
          </div>

          <div className="bg-mint/10 rounded-lg p-4 space-y-2 w-full text-left">
            <p className="font-semibold text-sm">🍎 Quick Start Tips:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Explore 200+ nutritious recipes</li>
              <li>• Plan your weekly meals</li>
              <li>• Track your baby's growth</li>
              <li>• Chat with Bibi AI for instant help</li>
              <li>• Connect with 10,000+ moms</li>
            </ul>
          </div>

          {isSupported && (
            <Button
              onClick={handleActivateReminders}
              size="lg"
              variant="outline"
              className="w-full border-mint text-mint hover:bg-mint/10 gap-2"
            >
              <Bell className="w-4 h-4" />
              🔔 Activate Meal Reminders
            </Button>
          )}

          <Button
            onClick={handleClose}
            size="lg"
            className="w-full bg-gradient-to-r from-mint to-primary hover:from-mint-glow hover:to-primary-glow text-white"
          >
            🎉 Start Exploring
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;
