import { useEffect, useState } from "react";
import { Target, Clock, Trophy, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ActiveChallengeCardProps {
  challenge: {
    id: string;
    title: string;
    description: string;
    goal_count: number;
    reward_points: number;
    ends_at: string;
  } | null;
  progress: {
    current_count: number;
    completed: boolean;
  } | null;
}

const ActiveChallengeCard = ({ challenge, progress }: ActiveChallengeCardProps) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!challenge) return;

    const updateTimeLeft = () => {
      const now = new Date();
      const end = new Date(challenge.ends_at);
      const diff = end.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h left`);
      } else {
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${hours}h ${minutes}m left`);
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 60000);
    return () => clearInterval(interval);
  }, [challenge]);

  if (!challenge) return null;

  const currentCount = progress?.current_count || 0;
  const isCompleted = progress?.completed || false;
  const progressPercent = Math.min((currentCount / challenge.goal_count) * 100, 100);

  if (isCompleted) {
    return (
      <div className="bg-gradient-to-r from-mint/20 to-primary/20 rounded-2xl p-4 border border-mint/30 shadow-card">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-mint flex items-center justify-center">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-mint font-semibold uppercase tracking-wide">Challenge Complete!</p>
            <p className="text-sm font-medium text-foreground">{challenge.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              +{challenge.reward_points} points earned! 🎉
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-4 border border-primary/20 shadow-card">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-xs text-primary font-semibold uppercase tracking-wide flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Active Challenge
            </p>
            <p className="text-sm font-semibold text-foreground">{challenge.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground bg-background/50 px-2 py-1 rounded-full">
          <Clock className="w-3 h-3" />
          <span>{timeLeft}</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-3">{challenge.description}</p>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-foreground font-medium">
            {currentCount} / {challenge.goal_count}
          </span>
          <span className="text-primary font-semibold">
            🏆 +{challenge.reward_points} pts
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>
    </div>
  );
};

export default ActiveChallengeCard;
