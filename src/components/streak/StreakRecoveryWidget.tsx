import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Flame, Snowflake, AlertTriangle, Shield, 
  Sparkles, Check, Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface StreakData {
  id: string;
  current_streak: number;
  longest_streak: number;
  streak_freezes_available: number;
  grace_period_eligible: boolean;
  grace_period_days_missed: number;
  last_activity_date: string | null;
}

export const StreakRecoveryWidget = () => {
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [streakAtRisk, setStreakAtRisk] = useState(false);
  const [canRecover, setCanRecover] = useState(false);

  useEffect(() => {
    loadStreakData();
  }, []);

  const loadStreakData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      setStreakData(data);
      
      // Check if streak is at risk (missed yesterday)
      const lastActivity = data.last_activity_date ? new Date(data.last_activity_date) : null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (lastActivity) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const dayBefore = new Date(today);
        dayBefore.setDate(dayBefore.getDate() - 2);
        
        lastActivity.setHours(0, 0, 0, 0);
        
        // Streak is at risk if last activity was before yesterday
        const atRisk = lastActivity < yesterday && data.current_streak > 0;
        setStreakAtRisk(atRisk);
        
        // Can recover if within grace period (2 days) and has freeze
        const canUseFreeze = atRisk && 
          data.streak_freezes_available > 0 && 
          lastActivity >= dayBefore;
        setCanRecover(canUseFreeze);
      }
    }
    setIsLoading(false);
  };

  const useStreakFreeze = async () => {
    if (!streakData || streakData.streak_freezes_available <= 0) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabase
      .from('user_streaks')
      .update({
        streak_freezes_available: streakData.streak_freezes_available - 1,
        last_activity_date: today,
        grace_period_eligible: false,
        grace_period_days_missed: 0,
      })
      .eq('user_id', user.id);

    if (error) {
      toast.error("Failed to use streak freeze");
      return;
    }

    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    toast.success("❄️ Streak Freeze used! Your streak is saved!");
    loadStreakData();
  };

  if (isLoading || !streakData) return null;

  // Don't show if no streak or not at risk
  if (!streakAtRisk && streakData.streak_freezes_available > 0) {
    return (
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
              <Snowflake className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="font-medium text-sm">Streak Freeze Available</p>
              <p className="text-xs text-muted-foreground">
                {streakData.streak_freezes_available} freeze{streakData.streak_freezes_available !== 1 ? 's' : ''} ready to protect your streak
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
            <Shield className="w-3 h-3 mr-1" />
            Protected
          </Badge>
        </div>
      </Card>
    );
  }

  if (!streakAtRisk) return null;

  return (
    <Card className="p-5 border-2 border-orange-300 dark:border-orange-700 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 animate-in slide-in-from-top-4">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2.5 rounded-xl bg-orange-100 dark:bg-orange-900/50">
          <AlertTriangle className="w-6 h-6 text-orange-500" />
        </div>
        <div>
          <h3 className="font-bold text-lg">Your Streak is at Risk! 🔥</h3>
          <p className="text-sm text-muted-foreground">
            {streakData.current_streak} day streak will be lost if not recovered
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between p-3 rounded-xl bg-background/80 mb-4">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          <span className="font-semibold">{streakData.current_streak} Day Streak</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span className="text-sm">Expires soon</span>
        </div>
      </div>

      {canRecover && streakData.streak_freezes_available > 0 ? (
        <div className="space-y-3">
          <Button onClick={useStreakFreeze} className="w-full gap-2 bg-blue-600 hover:bg-blue-700">
            <Snowflake className="w-4 h-4" />
            Use Streak Freeze ({streakData.streak_freezes_available} remaining)
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Freezes regenerate weekly. This will save your current streak!
          </p>
        </div>
      ) : (
        <div className="text-center p-4 rounded-xl bg-muted/50">
          <p className="text-sm text-muted-foreground mb-2">
            {streakData.streak_freezes_available === 0 
              ? "No streak freezes available. Complete an activity today to keep your streak!"
              : "Activity today will save your streak!"}
          </p>
          <Badge className="gap-1">
            <Sparkles className="w-3 h-3" />
            Log a meal or check in to save it
          </Badge>
        </div>
      )}
    </Card>
  );
};
