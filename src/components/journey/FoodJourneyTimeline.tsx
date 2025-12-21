import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Share2, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";

interface FoodFirst {
  id: string;
  food_name: string;
  category: string;
  reaction: string;
  first_tried_at: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  fruit: "bg-accent/20 text-accent border-accent/30",
  vegetable: "bg-mint/20 text-mint border-mint/30",
  grain: "bg-sunshine/20 text-sunshine-foreground border-sunshine/30",
  protein: "bg-primary/20 text-primary border-primary/30",
  dairy: "bg-lavender/20 text-lavender-foreground border-lavender/30",
  other: "bg-muted text-muted-foreground border-border"
};

const CATEGORY_EMOJIS: Record<string, string> = {
  fruit: "🍎",
  vegetable: "🥕",
  grain: "🍚",
  protein: "🍗",
  dairy: "🧀",
  other: "🍽️"
};

interface FoodJourneyTimelineProps {
  compact?: boolean;
  babyName?: string;
}

const FoodJourneyTimeline = ({ compact = false, babyName }: FoodJourneyTimelineProps) => {
  const [foodFirsts, setFoodFirsts] = useState<FoodFirst[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalFoods, setTotalFoods] = useState(0);

  useEffect(() => {
    const fetchFoodFirsts = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      // Get from food_firsts table
      const { data: firsts } = await supabase
        .from('food_firsts')
        .select('*')
        .eq('user_id', session.user.id)
        .order('first_tried_at', { ascending: false })
        .limit(compact ? 5 : 50);

      // Also get from food_diary for legacy data
      const { data: diary } = await supabase
        .from('food_diary')
        .select('*')
        .eq('user_id', session.user.id)
        .order('tried_at', { ascending: false });

      // Merge and dedupe
      const allFoods: FoodFirst[] = [];
      const seenFoods = new Set<string>();

      (firsts || []).forEach(f => {
        if (!seenFoods.has(f.food_name.toLowerCase())) {
          seenFoods.add(f.food_name.toLowerCase());
          allFoods.push(f);
        }
      });

      (diary || []).forEach(d => {
        if (!seenFoods.has(d.food_name.toLowerCase())) {
          seenFoods.add(d.food_name.toLowerCase());
          allFoods.push({
            id: d.id,
            food_name: d.food_name,
            category: 'other',
            reaction: d.reaction,
            first_tried_at: d.tried_at
          });
        }
      });

      setFoodFirsts(allFoods.slice(0, compact ? 5 : 50));
      setTotalFoods(allFoods.length);
      setIsLoading(false);
    };

    fetchFoodFirsts();
  }, [compact]);

  if (isLoading) return null;

  if (foodFirsts.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Food Journey</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Start tracking foods and watch {babyName || "baby"}'s journey grow! 🌱
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <Link to="/diary" className="block">
        <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50 hover:border-primary/30 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Food Journey</h3>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <span className="text-xs">{totalFoods} foods explored</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {foodFirsts.map((food) => (
              <span
                key={food.id}
                className={`text-xs px-2 py-1 rounded-full border ${CATEGORY_COLORS[food.category] || CATEGORY_COLORS.other}`}
              >
                {CATEGORY_EMOJIS[food.category] || "🍽️"} {food.food_name}
              </span>
            ))}
            {totalFoods > 5 && (
              <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                +{totalFoods - 5} more
              </span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-4 shadow-card border border-border/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            {babyName || "Baby"}'s Food Journey
          </h3>
        </div>
        <button className="flex items-center gap-1 text-xs text-primary">
          <Share2 className="w-4 h-4" />
          Share
        </button>
      </div>
      
      <div className="text-center mb-4">
        <p className="text-3xl font-bold text-foreground">{totalFoods}</p>
        <p className="text-sm text-muted-foreground">foods explored! 🎉</p>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {foodFirsts.map((food) => (
          <div
            key={food.id}
            className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{CATEGORY_EMOJIS[food.category] || "🍽️"}</span>
              <div>
                <p className="text-sm font-medium text-foreground">{food.food_name}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(food.first_tried_at), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
            <span
              className={`text-xs px-2 py-1 rounded-full border ${CATEGORY_COLORS[food.category] || CATEGORY_COLORS.other}`}
            >
              {food.reaction === 'loved' ? '😍' : food.reaction === 'liked' ? '😊' : food.reaction === 'neutral' ? '😐' : '😤'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FoodJourneyTimeline;
