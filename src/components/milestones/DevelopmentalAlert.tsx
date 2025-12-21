import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, Baby, Utensils, AlertCircle, ChevronRight, X,
  Apple, Beef, Milk, Wheat
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DevelopmentalAlertProps {
  babyAgeMonths: number;
  babyName?: string;
  onDismiss?: () => void;
}

interface MilestoneData {
  title: string;
  description: string;
  foods: string[];
  tips: string[];
  icon: string;
}

const milestoneData: Record<number, MilestoneData> = {
  6: {
    title: "🎉 Ready for Solids!",
    description: "Your baby is ready to start exploring solid foods! Begin with single-ingredient purees.",
    foods: ["Rice cereal", "Sweet potato puree", "Avocado mash", "Banana puree", "Carrot puree"],
    tips: [
      "Start with 1-2 teaspoons once daily",
      "Wait 3-5 days between new foods",
      "Watch for allergic reactions",
      "Breast milk/formula is still the main nutrition"
    ],
    icon: "🥣"
  },
  7: {
    title: "Texture Explorer",
    description: "Time to introduce slightly thicker purees and new protein sources!",
    foods: ["Chicken puree", "Lentil puree", "Pea puree", "Apple sauce", "Pear puree"],
    tips: [
      "Gradually thicken puree consistency",
      "Introduce iron-rich foods",
      "Offer 2-3 meals per day",
      "Let baby explore with hands"
    ],
    icon: "🍗"
  },
  8: {
    title: "Pincer Grasp Developing",
    description: "Your baby is developing fine motor skills - perfect for soft finger foods!",
    foods: ["Soft cooked pasta", "Ripe banana pieces", "Soft cheese cubes", "Steamed broccoli florets", "Scrambled eggs"],
    tips: [
      "Introduce soft finger foods",
      "Cut foods into baby-safe sizes",
      "Supervise closely during meals",
      "Encourage self-feeding"
    ],
    icon: "🤏"
  },
  9: {
    title: "Flavor Adventurer",
    description: "Great time to introduce more complex flavors and combination meals!",
    foods: ["Fish (salmon, cod)", "Hummus", "Quinoa", "Berries", "Greek yogurt"],
    tips: [
      "Combine 2-3 ingredients together",
      "Introduce mild herbs and spices",
      "Offer water in a sippy cup",
      "3 meals + 1-2 snacks daily"
    ],
    icon: "🐟"
  },
  10: {
    title: "Independent Eater",
    description: "Your baby wants to feed themselves more - embrace the mess!",
    foods: ["Toast strips", "Omelette strips", "Soft meatballs", "Steamed vegetables", "Cottage cheese"],
    tips: [
      "Offer fork-mashable foods",
      "Let baby practice with a spoon",
      "Family meals are important",
      "Variety over quantity"
    ],
    icon: "🥄"
  },
  11: {
    title: "Almost Toddler!",
    description: "Most table foods are now suitable - modified for safety.",
    foods: ["Pasta with sauce", "Soft sandwiches", "Pancakes", "Soup", "Rice dishes"],
    tips: [
      "Offer modified family meals",
      "Introduce new textures",
      "Encourage drinking from open cup",
      "Don't worry about picky phases"
    ],
    icon: "🍝"
  },
  12: {
    title: "🎂 Happy First Birthday!",
    description: "Your baby can now eat most family foods! Time for whole milk.",
    foods: ["Whole milk", "Honey (now safe!)", "Whole eggs", "Nut butters", "Most family foods"],
    tips: [
      "Transition to whole milk",
      "Honey is now safe to introduce",
      "Continue offering variety",
      "3 meals + 2 snacks is ideal"
    ],
    icon: "🎂"
  },
};

export const DevelopmentalAlert = ({ babyAgeMonths, babyName, onDismiss }: DevelopmentalAlertProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasViewedThisMonth, setHasViewedThisMonth] = useState(false);

  const milestone = milestoneData[babyAgeMonths];

  useEffect(() => {
    checkIfViewed();
  }, [babyAgeMonths]);

  const checkIfViewed = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !milestone) return;

    const { data } = await supabase
      .from('milestone_alerts_viewed')
      .select('id')
      .eq('user_id', user.id)
      .eq('milestone_month', babyAgeMonths)
      .maybeSingle();

    setHasViewedThisMonth(!!data);
    setIsVisible(!data && !!milestone);
  };

  const markAsViewed = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('milestone_alerts_viewed').insert({
      user_id: user.id,
      milestone_month: babyAgeMonths,
    });

    setIsVisible(false);
    setHasViewedThisMonth(true);
    onDismiss?.();
  };

  if (!isVisible || !milestone) return null;

  return (
    <Card className="p-5 border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-secondary/5 to-transparent animate-in slide-in-from-top-4 shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{milestone.icon}</div>
          <div>
            <Badge className="mb-1 bg-primary/20 text-primary border-0">
              {babyAgeMonths} months milestone
            </Badge>
            <h3 className="text-lg font-bold">{milestone.title}</h3>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={markAsViewed} className="shrink-0">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <p className="text-muted-foreground mb-4">
        {babyName ? milestone.description.replace("Your baby", babyName) : milestone.description}
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Foods to introduce */}
        <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
          <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
            <Apple className="w-4 h-4" />
            Foods to Introduce
          </h4>
          <ul className="space-y-1.5">
            {milestone.foods.map((food, i) => (
              <li key={i} className="text-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                {food}
              </li>
            ))}
          </ul>
        </div>

        {/* Tips */}
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
          <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Tips for Success
          </h4>
          <ul className="space-y-1.5">
            {milestone.tips.map((tip, i) => (
              <li key={i} className="text-sm flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Button onClick={markAsViewed} className="w-full mt-4 gap-2">
        Got it! <ChevronRight className="w-4 h-4" />
      </Button>
    </Card>
  );
};
