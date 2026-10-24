import React from "react";
import { Link } from "react-router-dom";
import { Snowflake, Refrigerator, Calendar, ShieldCheck, Heart, Repeat, Sparkles } from "lucide-react";

export const SolidsClubQuickTools: React.FC = () => {
  const tools = [
    {
      title: "Weekly Planner",
      desc: "7-day customized baby meal plan",
      icon: Calendar,
      color: "bg-[#EAF5EE] text-[#1E5E3A]",
      link: "/planner",
      badge: "Smart",
    },
    {
      title: "100 Foods Tried",
      desc: "Track first flavors & textures",
      icon: Heart,
      color: "bg-[#FDF2F4] text-[#C53030]",
      link: "/foods-tried",
      badge: "Progress",
    },
    {
      title: "Freezer Prep",
      desc: "Stash tracker & safety rules",
      icon: Snowflake,
      color: "bg-[#E8F4FD] text-[#2B6CB0]",
      link: "/freezer",
      badge: "Batch",
    },
    {
      title: "Allergen Tracker",
      desc: "Top 9 allergens safety guide",
      icon: ShieldCheck,
      color: "bg-[#F3F6F3] text-[#1E5E3A]",
      link: "/allergens",
      badge: "Pediatric",
    },
    {
      title: "Pantry Helper",
      desc: "Cook with what's in your fridge",
      icon: Refrigerator,
      color: "bg-[#FFF6E5] text-[#B7791F]",
      link: "/pantry",
      badge: "Interactive",
    },
    {
      title: "Ingredient Swap",
      desc: "Egg, dairy & flour substitutes",
      icon: Repeat,
      color: "bg-[#FAF5FF] text-[#6B46C1]",
      link: "/ingredient-swap",
      badge: "Safe Ratios",
    },
  ];

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-xl md:text-2xl font-serif font-bold text-forest tracking-tight">
          Parent Tools for Everyday Ease
        </h2>
        <span className="text-xs font-semibold text-gray-400">
          6 Core Tools
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
        {tools.map((t, idx) => {
          const Icon = t.icon;
          return (
            <Link
              key={idx}
              to={t.link}
              className="p-3.5 sm:p-4 rounded-[24px] bg-white border border-[#EBE8DF] shadow-[0_4px_16px_-4px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-200 flex flex-col justify-between group hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between mb-2.5">
                <div className={`w-9 h-9 rounded-2xl ${t.color} flex items-center justify-center shadow-xs`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#FAF9F5] border border-[#EBE8DF] text-gray-500">
                  {t.badge}
                </span>
              </div>
              <div>
                <h3 className="font-serif font-bold text-gray-900 text-xs sm:text-sm group-hover:text-forest transition-colors">
                  {t.title}
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1 leading-snug">
                  {t.desc}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default SolidsClubQuickTools;
