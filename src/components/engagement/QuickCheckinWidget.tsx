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
              <p className="text-xs text-muted-foreground">Today's check-in</p>
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
              <span className="text-xs font-semibold">Done</span>
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
          <span>How did {babyName || "baby"} eat today?</span>
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
            className="flex-1 relative overflow-hidden flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-xl bg-gradient-to-br from-mint/15 via-mint/10 to-secondary/10 border-2 border-mint/40 transition-all disabled:opacity-50 shadow-sm"
            whileHover={{ scale: 1.05, boxShadow: "0 8px 25px hsla(var(--mint), 0.25)" }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
              initial={{ x: -100, opacity: 0 }}
              whileHover={{ x: 100, opacity: 1 }}
              transition={{ duration: 0.6 }}
            />
            <Check className="w-5 h-5 text-mint relative z-10" />
            <span className="text-xs font-semibold text-foreground relative z-10">Ate well</span>
          </motion.button>
          <motion.button
            onClick={() => handleQuickCheckin('rejected')}
            disabled={isSubmitting}
            className="flex-1 relative overflow-hidden flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-xl bg-gradient-to-br from-accent/15 via-accent/10 to-peach/10 border-2 border-accent/40 transition-all disabled:opacity-50 shadow-sm"
            whileHover={{ scale: 1.05, boxShadow: "0 8px 25px hsla(var(--accent), 0.25)" }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
              initial={{ x: -100, opacity: 0 }}
              whileHover={{ x: 100, opacity: 1 }}
              transition={{ duration: 0.6 }}
            />
            <X className="w-5 h-5 text-accent relative z-10" />
            <span className="text-xs font-semibold text-foreground relative z-10">Rejected</span>
          </motion.button>
          <motion.button
            onClick={() => handleQuickCheckin('tried_new')}
            disabled={isSubmitting}
            className="flex-1 relative overflow-hidden flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-xl bg-gradient-to-br from-primary/15 via-primary/10 to-gold/10 border-2 border-primary/40 transition-all disabled:opacity-50 shadow-sm"
            whileHover={{ scale: 1.05, boxShadow: "0 8px 25px hsla(var(--primary), 0.25)" }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
              initial={{ x: -100, opacity: 0 }}
              whileHover={{ x: 100, opacity: 1 }}
              transition={{ duration: 0.6 }}
            />
            <Sparkles className="w-5 h-5 text-primary relative z-10" />
            <span className="text-xs font-semibold text-foreground relative z-10">New!</span>
          </motion.button>
        </div>
      </Card>
    </motion.div>
  );
};

export default QuickCheckinWidget;
