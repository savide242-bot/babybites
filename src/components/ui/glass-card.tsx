import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  variant?: "default" | "warm" | "mint" | "gold" | "peach";
  glow?: boolean;
  hover?: boolean;
}

const variantStyles = {
  default: "bg-card/80 border-border/40",
  warm: "bg-gradient-to-br from-primary/10 via-card/90 to-peach/10 border-primary/20",
  mint: "bg-gradient-to-br from-mint/10 via-card/90 to-secondary/10 border-mint/20",
  gold: "bg-gradient-to-br from-gold/10 via-card/90 to-accent/10 border-gold/20",
  peach: "bg-gradient-to-br from-peach/20 via-card/90 to-primary/5 border-peach/30",
};

const glowStyles = {
  default: "shadow-[0_8px_32px_hsl(var(--primary)/0.08)]",
  warm: "shadow-[0_8px_32px_hsl(var(--primary)/0.15)]",
  mint: "shadow-[0_8px_32px_hsl(var(--mint)/0.15)]",
  gold: "shadow-[0_8px_32px_hsl(var(--gold)/0.15)]",
  peach: "shadow-[0_8px_32px_hsl(var(--peach)/0.2)]",
};

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "default", glow = true, hover = true, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          "backdrop-blur-xl rounded-2xl border p-4 transition-all duration-300",
          variantStyles[variant],
          glow && glowStyles[variant],
          hover && "hover:scale-[1.01] hover:shadow-lg",
          className
        )}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

GlassCard.displayName = "GlassCard";

export { GlassCard };
