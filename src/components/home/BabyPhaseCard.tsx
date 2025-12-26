import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Baby, Sparkles, ChevronRight, Utensils, Cookie, Apple, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BabyPhaseCardProps {
  babyName: string;
  babyAgeMonths: number;
}

interface Phase {
  id: number;
  name: string;
  ageRange: string;
  minMonth: number;
  maxMonth: number;
  icon: typeof Baby;
  color: string;
  bgColor: string;
  description: string;
  tips: string[];
}

const phases: Phase[] = [
  {
    id: 1,
    name: "First Foods",
    ageRange: "6-7 months",
    minMonth: 6,
    maxMonth: 7,
    icon: Baby,
    color: "text-primary",
    bgColor: "bg-primary/15",
    description: "Introducing single-ingredient purees",
    tips: ["Start with iron-rich foods", "One new food every 3 days", "Watch for allergies"]
  },
  {
    id: 2,
    name: "Exploring Textures",
    ageRange: "8-9 months",
    minMonth: 8,
    maxMonth: 9,
    icon: Utensils,
    color: "text-secondary",
    bgColor: "bg-secondary/15",
    description: "Soft finger foods and mashed textures",
    tips: ["Introduce soft finger foods", "Offer variety of textures", "Let baby self-feed"]
  },
  {
    id: 3,
    name: "Variety Builder",
    ageRange: "10-12 months",
    minMonth: 10,
    maxMonth: 12,
    icon: Apple,
    color: "text-mint",
    bgColor: "bg-mint/15",
    description: "Expanding flavors and combinations",
    tips: ["Mix multiple ingredients", "Introduce mild spices", "Encourage chewing"]
  },
  {
    id: 4,
    name: "Family Meals",
    ageRange: "12+ months",
    minMonth: 12,
    maxMonth: 24,
    icon: Users,
    color: "text-accent",
    bgColor: "bg-accent/15",
    description: "Eating with the family",
    tips: ["Join family meals", "Self-feeding skills", "Balanced nutrition"]
  }
];

const BabyPhaseCard = ({ babyName, babyAgeMonths }: BabyPhaseCardProps) => {
  // Determine current phase
  const getCurrentPhase = () => {
    if (babyAgeMonths < 8) return phases[0];
    if (babyAgeMonths < 10) return phases[1];
    if (babyAgeMonths < 12) return phases[2];
    return phases[3];
  };

  const currentPhase = getCurrentPhase();
  const PhaseIcon = currentPhase.icon;

  // Calculate progress within current phase
  const calculateProgress = () => {
    const monthsInPhase = babyAgeMonths - currentPhase.minMonth;
    const phaseDuration = currentPhase.maxMonth - currentPhase.minMonth;
    const progress = Math.min(100, Math.max(0, (monthsInPhase / phaseDuration) * 100));
    return Math.round(progress);
  };

  const progress = calculateProgress();
  const nextPhase = phases[Math.min(currentPhase.id, phases.length - 1)];
  const isLastPhase = currentPhase.id === phases.length;

  return (
    <Card className={cn(
      "p-4 border-2 transition-all",
      currentPhase.bgColor.replace("/15", "/10"),
      "border-" + currentPhase.color.replace("text-", "") + "/20"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center", currentPhase.bgColor)}>
            <PhaseIcon className={cn("w-5 h-5", currentPhase.color)} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Phase {currentPhase.id}
              </span>
              <Sparkles className="w-3 h-3 text-accent" />
            </div>
            <h3 className="font-bold text-foreground">{currentPhase.name}</h3>
          </div>
        </div>
        <Link 
          to="/recipes" 
          className={cn(
            "flex items-center gap-1 text-xs font-medium transition-colors",
            currentPhase.color, "hover:opacity-80"
          )}
        >
          Recipes
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-3">
        {babyName ? `${babyName} is ` : "Your baby is "}
        {currentPhase.description.toLowerCase()}
      </p>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground">{currentPhase.ageRange}</span>
          <span className={cn("text-xs font-semibold", currentPhase.color)}>{progress}%</span>
        </div>
        <Progress 
          value={progress} 
          className="h-2"
        />
      </div>

      {/* Tips */}
      <div className="flex flex-wrap gap-1.5">
        {currentPhase.tips.slice(0, 2).map((tip, index) => (
          <span 
            key={index}
            className={cn(
              "text-xs px-2.5 py-1 rounded-full",
              currentPhase.bgColor,
              currentPhase.color
            )}
          >
            {tip}
          </span>
        ))}
      </div>

      {/* Next Phase Preview */}
      {!isLastPhase && currentPhase.id < 4 && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Next:</span>
            <span className="font-medium text-foreground">{nextPhase.name}</span>
            <span>({nextPhase.ageRange})</span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default BabyPhaseCard;
