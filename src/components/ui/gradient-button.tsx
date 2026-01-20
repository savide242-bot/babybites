import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

interface GradientButtonProps {
  variant?: "primary" | "mint" | "gold" | "peach" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit" | "reset";
}

const variantStyles = {
  primary: "bg-gradient-to-r from-primary to-primary-glow text-primary-foreground hover:shadow-[0_8px_24px_hsl(var(--primary)/0.4)]",
  mint: "bg-gradient-to-r from-mint to-mint-glow text-mint-foreground hover:shadow-[0_8px_24px_hsl(var(--mint)/0.4)]",
  gold: "bg-gradient-to-r from-gold to-gold-light text-gold-foreground hover:shadow-[0_8px_24px_hsl(var(--gold)/0.4)]",
  peach: "bg-gradient-to-r from-peach to-primary/30 text-peach-foreground hover:shadow-[0_8px_24px_hsl(var(--peach)/0.4)]",
  outline: "bg-transparent border-2 border-primary/40 text-primary hover:bg-primary/10 hover:border-primary",
};

const sizeStyles = {
  sm: "h-9 px-4 text-sm rounded-xl",
  md: "h-11 px-6 text-base rounded-2xl",
  lg: "h-14 px-8 text-lg rounded-2xl font-semibold",
};

const GradientButton = ({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  children,
  disabled,
  onClick,
  type = "button",
}: GradientButtonProps) => {
  return (
    <motion.button
      type={type}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
        initial={{ x: "-100%" }}
        whileHover={{ x: "100%" }}
        transition={{ duration: 0.6 }}
      />
      
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : icon ? (
        <>{icon}</>
      ) : null}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
};

export { GradientButton };
