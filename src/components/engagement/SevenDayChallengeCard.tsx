import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Flame, Check, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import confetti from "canvas-confetti";
import { toast } from "sonner";

interface SevenDayChallengeCardProps {
  babyName?: string;
}

const SevenDayChallengeCard = ({ babyName }: SevenDayChallengeCardProps) => {
  const [progress, setProgress] = useState<{
    day: number;
    completed: boolean;
    daysCompleted: number[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      // Get onboarding progress
      const { data: onboarding } = await supabase
        .from('onboarding_progress')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (!onboarding) {
        // Create onboarding progress for new users
        await supabase.from('onboarding_progress').insert({
          user_id: session.user.id,
          seven_day_challenge_started: true,
          day_of_journey: 1
        });
        setProgress({ day: 1, completed: false, daysCompleted: [] });
      } else if (onboarding.seven_day_challenge_completed) {
        setProgress(null); // Hide if completed
      } else {
        // Calculate days with activity
        const { data: checkins } = await supabase
          .from('daily_checkins')
          .select('checkin_date')
          .eq('user_id', session.user.id)
          .order('checkin_date', { ascending: true })
          .limit(7);

        const uniqueDays = [...new Set(checkins?.map(c => c.checkin_date) || [])];
        setProgress({
          day: onboarding.day_of_journey || 1,
          completed: uniqueDays.length >= 7,
          daysCompleted: uniqueDays.map((_, i) => i + 1)
        });

        // Check if just completed
        if (uniqueDays.length >= 7 && !onboarding.seven_day_challenge_completed) {
          await supabase
            .from('onboarding_progress')
            .update({ seven_day_challenge_completed: true })
            .eq('user_id', session.user.id);

          // Award bonus points
          const { data: streak } = await supabase
            .from('user_streaks')
            .select('total_points')
            .eq('user_id', session.user.id)
            .single();

          if (streak) {
            await supabase
              .from('user_streaks')
              .update({ total_points: (streak.total_points || 0) + 100 })
              .eq('user_id', session.user.id);
          }

          confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.5 },
            colors: ['#FFD700', '#FFA500', '#FF6B9D', '#6BCB77']
          });
          toast.success("🏆 7-Day Challenge Complete! +100 bonus points!", { duration: 5000 });
        }
      }
      setIsLoading(false);
    };

    fetchProgress();
  }, []);

  if (isLoading || !progress) return null;

  const progressPercent = (progress.daysCompleted.length / 7) * 100;

  return (
    <div className="bg-gradient-to-br from-primary/20 via-accent/10 to-sunshine/20 rounded-2xl p-4 shadow-card border border-primary/30">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">7-Day Challenge</h3>
            <p className="text-xs text-muted-foreground">Build a healthy routine for {babyName || "baby"}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-accent/20 px-2 py-1 rounded-full">
          <Flame className="w-4 h-4 text-accent" />
          <span className="text-xs font-bold text-foreground">{progress.daysCompleted.length}/7</span>
        </div>
      </div>

      <Progress value={progressPercent} className="h-2 mb-3" />

      <div className="flex justify-between mb-2">
        {[1, 2, 3, 4, 5, 6, 7].map((day) => (
          <div
            key={day}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              progress.daysCompleted.includes(day)
                ? "bg-mint text-white"
                : day === progress.day
                ? "bg-primary/20 text-primary border-2 border-primary"
                : "bg-muted/50 text-muted-foreground"
            }`}
          >
            {progress.daysCompleted.includes(day) ? <Check className="w-4 h-4" /> : day}
          </div>
        ))}
      </div>

      <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
        <span>Complete a check-in each day</span>
        <ArrowRight className="w-3 h-3" />
        <span className="text-primary font-medium">+100 points</span>
      </p>
    </div>
  );
};

export default SevenDayChallengeCard;
