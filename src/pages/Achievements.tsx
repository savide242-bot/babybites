import { useState } from "react";
import { useGamification, BADGES, Badge } from "@/hooks/useGamification";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Trophy, Star, Flame, Target, Calendar, Lock,
  Snowflake, ArrowLeft, Share2
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import ShareAchievementModal from "@/components/ShareAchievementModal";

const Achievements = () => {
  const { 
    streak, 
    badges, 
    completedChallenges, 
    isLoading, 
    hasBadge,
    useStreakFreeze,
    recoverStreak
  } = useGamification();

  const [shareOpen, setShareOpen] = useState(false);
  const [shareData, setShareData] = useState<{
    type: 'badge' | 'streak' | 'points' | 'challenge';
    title: string;
    value?: number | string;
    icon?: string;
  } | null>(null);

  const handleShare = (type: 'badge' | 'streak' | 'points' | 'challenge', title: string, value?: number | string, icon?: string) => {
    setShareData({ type, title, value, icon });
    setShareOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-lg mx-auto space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  const earnedBadges = badges.map(b => b.badge_id);
  const lockedBadges = BADGES.filter(b => !earnedBadges.includes(b.id));
  const unlockedBadges = BADGES.filter(b => earnedBadges.includes(b.id));

  // Milestones
  const milestones = [
    { label: "10 Check-ins", current: 0, target: 10, icon: "📊" },
    { label: "50 Recipes Viewed", current: 0, target: 50, icon: "📖" },
    { label: "30 Day Streak", current: streak?.current_streak || 0, target: 30, icon: "🔥" },
    { label: "5 Challenges Won", current: completedChallenges.length, target: 5, icon: "🏆" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border/50 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Trophy className="h-5 w-5 text-accent" />
              Achievements
            </h1>
            <p className="text-sm text-muted-foreground">Track your progress</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-3">
          <Card 
            className="p-4 text-center bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20 cursor-pointer hover:scale-105 transition-transform"
            onClick={() => handleShare('streak', 'Streak Atual', streak?.current_streak || 0, '🔥')}
          >
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-2">
              <Flame className="w-5 h-5 text-accent" />
            </div>
            <p className="text-2xl font-bold text-foreground">{streak?.current_streak || 0}</p>
            <p className="text-xs text-muted-foreground">Current Streak</p>
            <Share2 className="w-3 h-3 text-muted-foreground mx-auto mt-1" />
          </Card>
          
          <Card 
            className="p-4 text-center bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 cursor-pointer hover:scale-105 transition-transform"
            onClick={() => handleShare('points', 'Pontos Totais', streak?.total_points || 0, '⭐')}
          >
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
              <Star className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{streak?.total_points || 0}</p>
            <p className="text-xs text-muted-foreground">Total Points</p>
            <Share2 className="w-3 h-3 text-muted-foreground mx-auto mt-1" />
          </Card>
          
          <Card 
            className="p-4 text-center bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20 cursor-pointer hover:scale-105 transition-transform"
            onClick={() => handleShare('streak', 'Melhor Streak', streak?.longest_streak || 0, '🏆')}
          >
            <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-2">
              <Target className="w-5 h-5 text-secondary" />
            </div>
            <p className="text-2xl font-bold text-foreground">{streak?.longest_streak || 0}</p>
            <p className="text-xs text-muted-foreground">Best Streak</p>
            <Share2 className="w-3 h-3 text-muted-foreground mx-auto mt-1" />
          </Card>
        </div>

        {/* Streak Tools */}
        {streak && (streak.streak_freezes_available > 0 || streak.grace_period_eligible) && (
          <Card className="p-4 bg-gradient-to-r from-soft-blue/50 to-mint/30 border-soft-blue">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Snowflake className="w-4 h-4" />
              Streak Protection
            </h3>
            <div className="space-y-3">
              {streak.streak_freezes_available > 0 && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Freeze Available</p>
                    <p className="text-xs text-muted-foreground">Protect your streak for 1 day</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={useStreakFreeze}
                    className="bg-background/50"
                  >
                    ❄️ Use Freeze
                  </Button>
                </div>
              )}
              {streak.grace_period_eligible && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-accent">Streak at Risk!</p>
                    <p className="text-xs text-muted-foreground">
                      {streak.grace_period_days_missed} day(s) missed - recover now
                    </p>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={recoverStreak}
                    className="bg-accent hover:bg-accent/90"
                  >
                    🔄 Recover
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Earned Badges */}
        <Card className="p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-accent" />
            Earned Badges ({unlockedBadges.length}/{BADGES.length})
          </h3>
          {unlockedBadges.length > 0 ? (
            <div className="grid grid-cols-4 gap-3">
              {unlockedBadges.map((badge) => {
                const earned = badges.find(b => b.badge_id === badge.id);
                return (
                  <div 
                    key={badge.id} 
                    className="text-center p-2 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 border border-accent/30 cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => handleShare('badge', badge.name, undefined, badge.icon)}
                  >
                    <div className="text-2xl mb-1">{badge.icon}</div>
                    <p className="text-xs font-medium truncate">{badge.name}</p>
                    <Share2 className="w-3 h-3 text-muted-foreground mx-auto mt-1" />
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Complete activities to earn badges!
            </p>
          )}
        </Card>

        {/* Locked Badges */}
        <Card className="p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Lock className="w-4 h-4 text-muted-foreground" />
            Locked Badges
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {lockedBadges.map((badge) => (
              <div 
                key={badge.id} 
                className="text-center p-2 rounded-xl bg-muted/50 border border-border/50 opacity-60"
              >
                <div className="text-2xl mb-1 grayscale">{badge.icon}</div>
                <p className="text-xs font-medium truncate text-muted-foreground">{badge.name}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Milestones */}
        <Card className="p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Milestones
          </h3>
          <div className="space-y-4">
            {milestones.map((milestone, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm flex items-center gap-2">
                    <span>{milestone.icon}</span>
                    {milestone.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {milestone.current}/{milestone.target}
                  </span>
                </div>
                <Progress 
                  value={(milestone.current / milestone.target) * 100} 
                  className="h-2"
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Challenge History */}
        <Card className="p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-secondary" />
            Challenge History
          </h3>
          {completedChallenges.length > 0 ? (
            <div className="space-y-2">
              {completedChallenges.slice(0, 5).map((challenge) => (
                <div 
                  key={challenge.id} 
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                >
                  <div>
                    <p className="text-sm font-medium">{challenge.challenge_title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(challenge.completed_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-accent">
                    +{challenge.reward_points} pts
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Complete weekly challenges to build your history!
            </p>
          )}
        </Card>
      </div>

      {/* Share Modal */}
      {shareData && (
        <ShareAchievementModal
          isOpen={shareOpen}
          onClose={() => setShareOpen(false)}
          achievement={shareData}
        />
      )}
    </div>
  );
};

export default Achievements;
