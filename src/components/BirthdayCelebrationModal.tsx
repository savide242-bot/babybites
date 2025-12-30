import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import confetti from "canvas-confetti";
import { Cake, Gift, Heart, Share2, Sparkles, X } from "lucide-react";
import ShareAchievementModal from "./ShareAchievementModal";

interface BirthdayNotification {
  id: string;
  baby_age_months: number;
  insight_text: string | null;
  seen: boolean;
}

// Development insights by age
const getDevelopmentInsights = (months: number): string => {
  const insights: { [key: number]: string } = {
    1: "At 1 month, your baby starts focusing on objects 20-30cm away and recognizes mom's voice. This is a phase of lots of sleep and rapid growth!",
    2: "At 2 months, your baby smiles socially and starts following objects with their eyes. They may start making cooing sounds!",
    3: "At 3 months, your baby holds their head up better and loves looking at their own hands. Muscles are getting stronger!",
    4: "At 4 months, many babies start rolling and laughing out loud. Hand-eye coordination is developing rapidly!",
    5: "At 5 months, your baby may start sitting with support and shows interest in toys. Their personality is starting to show!",
    6: "🎉 6 months! Important milestone! Your baby can start solid foods. They're sitting up alone and showing interest in food. Time to try purees!",
    7: "At 7 months, your baby may start crawling and loves exploring textures. Great time to vary purees and introduce new flavors!",
    8: "At 8 months, many babies crawl well and start picking up objects with the pincer grasp. Can try more textured foods!",
    9: "At 9 months, your baby may start standing with support. Diet can include small soft pieces. Palate is diversifying!",
    10: "At 10 months, your baby loves imitating sounds and gestures. Can eat many family foods, adapted in texture!",
    11: "At 11 months, your baby may take first steps with support. Diet is increasingly varied and independent!",
    12: "🎂 1 YEAR! Happy Birthday! Your baby can eat most family foods. Many say 'mama' and 'dada' and take first solo steps!",
    13: "At 13 months, walking is developing and vocabulary is starting to expand. Feeding can become increasingly autonomous!",
    14: "At 14 months, your baby loves exploring and already has defined food preferences. Continue offering variety!",
    15: "At 15 months, your child communicates better and can help feed themselves. This is a phase of great independence!",
    16: "At 16 months, your child loves imitating adults. Eating together as a family is a great way to teach good habits!",
    17: "At 17 months, your child runs and climbs stairs. They need lots of energy - nutritious meals are essential!",
    18: "At 18 months, your child has a vocabulary of 10-20 words and eats more independently. Continue offering balanced meals!",
    24: "🎂 2 YEARS! Your child speaks short sentences and eats practically everything! It's important to maintain healthy eating routines!",
    36: "🎂 3 YEARS! Your child is very independent and has strong opinions about food. Continue being a model of healthy eating!",
  };

  // Find the closest insight
  if (insights[months]) return insights[months];
  
  // For unmapped ages, generate generic text
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  
  if (years >= 1) {
    return `At ${years} year${years > 1 ? 's' : ''} ${remainingMonths > 0 ? `and ${remainingMonths} months` : ''}, your child continues to develop rapidly! Continue offering a varied and nutritious diet to support healthy growth.`;
  }
  
  return `At ${months} months, your baby is in a phase of great development! Continue accompanying their growth with love and attention to nutrition.`;
};

const BirthdayCelebrationModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notification, setNotification] = useState<BirthdayNotification | null>(null);
  const [babyName, setBabyName] = useState<string>("");
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    checkBirthdayNotification();
  }, []);

  const checkBirthdayNotification = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Fetch unseen notification
      const { data: notifications } = await supabase
        .from('baby_birthday_notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('seen', false)
        .order('sent_at', { ascending: false })
        .limit(1);

      if (notifications && notifications.length > 0) {
        setNotification(notifications[0]);
        
        // Fetch baby name
        const { data: profile } = await supabase
          .from('profiles')
          .select('baby_name')
          .eq('id', session.user.id)
          .single();
        
        if (profile?.baby_name) {
          setBabyName(profile.baby_name);
        }

        setIsOpen(true);
        
        // Confetti!
        setTimeout(() => {
          confetti({
            particleCount: 200,
            spread: 100,
            origin: { y: 0.4 },
            colors: ['#FF6B9D', '#C084FC', '#60A5FA', '#34D399', '#FBBF24']
          });
        }, 300);
      }
    } catch (error) {
      console.error('Error checking birthday notification:', error);
    }
  };

  const handleClose = async () => {
    if (notification) {
      // Mark as seen
      await supabase
        .from('baby_birthday_notifications')
        .update({ seen: true })
        .eq('id', notification.id);
    }
    setIsOpen(false);
  };

  const formatAge = (months: number) => {
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (years === 0) {
      return `${months} ${months === 1 ? 'month' : 'months'}`;
    }
    if (remainingMonths === 0) {
      return `${years} ${years === 1 ? 'year' : 'years'}`;
    }
    return `${years} ${years === 1 ? 'year' : 'years'} and ${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`;
  };

  if (!notification) return null;

  const ageText = formatAge(notification.baby_age_months);
  const insight = notification.insight_text || getDevelopmentInsights(notification.baby_age_months);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md overflow-hidden p-0">
          {/* Header with gradient */}
          <div className="bg-gradient-to-br from-primary via-pink-400 to-accent p-6 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 text-white/80 hover:text-white hover:bg-white/20"
              onClick={handleClose}
            >
              <X className="h-5 w-5" />
            </Button>

            <div className="relative z-10 space-y-3">
              <div className="flex justify-center gap-2">
                <Cake className="h-12 w-12 animate-bounce" />
                <Gift className="h-12 w-12 animate-bounce" style={{ animationDelay: '0.1s' }} />
                <Sparkles className="h-12 w-12 animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
              
              <h2 className="text-3xl font-bold">
                Happy Birthday, {babyName || 'Baby'}! 🎉
              </h2>
              
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 inline-block">
                <p className="text-xl font-semibold">
                  {ageText}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div className="bg-gradient-to-r from-primary/10 to-mint/10 rounded-xl p-4 border border-primary/20">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Heart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">
                    What to expect at this stage
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {insight}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShareOpen(true)}
                variant="outline"
                className="flex-1"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              <Button
                onClick={handleClose}
                className="flex-1 bg-gradient-to-r from-primary to-mint text-white"
              >
                Continue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ShareAchievementModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        achievement={{
          type: 'badge',
          title: `${babyName || 'Baby'} is ${ageText}!`,
          icon: '🎂',
          value: ageText
        }}
      />
    </>
  );
};

export default BirthdayCelebrationModal;