import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { forwardRef } from "react";

interface AgeCategoryCirclesProps {
  babyAgeMonths: number;
}

const ageCategories = [
  { 
    label: "6-9 months", 
    ageGroup: "6-9 months", 
    emoji: "🥣", 
    minAge: 6, 
    maxAge: 9,
    color: "from-peach to-peach/70",
    ringColor: "ring-peach",
    textColor: "text-peach-foreground"
  },
  { 
    label: "9-12 months", 
    ageGroup: "9-12 months", 
    emoji: "🥕", 
    minAge: 9, 
    maxAge: 12,
    color: "from-accent to-accent/70",
    ringColor: "ring-accent",
    textColor: "text-accent-foreground"
  },
  { 
    label: "12-18 months", 
    ageGroup: "12-18 months", 
    emoji: "🍝", 
    minAge: 12, 
    maxAge: 18,
    color: "from-mint to-mint/70",
    ringColor: "ring-mint",
    textColor: "text-foreground"
  },
  { 
    label: "18-24 months", 
    ageGroup: "18-24 months", 
    emoji: "🥗", 
    minAge: 18, 
    maxAge: 24,
    color: "from-primary to-primary/70",
    ringColor: "ring-primary",
    textColor: "text-primary"
  },
  { 
    label: "24+ months", 
    ageGroup: "24+ months", 
    emoji: "🍱", 
    minAge: 24, 
    maxAge: 999,
    color: "from-amber-400 to-amber-300",
    ringColor: "ring-amber-400",
    textColor: "text-amber-600"
  },
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
      if (babyAgeMonths >= 24) return "24+ months";
      if (babyAgeMonths >= 18) return "18-24 months";
      return "6-9 months";
    };

    const activeAgeGroup = getActiveCategory();

    return (
      <div ref={ref} className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Recipes by Age</h2>
        <div className="flex items-center gap-4 overflow-x-auto overflow-y-visible py-3 scrollbar-hide">
          {ageCategories.map((category, index) => {
            const isActive = category.ageGroup === activeAgeGroup;
            return (
              <motion.button
                key={category.ageGroup}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
                whileHover={{ scale: 1.08, y: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCategoryClick(category.ageGroup)}
                className={`flex flex-col items-center gap-2 min-w-[80px] group transition-all ${
                  isActive ? "scale-105" : ""
                }`}
              >
                {/* Circle container with ring */}
                <div className="relative">
                  {/* Active pulse animation */}
                  {isActive && (
                    <motion.div
                      className={`absolute inset-0 rounded-full bg-gradient-to-br ${category.color} opacity-40`}
                      animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}
                  
                  {/* Ring */}
                  <div
                    className={`rounded-full p-1 transition-all ring-2 ${category.ringColor} ring-offset-2 ring-offset-background ${
                      isActive ? "ring-offset-4" : ""
                    }`}
                  >
                    {/* Inner circle with gradient */}
                    <motion.div
                      className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg overflow-hidden bg-gradient-to-br ${category.color}`}
                      whileHover={{ 
                        boxShadow: "0 8px 24px -4px hsla(var(--primary), 0.3)"
                      }}
                    >
                      <span className="text-2xl leading-none drop-shadow-sm">{category.emoji}</span>
                    </motion.div>
                  </div>
                </div>
                
                {/* Label */}
                <span
                  className={`text-[11px] font-semibold transition-colors text-center leading-tight ${
                    isActive 
                      ? category.textColor 
                      : "text-muted-foreground group-hover:text-foreground"
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
