import React from "react";
import { Link } from "react-router-dom";

import bannerWeeklyPlanner from "@/assets/tools/weekly-planner.webp";
import bannerFoodsTried from "@/assets/tools/foods-tried.webp";
import bannerFreezerPrep from "@/assets/tools/freezer-prep.webp";
import bannerAllergenTracker from "@/assets/tools/allergen-tracker.webp";
import bannerIngredientSwap from "@/assets/tools/ingredient-swap.webp";
import bannerPantryHelper from "@/assets/tools/pantry-helper.webp";

interface ToolItem {
  id: string;
  title: string;
  desc: string;
  badge: string;
  link: string;
  image: string;
}

export const SolidsClubQuickTools: React.FC = () => {
  const tools: ToolItem[] = [
    {
      id: "weekly-planner",
      title: "Weekly Planner",
      desc: "7-day customized baby meal plan",
      badge: "Smart",
      link: "/planner",
      image: bannerWeeklyPlanner,
    },
    {
      id: "foods-tried",
      title: "100 Foods Tried",
      desc: "Track first flavors & textures",
      badge: "Progress",
      link: "/foods-tried",
      image: bannerFoodsTried,
    },
    {
      id: "freezer-prep",
      title: "Freezer Prep",
      desc: "Stash tracker & safety rules",
      badge: "Batch",
      link: "/freezer",
      image: bannerFreezerPrep,
    },
    {
      id: "allergen-tracker",
      title: "Allergen Tracker",
      desc: "Top 9 allergens safety guide",
      badge: "Pediatric",
      link: "/allergens",
      image: bannerAllergenTracker,
    },
    {
      id: "ingredient-swap",
      title: "Ingredient Swap",
      desc: "Egg, dairy & flour substitutes",
      badge: "Safe Ratios",
      link: "/ingredient-swap",
      image: bannerIngredientSwap,
    },
    {
      id: "pantry-helper",
      title: "Pantry Helper",
      desc: "Cook with what's in your fridge",
      badge: "Interactive",
      link: "/pantry",
      image: bannerPantryHelper,
    },
  ];

  return (
    <section className="mb-8 sm:mb-10">
      <div className="flex items-center justify-between mb-3 px-1">
        <div>
          <h2 className="text-lg sm:text-2xl font-serif font-bold text-forest tracking-tight">
            Parent Tools for Everyday Ease
          </h2>
          <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5">
            Smart guides, safety protocols, and daily kitchen companions
          </p>
        </div>
        <span className="text-[10px] sm:text-[11px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full">
          6 Tools
        </span>
      </div>

      {/* Grid: 2 columns on mobile, 2 columns on desktop (2 by 2 side by side) */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
        {tools.map((t) => (
          <Link
            key={t.id}
            to={t.link}
            className="block group rounded-2xl sm:rounded-[22px] overflow-hidden border border-[#EBE8DF] shadow-[0_4px_14px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 sm:hover:-translate-y-1 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E5E3A]/40"
          >
            <div className="relative w-full aspect-[16/9] overflow-hidden bg-stone-100">
              <img
                src={t.image}
                alt={t.title}
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                loading="lazy"
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default SolidsClubQuickTools;
