import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Sparkles, Leaf, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface WeekTemplatesModalProps {
  open: boolean;
  onClose: () => void;
  onApplyTemplate: (template: WeekTemplate) => void;
}

export interface WeekTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  meals: {
    [day: string]: {
      breakfast?: string;
      lunch?: string;
      dinner?: string;
      snack?: string;
    };
  };
}

const weekTemplates: WeekTemplate[] = [
  {
    id: "balanced",
    name: "🌟 Balanced Week",
    description: "Perfect nutritional balance for growing babies with variety every day",
    icon: "🌟",
    color: "from-purple-500 to-pink-500",
    meals: {
      Monday: { breakfast: "banana-pancakes", lunch: "quinoa-veggies", dinner: "turkey-meatballs", snack: "yogurt-berries" },
      Tuesday: { breakfast: "blueberry-oatmeal", lunch: "chicken-patties", dinner: "pasta-tomato", snack: "avocado-puree" },
      Wednesday: { breakfast: "egg-muffins", lunch: "lentil-soup", dinner: "salmon-sweet-potato", snack: "mango-puree" },
      Thursday: { breakfast: "rice-banana", lunch: "broccoli-tots", dinner: "beef-stew", snack: "apple-sauce" },
      Friday: { breakfast: "banana-pancakes", lunch: "spinach-quesadilla", dinner: "chicken-patties", snack: "pea-puree" },
      Saturday: { breakfast: "blueberry-oatmeal", lunch: "turkey-meatballs", dinner: "vegetable-risotto", snack: "yogurt-berries" },
      Sunday: { breakfast: "egg-muffins", lunch: "salmon-sweet-potato", dinner: "lentil-soup", snack: "butternut-squash" }
    }
  },
  {
    id: "quick",
    name: "⚡ Quick Meals Week",
    description: "All recipes under 20 minutes - perfect for busy parents",
    icon: "⚡",
    color: "from-amber-500 to-orange-500",
    meals: {
      Monday: { breakfast: "rice-banana", lunch: "avocado-puree", dinner: "pasta-tomato", snack: "mango-puree" },
      Tuesday: { breakfast: "yogurt-berries", lunch: "pea-puree", dinner: "egg-muffins", snack: "apple-sauce" },
      Wednesday: { breakfast: "blueberry-oatmeal", lunch: "butternut-squash", dinner: "quinoa-veggies", snack: "banana-pancakes" },
      Thursday: { breakfast: "rice-banana", lunch: "sweet-potato-carrot", dinner: "spinach-quesadilla", snack: "mango-puree" },
      Friday: { breakfast: "yogurt-berries", lunch: "avocado-puree", dinner: "pasta-tomato", snack: "pea-puree" },
      Saturday: { breakfast: "blueberry-oatmeal", lunch: "butternut-squash", dinner: "egg-muffins", snack: "apple-sauce" },
      Sunday: { breakfast: "banana-pancakes", lunch: "quinoa-veggies", dinner: "sweet-potato-carrot", snack: "yogurt-berries" }
    }
  },
  {
    id: "veggie",
    name: "🥬 Veggie Explorer",
    description: "Introduce new vegetables every day - expand baby's palate",
    icon: "🥬",
    color: "from-green-500 to-emerald-500",
    meals: {
      Monday: { breakfast: "banana-pancakes", lunch: "pea-puree", dinner: "quinoa-veggies", snack: "avocado-puree" },
      Tuesday: { breakfast: "blueberry-oatmeal", lunch: "sweet-potato-carrot", dinner: "broccoli-tots", snack: "butternut-squash" },
      Wednesday: { breakfast: "rice-banana", lunch: "spinach-quesadilla", dinner: "lentil-soup", snack: "pea-puree" },
      Thursday: { breakfast: "egg-muffins", lunch: "butternut-squash", dinner: "vegetable-risotto", snack: "avocado-puree" },
      Friday: { breakfast: "banana-pancakes", lunch: "broccoli-tots", dinner: "quinoa-veggies", snack: "sweet-potato-carrot" },
      Saturday: { breakfast: "blueberry-oatmeal", lunch: "spinach-quesadilla", dinner: "lentil-soup", snack: "butternut-squash" },
      Sunday: { breakfast: "egg-muffins", lunch: "pea-puree", dinner: "vegetable-risotto", snack: "avocado-puree" }
    }
  },
  {
    id: "protein",
    name: "💪 Protein Power",
    description: "High-protein meals for active, growing babies",
    icon: "💪",
    color: "from-red-500 to-rose-500",
    meals: {
      Monday: { breakfast: "egg-muffins", lunch: "chicken-patties", dinner: "salmon-sweet-potato", snack: "yogurt-berries" },
      Tuesday: { breakfast: "banana-pancakes", lunch: "turkey-meatballs", dinner: "beef-stew", snack: "lentil-soup" },
      Wednesday: { breakfast: "egg-muffins", lunch: "salmon-sweet-potato", dinner: "chicken-patties", snack: "yogurt-berries" },
      Thursday: { breakfast: "blueberry-oatmeal", lunch: "beef-stew", dinner: "turkey-meatballs", snack: "egg-muffins" },
      Friday: { breakfast: "egg-muffins", lunch: "chicken-patties", dinner: "lentil-soup", snack: "yogurt-berries" },
      Saturday: { breakfast: "banana-pancakes", lunch: "salmon-sweet-potato", dinner: "beef-stew", snack: "turkey-meatballs" },
      Sunday: { breakfast: "egg-muffins", lunch: "turkey-meatballs", dinner: "chicken-patties", snack: "yogurt-berries" }
    }
  }
];

export const WeekTemplatesModal = ({ open, onClose, onApplyTemplate }: WeekTemplatesModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-primary" />
            Week Templates
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">
            Choose a pre-made meal plan template to quickly fill your week with balanced, delicious meals.
          </p>

          {weekTemplates.map(template => (
            <Card
              key={template.id}
              className={cn(
                "cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg",
                "border-2 hover:border-primary/50"
              )}
              onClick={() => {
                onApplyTemplate(template);
                onClose();
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-gradient-to-br",
                    template.color
                  )}>
                    {template.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{template.name}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{template.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        7 days
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        28 meals
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { weekTemplates };
