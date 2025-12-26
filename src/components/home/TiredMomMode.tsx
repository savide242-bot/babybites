import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Moon, ChefHat, Lightbulb, X, Clock, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { recipes } from "@/data/recipes";

interface TiredMomModeProps {
  babyName: string;
  babyAgeMonths: number;
  onClose: () => void;
}

const TiredMomMode = ({ babyName, babyAgeMonths, onClose }: TiredMomModeProps) => {
  // Get the quickest age-appropriate recipe
  const getQuickRecipe = () => {
    let ageGroup = "6-9 months";
    if (babyAgeMonths >= 9 && babyAgeMonths < 12) ageGroup = "9-12 months";
    else if (babyAgeMonths >= 12 && babyAgeMonths < 18) ageGroup = "12-18 months";
    else if (babyAgeMonths >= 18) ageGroup = "18-24 months";

    const ageRecipes = recipes.filter(r => r.ageGroup === ageGroup);
    // Sort by prep time and get quickest
    const sorted = ageRecipes.sort((a, b) => {
      const timeA = parseInt(a.prepTime) || 30;
      const timeB = parseInt(b.prepTime) || 30;
      return timeA - timeB;
    });
    return sorted[0] || recipes[0];
  };

  const quickRecipe = getQuickRecipe();

  const tips = [
    "It's okay to serve simple foods today. Banana slices are nutritious! 🍌",
    "Your baby learns from your calmness, not perfection. 💆‍♀️",
    "Store-bought baby food is perfectly fine when you need a break. ✨",
    "Tomorrow is a new day. You're doing amazing. 💕",
    "A simple meal with love is better than a complex one with stress. 🤍",
  ];

  const randomTip = tips[Math.floor(Math.random() * tips.length)];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
    >
      <Card className="w-full max-w-md p-6 bg-gradient-to-br from-soft-blue/20 via-card to-peach/10 border-soft-blue/30 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-soft-blue/30 flex items-center justify-center">
              <Moon className="w-6 h-6 text-soft-blue-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Tired Mom Mode</h2>
              <p className="text-sm text-muted-foreground">Simplified just for you</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-soft-blue/20"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Today's Quick Recipe */}
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              One quick recipe for today
            </p>
            <Link to={`/recipe/${quickRecipe.id}`} onClick={onClose}>
              <Card className="p-4 bg-card/80 border-primary/20 hover:border-primary/40 transition-all hover:shadow-md group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <ChefHat className="w-7 h-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {quickRecipe.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{quickRecipe.prepTime}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          </div>

          {/* Today's Tip */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Gentle reminder
            </p>
            <Card className="p-4 bg-peach/20 border-peach/30">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-peach/40 flex items-center justify-center shrink-0">
                  <Lightbulb className="w-5 h-5 text-peach-foreground" />
                </div>
                <p className="text-sm text-foreground leading-relaxed pt-2">
                  {randomTip}
                </p>
              </div>
            </Card>
          </div>

          {/* Encouragement */}
          <div className="pt-2">
            <Card className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 border-none">
              <div className="flex items-center justify-center gap-2">
                <Heart className="w-4 h-4 text-primary" />
                <p className="text-sm font-medium text-center text-foreground">
                  {babyName ? `${babyName} is lucky to have you` : "You're an amazing parent"}
                </p>
                <Heart className="w-4 h-4 text-primary" />
              </div>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 rounded-xl border-muted-foreground/30"
          >
            Back to Home
          </Button>
          <Link to={`/recipe/${quickRecipe.id}`} onClick={onClose} className="flex-1">
            <Button className="w-full rounded-xl bg-primary hover:bg-primary/90">
              Cook This
            </Button>
          </Link>
        </div>
      </Card>
    </motion.div>
  );
};

export default TiredMomMode;
