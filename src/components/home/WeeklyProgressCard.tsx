import { motion } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { Trophy, Flame, Target, ChevronRight, Shield, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import ProgressDonutChart from './ProgressDonutChart';

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

  // Milestone messages with better engagement
  const getMilestoneMessage = () => {
    if (currentStreak >= 100) return { emoji: "👑", message: "Legendary Parent!", color: "text-sunshine" };
    if (currentStreak >= 60) return { emoji: "💎", message: "Diamond streak!", color: "text-primary" };
    if (currentStreak >= 30) return { emoji: "🏆", message: "Champion streak!", color: "text-accent" };
    if (currentStreak >= 14) return { emoji: "⭐", message: "Two strong weeks!", color: "text-mint" };
    if (currentStreak >= 7) return { emoji: "🔥", message: "One week on fire!", color: "text-accent" };
    if (currentStreak >= 3) return { emoji: "💪", message: "Building momentum!", color: "text-primary" };
    if (currentStreak >= 1) return { emoji: "🌱", message: "Great start!", color: "text-mint" };
    return { emoji: "✨", message: "Start today!", color: "text-muted-foreground" };
  };

  const milestone = getMilestoneMessage();
  const isOnFire = currentStreak >= 7;
  const isLegendary = currentStreak >= 30;

  return (
    <Card className="p-4 bg-gradient-to-br from-accent/10 via-card to-primary/5 border-accent/20 overflow-hidden relative">
      {/* Fire celebration for streaks >= 7 */}
      {isOnFire && (
        <motion.div 
          className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20"
          animate={{ y: [0, -4, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-2xl drop-shadow-lg">🔥</span>
        </motion.div>
      )}
      
      {/* Animated background for legendary streaks */}
      {isLegendary && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-sunshine/5 via-transparent to-sunshine/5"
          animate={{ x: [-200, 200] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
      )}

      <div className="relative z-10">
        {/* Stats Row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            {/* Animated Streak Badge */}
            <motion.div 
              className="flex items-center gap-2"
              animate={isOnFire ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center relative ${
                isLegendary ? 'bg-sunshine/30' : 'bg-accent/20'
              }`}>
                {isOnFire ? (
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, -5, 5, 0]
                    }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  >
                    <Flame className={`w-5 h-5 ${isLegendary ? 'text-sunshine-foreground' : 'text-accent'}`} />
                  </motion.div>
                ) : (
                  <Flame className="w-5 h-5 text-accent" />
                )}
                
                {/* Fire particles for streaks > 7 */}
                {isOnFire && (
                  <>
                    <motion.div
                      className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-accent"
                      animate={{ scale: [0, 1, 0], opacity: [0, 1, 0], y: [0, -8] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                    />
                    <motion.div
                      className="absolute -top-1 left-0 w-1.5 h-1.5 rounded-full bg-sunshine"
                      animate={{ scale: [0, 1, 0], opacity: [0, 1, 0], y: [0, -6] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
                    />
                  </>
                )}
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{currentStreak}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  {currentStreak === 1 ? 'Day' : 'Days'}
                </p>
              </div>
            </motion.div>

            {/* Points with animation */}
            <motion.div 
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="w-10 h-10 rounded-xl bg-sunshine/30 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-sunshine-foreground" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{totalPoints}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Points</p>
              </div>
            </motion.div>
          </div>

          <Link 
            to="/achievements" 
            className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            View All
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Milestone Message with animation */}
        <motion.div 
          className="mb-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          key={currentStreak}
        >
          <p className={`text-sm font-medium ${milestone.color} flex items-center gap-1.5`}>
            <motion.span
              animate={isOnFire ? { rotate: [0, -10, 10, 0] } : {}}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
            >
              {milestone.emoji}
            </motion.span>
            {milestone.message}
            {isLegendary && (
              <motion.span
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Shield className="w-4 h-4 text-sunshine inline ml-1" />
              </motion.span>
            )}
          </p>
        </motion.div>

        {/* Weekly Progress with Donut Chart */}
        <div className="bg-card/60 rounded-xl p-3 border border-border/50">
          <div className="flex items-center gap-4">
            {/* Donut Chart */}
            <ProgressDonutChart value={mealsThisWeek} max={weeklyGoal} size={70} strokeWidth={8} />
            
            {/* Text info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Weekly Meals</span>
              </div>
              <p className="text-xs text-muted-foreground mb-1">
                <span className="text-foreground font-semibold">{mealsThisWeek}</span> of {weeklyGoal} meals
              </p>
              <p className="text-[10px] text-muted-foreground">
                {progress === 100 
                  ? <span className="text-mint font-medium">🎉 Weekly goal reached!</span>
                  : `${weeklyGoal - mealsThisWeek} left to goal`
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default WeeklyProgressCard;