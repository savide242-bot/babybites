import { Clock, AlertTriangle, Lightbulb, Utensils, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

interface EnrichedDailyContentProps {
  content: {
    id: string;
    content_type: 'safe_food' | 'common_mistake' | 'quick_tip' | 'try_today';
    title: string;
    content_text: string;
    icon: string;
  } | null;
}

const EnrichedDailyContent = ({ content }: EnrichedDailyContentProps) => {
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

  if (!content) return null;

  const contentStyles: Record<string, { 
    bg: string; 
    icon: typeof Lightbulb; 
    label: string;
    emoji: string;
  }> = {
    safe_food: {
      bg: "bg-mint/20 border-mint/30 text-mint",
      icon: Utensils,
      label: "Safe Food",
      emoji: "🥕"
    },
    common_mistake: {
      bg: "bg-accent/20 border-accent/30 text-accent",
      icon: AlertTriangle,
      label: "Common Mistake",
      emoji: "⚠️"
    },
    quick_tip: {
      bg: "bg-soft-blue border-soft-blue text-soft-blue-foreground",
      icon: Lightbulb,
      label: "Quick Tip",
      emoji: "⚡"
    },
    try_today: {
      bg: "bg-peach border-peach text-peach-foreground",
      icon: Sparkles,
      label: "Try Today",
      emoji: "🍽️"
    }
  };

  const style = contentStyles[content.content_type] || contentStyles.quick_tip;
  const IconComponent = style.icon;

  return (
    <div className={`rounded-2xl p-4 border shadow-card ${style.bg}`}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-background/80 flex items-center justify-center flex-shrink-0 text-xl">
          {content.icon || style.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase tracking-wide opacity-80 flex items-center gap-1">
              <IconComponent className="w-3 h-3" />
              {content.title}
            </span>
            <div className="flex items-center gap-1 text-xs opacity-70">
              <Clock className="w-3 h-3" />
              <span>{hoursLeft}h left</span>
            </div>
          </div>
          <p className="text-sm font-medium leading-relaxed">
            {content.content_text}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnrichedDailyContent;
