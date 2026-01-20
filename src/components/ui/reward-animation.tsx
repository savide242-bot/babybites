import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { Sparkles, Heart, Star, Trophy, Flame } from "lucide-react";

interface RewardAnimationProps {
  trigger: boolean;
  type?: "confetti" | "hearts" | "stars" | "sparkles";
  message?: string;
  points?: number;
  onComplete?: () => void;
}

const icons = {
  hearts: Heart,
  stars: Star,
  sparkles: Sparkles,
  trophy: Trophy,
  flame: Flame,
};

export const RewardAnimation = ({
  trigger,
  type = "confetti",
  message,
  points,
  onComplete,
}: RewardAnimationProps) => {
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    if (trigger) {
      setShowOverlay(true);
      
      if (type === "confetti") {
        // Fire confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#F8A5B7', '#7DD4B8', '#FFD54F', '#FFDAB9', '#A8D8EA'],
        });
      }

      // Hide overlay after animation
      const timer = setTimeout(() => {
        setShowOverlay(false);
        onComplete?.();
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [trigger, type, onComplete]);

  return (
    <AnimatePresence>
      {showOverlay && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Floating particles */}
          {type !== "confetti" && (
            <div className="absolute inset-0 overflow-hidden">
              {Array.from({ length: 12 }).map((_, i) => {
                const Icon = icons[type === "hearts" ? "hearts" : type === "stars" ? "stars" : "sparkles"];
                return (
                  <motion.div
                    key={i}
                    className="absolute text-primary"
                    initial={{
                      x: Math.random() * window.innerWidth,
                      y: window.innerHeight,
                      scale: 0.5 + Math.random() * 0.5,
                      rotate: Math.random() * 360,
                    }}
                    animate={{
                      y: -100,
                      x: Math.random() * window.innerWidth,
                      rotate: Math.random() * 720,
                      opacity: [0, 1, 1, 0],
                    }}
                    transition={{
                      duration: 2 + Math.random(),
                      delay: Math.random() * 0.5,
                    }}
                  >
                    <Icon className="w-6 h-6" style={{ 
                      color: ['hsl(var(--primary))', 'hsl(var(--mint))', 'hsl(var(--gold))', 'hsl(var(--peach))'][i % 4] 
                    }} />
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Central message */}
          {(message || points) && (
            <motion.div
              className="bg-card/95 backdrop-blur-xl rounded-3xl px-8 py-6 shadow-2xl border border-primary/20"
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 10 }}
              transition={{ type: "spring", damping: 12 }}
            >
              <div className="text-center">
                {points && (
                  <motion.div
                    className="text-4xl font-bold bg-gradient-to-r from-gold via-accent to-gold-light bg-clip-text text-transparent mb-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                  >
                    +{points}
                  </motion.div>
                )}
                {message && (
                  <motion.p
                    className="text-lg font-medium text-foreground"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    {message}
                  </motion.p>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Hook for easy reward triggering
export const useReward = () => {
  const [showReward, setShowReward] = useState(false);
  const [rewardConfig, setRewardConfig] = useState<{
    type: "confetti" | "hearts" | "stars" | "sparkles";
    message?: string;
    points?: number;
  }>({ type: "confetti" });

  const triggerReward = (config: typeof rewardConfig) => {
    setRewardConfig(config);
    setShowReward(true);
  };

  const RewardComponent = () => (
    <RewardAnimation
      trigger={showReward}
      type={rewardConfig.type}
      message={rewardConfig.message}
      points={rewardConfig.points}
      onComplete={() => setShowReward(false)}
    />
  );

  return { triggerReward, RewardComponent };
};
