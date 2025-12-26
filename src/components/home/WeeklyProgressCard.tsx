import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Flame, Target, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface WeeklyProgressCardProps {
  streak: { current_streak: number; total_points: number } | null;
  mealsThisWeek: number;
  babyName: string;
}

const WeeklyProgressCard = ({ streak, mealsThisWeek, babyName }: WeeklyProgressCardProps) => {
  const weeklyGoal = 14; // 2 meals per day * 7 days
  const progress = Math.min(100, Math.round((mealsThisWeek / weeklyGoal) * 100));
  const currentStreak = streak?.current_streak || 0;
  const totalPoints = streak?.total_points || 0;

  // Milestone messages
  const getMilestoneMessage = () => {
    if (currentStreak >= 30) return "🏆 Legendary streak!";
    if (currentStreak >= 14) return "⭐ Two weeks strong!";
    if (currentStreak >= 7) return "🔥 One week champion!";
    if (currentStreak >= 3) return "💪 Building momentum!";
    if (currentStreak >= 1) return "🌱 Great start!";
    return "Start your streak today!";
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-accent/10 via-card to-primary/5 border-accent/20">
      {/* Stats Row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          {/* Streak */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <Flame className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{currentStreak}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Day Streak</p>
            </div>
          </div>

          {/* Points */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-sunshine/30 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-sunshine-foreground" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{totalPoints}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Points</p>
            </div>
          </div>
        </div>

        <Link 
          to="/achievements" 
          className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          View All
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Milestone Message */}
      <div className="mb-3">
        <p className="text-sm font-medium text-foreground">
          {getMilestoneMessage()}
        </p>
      </div>

      {/* Weekly Progress */}
      <div className="bg-card/60 rounded-xl p-3 border border-border/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-foreground">This Week's Meals</span>
          </div>
          <span className="text-xs font-bold text-primary">{mealsThisWeek}/{weeklyGoal}</span>
        </div>
        <Progress value={progress} className="h-2" />
        <p className="text-[10px] text-muted-foreground mt-1.5">
          {progress === 100 
            ? `Amazing! You've reached your weekly goal! 🎉` 
            : `${weeklyGoal - mealsThisWeek} more meals to reach your goal`
          }
        </p>
      </div>
    </Card>
  );
};

export default WeeklyProgressCard;
