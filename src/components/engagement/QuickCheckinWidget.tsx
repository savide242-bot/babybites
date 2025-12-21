import { useState } from "react";
import { Check, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface QuickCheckinWidgetProps {
  todayCheckin: {
    status: 'ate_well' | 'rejected' | 'tried_new';
  } | null;
  onSubmit: (status: 'ate_well' | 'rejected' | 'tried_new') => Promise<boolean>;
  babyName?: string;
}

const QuickCheckinWidget = ({ todayCheckin, onSubmit, babyName }: QuickCheckinWidgetProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuickCheckin = async (status: 'ate_well' | 'rejected' | 'tried_new') => {
    if (isSubmitting || todayCheckin) return;
    
    setIsSubmitting(true);
    const success = await onSubmit(status);
    setIsSubmitting(false);

    if (success) {
      // Celebration based on status
      if (status === 'tried_new') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FF6B9D', '#FFD93D', '#6BCB77', '#4D96FF']
        });
        toast.success(`🌟 Amazing! ${babyName || "Baby"} is exploring new flavors!`, { duration: 4000 });
      } else if (status === 'ate_well') {
        confetti({
          particleCount: 50,
          spread: 45,
          origin: { y: 0.6 },
          colors: ['#6BCB77', '#98D8C8']
        });
        toast.success(`🎉 Great job! ${babyName || "Baby"} ate well today!`, { duration: 3000 });
      } else {
        toast.info("💪 That's okay! Babies need 10-15 tries for new foods.", { duration: 4000 });
      }
    }
  };

  if (todayCheckin) {
    const statusEmojis = {
      ate_well: "🎉",
      rejected: "💪",
      tried_new: "🌟"
    };
    const statusLabels = {
      ate_well: "Ate well!",
      rejected: "Tried again",
      tried_new: "New food!"
    };
    return (
      <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{statusEmojis[todayCheckin.status]}</span>
            <div>
              <p className="text-xs text-muted-foreground">Today's check-in</p>
              <p className="text-sm font-medium text-foreground">{statusLabels[todayCheckin.status]}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-mint">
            <Check className="w-5 h-5" />
            <span className="text-xs font-medium">Done</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
      <p className="text-sm font-medium text-foreground mb-3">
        How did {babyName || "baby"} eat today?
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => handleQuickCheckin('ate_well')}
          disabled={isSubmitting}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-mint/10 hover:bg-mint/20 border border-mint/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
        >
          <Check className="w-5 h-5 text-mint" />
          <span className="text-sm font-medium text-foreground">Ate well</span>
        </button>
        <button
          onClick={() => handleQuickCheckin('rejected')}
          disabled={isSubmitting}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-accent/10 hover:bg-accent/20 border border-accent/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
        >
          <X className="w-5 h-5 text-accent" />
          <span className="text-sm font-medium text-foreground">Rejected</span>
        </button>
        <button
          onClick={() => handleQuickCheckin('tried_new')}
          disabled={isSubmitting}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
        >
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-foreground">New!</span>
        </button>
      </div>
    </div>
  );
};

export default QuickCheckinWidget;
