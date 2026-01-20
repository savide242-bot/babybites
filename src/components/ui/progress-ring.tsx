import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressRingProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  variant?: "primary" | "mint" | "gold" | "accent";
  showValue?: boolean;
  label?: string;
  className?: string;
}

const variantColors = {
  primary: {
    stroke: "stroke-primary",
    fill: "text-primary",
    bg: "stroke-primary/20",
    gradient: "from-primary to-primary-glow",
  },
  mint: {
    stroke: "stroke-mint",
    fill: "text-mint",
    bg: "stroke-mint/20",
    gradient: "from-mint to-mint-glow",
  },
  gold: {
    stroke: "stroke-gold",
    fill: "text-gold",
    bg: "stroke-gold/20",
    gradient: "from-gold to-gold-light",
  },
  accent: {
    stroke: "stroke-accent",
    fill: "text-accent",
    bg: "stroke-accent/20",
    gradient: "from-accent to-accent-glow",
  },
};

export const ProgressRing = ({
  value,
  max,
  size = 80,
  strokeWidth = 8,
  variant = "primary",
  showValue = true,
  label,
  className,
}: ProgressRingProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const colors = variantColors[variant];

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={colors.bg}
        />
        
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={colors.stroke}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>

      {/* Center content */}
      {(showValue || label) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {showValue && (
            <motion.span
              className={cn("font-bold", colors.fill, size > 60 ? "text-lg" : "text-sm")}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              {Math.round(percentage)}%
            </motion.span>
          )}
          {label && (
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
              {label}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// Horizontal progress bar variant
interface ProgressBarProps {
  value: number;
  max: number;
  variant?: "primary" | "mint" | "gold" | "accent";
  height?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const heightStyles = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

export const ProgressBar = ({
  value,
  max,
  variant = "primary",
  height = "md",
  showLabel = false,
  className,
}: ProgressBarProps) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const colors = variantColors[variant];

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>{value}</span>
          <span>{max}</span>
        </div>
      )}
      <div className={cn("w-full rounded-full bg-muted overflow-hidden", heightStyles[height])}>
        <motion.div
          className={cn("h-full rounded-full bg-gradient-to-r", colors.gradient)}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};
