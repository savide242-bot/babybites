import { useState } from "react";
import { Check, X, Sparkles, Heart } from "lucide-react";
import { toast } from "sonner";

interface DailyCheckinWidgetProps {
  todayCheckin: {
    status: 'ate_well' | 'rejected' | 'tried_new';
  } | null;
  onSubmit: (status: 'ate_well' | 'rejected' | 'tried_new') => Promise<boolean>;
}

const emotionalFeedback = {
  ate_well: {
    message: "Wonderful! Each good meal builds healthy habits! 💚",
    emoji: "🎉",
    color: "bg-mint text-white"
  },
  rejected: {
    message: "That's completely normal! Babies need 10-15 tries for new foods. Keep going! 💪",
    emoji: "🤗",
    color: "bg-accent text-white"
  },
  tried_new: {
    message: "Amazing! Exploring new flavors is so important for development! 🌟",
    emoji: "✨",
    color: "bg-primary text-white"
  }
};

const DailyCheckinWidget = ({ todayCheckin, onSubmit }: DailyCheckinWidgetProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastStatus, setLastStatus] = useState<'ate_well' | 'rejected' | 'tried_new' | null>(null);

  const handleCheckin = async (status: 'ate_well' | 'rejected' | 'tried_new') => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    const success = await onSubmit(status);
    setIsSubmitting(false);

    if (success) {
      setLastStatus(status);
      setShowFeedback(true);
      const feedback = emotionalFeedback[status];
      toast.success(feedback.message, { 
        icon: feedback.emoji,
        duration: 4000 
      });

      setTimeout(() => setShowFeedback(false), 3000);
    }
  };

  const currentStatus = todayCheckin?.status || lastStatus;

  if (currentStatus && !showFeedback) {
    const feedback = emotionalFeedback[currentStatus];
    return (
      <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl ${feedback.color} flex items-center justify-center text-2xl`}>
            {feedback.emoji}
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-0.5">Today's check-in</p>
            <p className="text-sm font-medium text-foreground">{feedback.message}</p>
          </div>
          <Heart className="w-5 h-5 text-accent animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
      <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
        <span>How did feeding go today?</span>
        <Sparkles className="w-4 h-4 text-accent" />
      </p>
      
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => handleCheckin('ate_well')}
          disabled={isSubmitting}
          className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-mint/10 hover:bg-mint/20 border border-mint/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
        >
          <div className="w-10 h-10 rounded-full bg-mint/20 flex items-center justify-center">
            <Check className="w-5 h-5 text-mint" />
          </div>
          <span className="text-xs font-medium text-foreground">Ate well</span>
        </button>

        <button
          onClick={() => handleCheckin('rejected')}
          disabled={isSubmitting}
          className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-accent/10 hover:bg-accent/20 border border-accent/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
        >
          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
            <X className="w-5 h-5 text-accent" />
          </div>
          <span className="text-xs font-medium text-foreground">Rejected</span>
        </button>

        <button
          onClick={() => handleCheckin('tried_new')}
          disabled={isSubmitting}
          className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
        >
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <span className="text-xs font-medium text-foreground">New food!</span>
        </button>
      </div>
    </div>
  );
};

export default DailyCheckinWidget;
