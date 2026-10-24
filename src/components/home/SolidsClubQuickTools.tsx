import React from "react";
import { Link } from "react-router-dom";
import { Refrigerator, Sparkles, ArrowUpRight } from "lucide-react";

import bannerWeeklyPlanner from "@/assets/tools/weekly-planner.webp";
import bannerFoodsTried from "@/assets/tools/foods-tried.webp";
import bannerFreezerPrep from "@/assets/tools/freezer-prep.webp";
import bannerAllergenTracker from "@/assets/tools/allergen-tracker.webp";
import bannerIngredientSwap from "@/assets/tools/ingredient-swap.webp";

interface ToolItem {
  id: string;
  title: string;
  desc: string;
  badge: string;
  link: string;
  image?: string;
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
      // Pending user image
    },
  ];

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-3.5 px-1">
        <div>
          <h2 className="text-xl md:text-2xl font-serif font-bold text-forest tracking-tight">
            Parent Tools for Everyday Ease
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Smart guides, safety protocols, and daily kitchen companions
          </p>
        </div>
        <span className="text-[11px] font-semibold text-stone-500 bg-stone-100 px-2.5 py-1 rounded-full">
          6 Tools
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
        {tools.map((t) => (
          <Link
            key={t.id}
            to={t.link}
            className="block group rounded-[22px] overflow-hidden border border-[#EBE8DF] shadow-[0_4px_16px_-4px_rgba(0,0,0,0.05)] hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E5E3A]/40"
          >
            {t.image ? (
              <div className="relative w-full aspect-[16/9] overflow-hidden bg-stone-100">
                <img
                  src={t.image}
                  alt={t.title}
                  className="w-full h-full object-cover group-hover:scale-[1.025] transition-transform duration-300"
                  loading="lazy"
                />
              </div>
            ) : (
              /* Botanical matching card for Pantry Helper until user uploads banner */
              <div className="relative w-full aspect-[16/9] p-5 flex flex-col justify-between bg-gradient-to-br from-[#FFF9EE] via-[#FCF7ED] to-[#F5ECE0] overflow-hidden">
                {/* Background decorative watermark */}
                <div className="absolute -right-4 -bottom-4 w-32 h-32 rounded-full bg-[#1E5E3A]/5 flex items-center justify-center pointer-events-none">
                  <Refrigerator className="w-20 h-20 text-[#1E5E3A]/15" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/80 border border-[#E5DECF] text-[#8C6D23] shadow-xs">
                      <Sparkles className="w-3 h-3 text-[#B7791F]" />
                      {t.badge}
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-forest group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>
                  <h3 className="font-serif font-bold text-2xl text-stone-900 group-hover:text-forest transition-colors leading-tight">
                    {t.title}
                  </h3>
                </div>

                <div className="relative z-10">
                  <p className="text-xs text-stone-600 font-medium">
                    {t.desc}
                  </p>
                  <span className="inline-block text-[11px] font-semibold text-[#1E5E3A] mt-2 underline underline-offset-2">
                    Explore tool →
                  </span>
                </div>
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
};

export default SolidsClubQuickTools;
