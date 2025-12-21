import { Link } from "react-router-dom";
import { Calendar, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface TodaysMealsPreviewProps {
  meals: {
    mealType: string;
    recipeTitle: string;
    recipeId: string;
    prepared: boolean;
  }[];
}

const mealEmojis: { [key: string]: string } = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎'
};

const TodaysMealsPreview = ({ meals }: TodaysMealsPreviewProps) => {
  if (meals.length === 0) {
    return (
      <Card className="border-2 border-dashed border-muted">
        <CardContent className="p-4 text-center">
          <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No meals planned for today</p>
          <Link to="/planner">
            <Button variant="link" size="sm" className="text-primary">
              Plan your meals <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const completedCount = meals.filter(m => m.prepared).length;

  return (
    <Card className="border border-border/50 bg-card shadow-card">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-secondary" />
            <span className="text-sm font-medium text-foreground">Today's Meals</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {completedCount}/{meals.length} done
          </span>
        </div>

        <div className="space-y-2">
          {meals.slice(0, 3).map((meal, idx) => (
            <Link 
              key={idx} 
              to={`/recipe/${meal.recipeId}`}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <span className="text-lg">{mealEmojis[meal.mealType] || '🍽️'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground capitalize">{meal.mealType}</p>
                <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                  {meal.recipeTitle}
                </p>
              </div>
              {meal.prepared && (
                <CheckCircle2 className="w-4 h-4 text-mint flex-shrink-0" />
              )}
            </Link>
          ))}
        </div>

        {meals.length > 3 && (
          <Link to="/planner">
            <Button variant="ghost" size="sm" className="w-full mt-2 text-muted-foreground">
              +{meals.length - 3} more meals
            </Button>
          </Link>
        )}

        <Link to="/planner">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-2 border-secondary text-secondary hover:bg-secondary/10"
          >
            View Full Plan
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default TodaysMealsPreview;
