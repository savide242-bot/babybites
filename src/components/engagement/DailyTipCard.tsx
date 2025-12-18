import { Lightbulb, Clock } from "lucide-react";
import { useEffect, useState } from "react";

interface DailyTipCardProps {
  tip: {
    id: string;
    tip_text: string;
    category: string;
  } | null;
}

const DailyTipCard = ({ tip }: DailyTipCardProps) => {
  const [hoursLeft, setHoursLeft] = useState(0);

  useEffect(() => {
    const calculateHoursLeft = () => {
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      const diff = endOfDay.getTime() - now.getTime();
      setHoursLeft(Math.floor(diff / (1000 * 60 * 60)));
    };

    calculateHoursLeft();
    const interval = setInterval(calculateHoursLeft, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!tip) return null;

  const categoryColors: Record<string, string> = {
    nutrition: "bg-mint/20 text-mint border-mint/30",
    safety: "bg-accent/20 text-accent border-accent/30",
    development: "bg-soft-blue text-soft-blue-foreground border-soft-blue",
    tips: "bg-peach text-peach-foreground border-peach",
    general: "bg-sunshine/30 text-sunshine-foreground border-sunshine/50"
  };

  const colorClass = categoryColors[tip.category] || categoryColors.general;

  return (
    <div className={`rounded-2xl p-4 border shadow-card ${colorClass}`}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-background/80 flex items-center justify-center flex-shrink-0">
          <Lightbulb className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase tracking-wide opacity-80">
              💡 Tip of the Day
            </span>
            <div className="flex items-center gap-1 text-xs opacity-70">
              <Clock className="w-3 h-3" />
              <span>{hoursLeft}h left</span>
            </div>
          </div>
          <p className="text-sm font-medium leading-relaxed">
            {tip.tip_text}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DailyTipCard;
