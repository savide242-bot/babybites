import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { forwardRef } from "react";

interface AgeCategoryCirclesProps {
  babyAgeMonths: number;
}

const ageCategories = [
  { label: "6-9 mo", ageGroup: "6-9 months", emoji: "🥣", minAge: 6, maxAge: 9 },
  { label: "9-12 mo", ageGroup: "9-12 months", emoji: "🥕", minAge: 9, maxAge: 12 },
  { label: "12-18 mo", ageGroup: "12-18 months", emoji: "🍝", minAge: 12, maxAge: 18 },
  { label: "18-24 mo", ageGroup: "18-24 months", emoji: "🥗", minAge: 18, maxAge: 24 },
];

const AgeCategoryCircles = forwardRef<HTMLDivElement, AgeCategoryCirclesProps>(
  ({ babyAgeMonths }, ref) => {
    const navigate = useNavigate();

    const handleCategoryClick = (ageGroup: string) => {
      navigate(`/recipes?age=${encodeURIComponent(ageGroup)}`);
    };

    // Determine which category is active based on baby's age
    const getActiveCategory = () => {
      for (const cat of ageCategories) {
        if (babyAgeMonths >= cat.minAge && babyAgeMonths < cat.maxAge) {
          return cat.ageGroup;
        }
      }
      if (babyAgeMonths >= 18) return "18-24 months";
      return "6-9 months";
    };

    const activeAgeGroup = getActiveCategory();

    return (
      <div ref={ref} className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Recipes by Age</h2>
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {ageCategories.map((category, index) => {
            const isActive = category.ageGroup === activeAgeGroup;
            return (
              <motion.button
                key={category.ageGroup}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleCategoryClick(category.ageGroup)}
                className={`flex flex-col items-center gap-1.5 min-w-[72px] group transition-all ${
                  isActive ? "scale-105" : ""
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-soft overflow-hidden ${
                    isActive
                      ? "bg-primary/20 ring-2 ring-primary ring-offset-2 ring-offset-background"
                      : "bg-muted/50 group-hover:bg-muted group-hover:scale-105"
                  }`}
                >
                  <span className="text-xl leading-none">{category.emoji}</span>
                </div>
                <span
                  className={`text-xs font-medium transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  }`}
                >
                  {category.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  }
);

AgeCategoryCircles.displayName = "AgeCategoryCircles";

export default AgeCategoryCircles;
