import { motion } from "framer-motion";
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
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-start gap-4">
        {/* Animated emoji container */}
        <motion.div
          className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-gold/30 via-peach/50 to-primary/20 flex items-center justify-center text-2xl shadow-lg border border-gold/20"
          animate={{
            scale: [1, 1.05, 1],
            rotate: [0, 2, -2, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {emoji}
        </motion.div>

        <div className="flex-1 min-w-0">
          {/* Main greeting */}
          <h1 className="text-xl font-bold text-foreground leading-tight">
            {greeting},{" "}
            <span className="bg-gradient-to-r from-primary via-gold to-primary bg-clip-text text-transparent">
              {name}
            </span>
            !
          </h1>

          {/* Subtitle with emotional touch */}
          {subtitle && (
            <motion.p
              className="text-sm text-muted-foreground mt-0.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {subtitle} ✨
            </motion.p>
          )}

          {/* Optional badge */}
          {badge && (
            <motion.div
              className="mt-2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              {badge}
            </motion.div>
          )}
        </div>
      </div>

      {/* Decorative gradient line */}
      <motion.div
        className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      />
    </motion.div>
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
    <motion.div
      className={`inline-flex items-center gap-2 rounded-full border shadow-lg backdrop-blur-sm ${
        isLegendary
          ? "bg-gradient-to-r from-gold/30 via-amber-500/20 to-gold/30 border-gold/50"
          : isOnFire
          ? "bg-gradient-to-r from-accent/20 via-amber-500/15 to-accent/20 border-accent/40"
          : "bg-gradient-to-r from-primary/20 to-peach/20 border-primary/30"
      } ${size === "sm" ? "px-3 py-1" : "px-4 py-2"}`}
      animate={isOnFire ? { scale: [1, 1.02, 1] } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      <motion.span
        className={size === "sm" ? "text-base" : "text-lg"}
        animate={isOnFire ? { rotate: [0, -5, 5, 0] } : {}}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
      >
        🔥
      </motion.span>
      <span
        className={`font-bold bg-gradient-to-r ${
          isLegendary
            ? "from-gold to-amber-600"
            : isOnFire
            ? "from-accent to-amber-500"
            : "from-primary to-gold"
        } bg-clip-text text-transparent ${size === "sm" ? "text-xs" : "text-sm"}`}
      >
        {streak} day{streak !== 1 ? "s" : ""}
      </span>
      {isLegendary && <span className="text-gold text-xs">👑</span>}
    </motion.div>
  );
};
