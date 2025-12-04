import { Flame, Trophy, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useGamification, BADGES } from "@/hooks/useGamification";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const StreakWidget = () => {
  const { streak, badges, isLoading, hasBadge } = useGamification();

  if (isLoading) {
    return <Skeleton className="h-24 rounded-xl" />;
  }

  if (!streak) return null;

  return (
    <Card className="p-4 bg-gradient-to-br from-orange-500/10 via-red-500/5 to-yellow-500/10 border-orange-200/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`p-2 rounded-full bg-gradient-to-br from-orange-500 to-red-500 ${streak.current_streak > 0 ? 'animate-pulse' : ''}`}>
              <Flame className="w-6 h-6 text-white" />
            </div>
            {streak.current_streak >= 7 && (
              <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-0.5">
                <Star className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-600">
              {streak.current_streak} {streak.current_streak === 1 ? 'day' : 'days'}
            </p>
            <p className="text-xs text-muted-foreground">
              {streak.current_streak > 0 
                ? "Keep it going! 🔥" 
                : "Start your streak today!"}
            </p>
          </div>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
              <Trophy className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">
                {streak.total_points} pts
              </span>
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Your Achievements
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-lg bg-orange-500/10">
                  <p className="text-xl font-bold text-orange-600">{streak.current_streak}</p>
                  <p className="text-xs text-muted-foreground">Current Streak</p>
                </div>
                <div className="p-3 rounded-lg bg-purple-500/10">
                  <p className="text-xl font-bold text-purple-600">{streak.longest_streak}</p>
                  <p className="text-xs text-muted-foreground">Best Streak</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10">
                  <p className="text-xl font-bold text-primary">{streak.total_points}</p>
                  <p className="text-xs text-muted-foreground">Total Points</p>
                </div>
              </div>

              {/* Badges */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  Badges ({badges.length}/{BADGES.length})
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {BADGES.map((badge) => {
                    const earned = hasBadge(badge.id);
                    return (
                      <div
                        key={badge.id}
                        className={`p-3 rounded-lg border transition-all ${
                          earned 
                            ? 'bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-300' 
                            : 'bg-muted/30 border-muted opacity-50 grayscale'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">{badge.icon}</span>
                          <span className="font-medium text-sm">{badge.name}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{badge.description}</p>
                        {earned && (
                          <Badge variant="secondary" className="mt-2 text-xs bg-yellow-500/20 text-yellow-700">
                            Earned!
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Card>
  );
};

export default StreakWidget;
