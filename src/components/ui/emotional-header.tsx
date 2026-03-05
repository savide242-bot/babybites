import { ReactNode } from "react";

interface EmotionalHeaderProps {
  greeting: string;
  name: string;
  subtitle?: string;
  emoji?: string;
  badge?: ReactNode;
}

export const EmotionalHeader = ({
  greeting,
  name,
  subtitle,
  emoji = "✨",
  badge,
}: EmotionalHeaderProps) => {
  return (
    <div className="relative animate-fade-in">
      <div className="flex items-start gap-4">
        {/* Animated emoji container */}
        <div
          className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-gold/30 via-peach/50 to-primary/20 flex items-center justify-center text-2xl shadow-lg border border-gold/20 animate-[float_4s_ease-in-out_infinite]"
        >
          {emoji}
        </div>

        <div className="flex-1 min-w-0">
          {/* Main greeting with shimmer */}
          <h1 className="text-xl font-bold text-foreground leading-tight">
            {greeting},{" "}
            <span className="bg-gradient-to-r from-primary via-gold via-50% to-primary bg-clip-text text-transparent bg-[length:300%] animate-[shimmer-strong_3s_ease-in-out_infinite]">
              {name}
            </span>
            !
          </h1>

          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              {subtitle} ✨
            </p>
          )}

          {badge && (
            <div className="mt-2 animate-scale-in" style={{ animationDelay: '0.3s' }}>
              {badge}
            </div>
          )}
        </div>
      </div>

      {/* Decorative gradient line */}
      <div className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent animate-scale-in" style={{ animationDelay: '0.4s' }} />
    </div>
  );
};

// Streak Badge component
interface StreakBadgeProps {
  streak: number;
  size?: "sm" | "md";
}

export const StreakBadge = ({ streak, size = "md" }: StreakBadgeProps) => {
  const isOnFire = streak >= 7;
  const isLegendary = streak >= 30;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border shadow-lg backdrop-blur-sm ${
        isLegendary
          ? "bg-gradient-to-r from-gold/30 via-amber-500/20 to-gold/30 border-gold/50"
          : isOnFire
          ? "bg-gradient-to-r from-accent/20 via-amber-500/15 to-accent/20 border-accent/40"
          : "bg-gradient-to-r from-primary/20 to-peach/20 border-primary/30"
      } ${size === "sm" ? "px-3 py-1" : "px-4 py-2"} ${isOnFire ? 'animate-pulse' : ''}`}
    >
      <span className={`${size === "sm" ? "text-base" : "text-lg"} ${isOnFire ? 'animate-[float_2s_ease-in-out_infinite]' : ''}`}>
        🔥
      </span>
      <span
        className={`font-bold bg-gradient-to-r ${
          isLegendary ? "from-gold to-amber-600" : isOnFire ? "from-accent to-amber-500" : "from-primary to-gold"
        } bg-clip-text text-transparent ${size === "sm" ? "text-xs" : "text-sm"}`}
      >
        {streak} day{streak !== 1 ? "s" : ""}
      </span>
      {isLegendary && <span className="text-gold text-xs">👑</span>}
    </div>
  );
};
