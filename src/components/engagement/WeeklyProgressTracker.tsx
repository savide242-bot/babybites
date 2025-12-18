import { TrendingUp, Utensils, Sparkles, Calendar } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface WeeklyProgressTrackerProps {
  progress: {
    totalCheckins: number;
    varietyCount: number;
    newFoodsCount: number;
    consistencyStreak: number;
  };
}

const WeeklyProgressTracker = ({ progress }: WeeklyProgressTrackerProps) => {
  const metrics = [
    {
      label: "Check-ins",
      value: progress.totalCheckins,
      max: 7,
      icon: Calendar,
      color: "bg-primary",
      bgColor: "bg-primary/10"
    },
    {
      label: "Variety",
      value: progress.varietyCount,
      max: 10,
      icon: Utensils,
      color: "bg-mint",
      bgColor: "bg-mint/10"
    },
    {
      label: "New Foods",
      value: progress.newFoodsCount,
      max: 5,
      icon: Sparkles,
      color: "bg-accent",
      bgColor: "bg-accent/10"
    },
    {
      label: "Streak",
      value: progress.consistencyStreak,
      max: 7,
      icon: TrendingUp,
      color: "bg-secondary",
      bgColor: "bg-secondary/10"
    }
  ];

  return (
    <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">This Week's Progress</h3>
        <span className="text-xs text-muted-foreground">Keep it up! 💪</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {metrics.map((metric) => (
          <div key={metric.label} className={`${metric.bgColor} rounded-xl p-3`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-7 h-7 rounded-lg ${metric.color} flex items-center justify-center`}>
                <metric.icon className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground leading-none">
                  {metric.value}<span className="text-xs text-muted-foreground">/{metric.max}</span>
                </p>
              </div>
            </div>
            <Progress 
              value={(metric.value / metric.max) * 100} 
              className="h-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1.5">{metric.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeeklyProgressTracker;
