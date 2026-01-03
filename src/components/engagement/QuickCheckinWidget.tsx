import { useState } from "react";
import { Check, X, Sparkles, Heart } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { hapticFeedback } from "@/utils/haptic";

interface QuickCheckinWidgetProps {
  todayCheckin: {
    status: 'ate_well' | 'rejected' | 'tried_new';
  } | null;
  onSubmit: (status: 'ate_well' | 'rejected' | 'tried_new') => Promise<boolean>;
  babyName?: string;
}

const QuickCheckinWidget = ({ todayCheckin, onSubmit, babyName }: QuickCheckinWidgetProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Empathetic messages for each status
  const empatheticMessages = {
    ate_well: [
      `What a wonderful meal! ${babyName || "Baby"} is thriving! 🌟`,
      `Amazing! Those little tummy is happy today! 💚`,
      `You're doing such a great job, mama! 🎉`,
    ],
    rejected: [
      `That's completely normal! It takes 10-15 tries for babies to accept new foods. 💪`,
      `Don't worry! Tomorrow is a new day. You're doing amazing! 🤍`,
      `This is part of the journey. ${babyName || "Baby"} is learning, and so are you! 🌱`,
      `Even rejections are progress. Stay patient, mama! 💕`,
    ],
    tried_new: [
      `How exciting! ${babyName || "Baby"} is becoming a little food explorer! 🌟`,
      `Every new food is a new adventure! You're amazing! 🎊`,
      `Building a healthy palate, one taste at a time! ✨`,
    ],
  };

  const getRandomMessage = (status: 'ate_well' | 'rejected' | 'tried_new') => {
    const messages = empatheticMessages[status];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  // Extended status info for completed check-ins
  const statusInfo = {
    ate_well: {
      emoji: "🎉",
      label: "Ate well!",
      supportMessage: "Great job! Keep offering variety.",
      bgColor: "bg-mint/10",
      borderColor: "border-mint/30",
      textColor: "text-mint"
    },
    rejected: {
      emoji: "💪",
      label: "Tried again",
      supportMessage: "That's okay! Persistence is key.",
      bgColor: "bg-accent/10",
      borderColor: "border-accent/30",
      textColor: "text-accent"
    },
    tried_new: {
      emoji: "🌟",
      label: "New food!",
      supportMessage: "Amazing! Keep exploring!",
      bgColor: "bg-primary/10",
      borderColor: "border-primary/30",
      textColor: "text-primary"
    }
  };

  const handleQuickCheckin = async (status: 'ate_well' | 'rejected' | 'tried_new') => {
    if (isSubmitting || todayCheckin) return;
    
    // Haptic feedback on tap
    hapticFeedback('medium');
    
    setIsSubmitting(true);
    const success = await onSubmit(status);
    setIsSubmitting(false);

    if (success) {
      const message = getRandomMessage(status);
      
      // Celebration based on status
      if (status === 'tried_new') {
        hapticFeedback('success');
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#FF6B9D', '#FFD93D', '#6BCB77', '#4D96FF', '#9B5DE5']
        });
        toast.success(message, { duration: 5000 });
      } else if (status === 'ate_well') {
        hapticFeedback('success');
        confetti({
          particleCount: 60,
          spread: 50,
          origin: { y: 0.6 },
          colors: ['#6BCB77', '#98D8C8', '#A8E6CF']
        });
        toast.success(message, { duration: 4000 });
      } else {
        hapticFeedback('light');
        // Special empathetic toast for rejection
        toast(message, { 
          duration: 6000,
          icon: <Heart className="w-5 h-5 text-primary" />,
        });
      }
    }
  };

  if (todayCheckin) {
    const info = statusInfo[todayCheckin.status];
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <Card className={`${info.bgColor} rounded-2xl p-4 border ${info.borderColor}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div 
                className={`w-12 h-12 rounded-2xl ${info.bgColor} flex items-center justify-center`}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <span className="text-2xl">{info.emoji}</span>
              </motion.div>
              <div>
                <p className="text-xs text-muted-foreground">Check-in de hoje</p>
                <p className="text-sm font-semibold text-foreground">{info.label}</p>
                <p className={`text-xs ${info.textColor} font-medium mt-0.5`}>{info.supportMessage}</p>
              </div>
            </div>
            <motion.div 
              className={`flex items-center gap-1.5 ${info.textColor}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
            >
              <Check className="w-5 h-5" />
              <span className="text-xs font-semibold">Feito</span>
            </motion.div>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
        <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
          <span>Como o {babyName || "bebé"} comeu hoje?</span>
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Heart className="w-4 h-4 text-primary/50" />
          </motion.span>
        </p>
        <div className="flex gap-2">
          <motion.button
            onClick={() => handleQuickCheckin('ate_well')}
            disabled={isSubmitting}
            className="flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl bg-mint/10 hover:bg-mint/20 border border-mint/30 transition-all disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
          >
            <Check className="w-5 h-5 text-mint" />
            <span className="text-xs font-medium text-foreground">Comeu bem</span>
          </motion.button>
          <motion.button
            onClick={() => handleQuickCheckin('rejected')}
            disabled={isSubmitting}
            className="flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl bg-accent/10 hover:bg-accent/20 border border-accent/30 transition-all disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
          >
            <X className="w-5 h-5 text-accent" />
            <span className="text-xs font-medium text-foreground">Rejeitou</span>
          </motion.button>
          <motion.button
            onClick={() => handleQuickCheckin('tried_new')}
            disabled={isSubmitting}
            className="flex-1 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/30 transition-all disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
          >
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="text-xs font-medium text-foreground">Novo!</span>
          </motion.button>
        </div>
      </Card>
    </motion.div>
  );
};

export default QuickCheckinWidget;
