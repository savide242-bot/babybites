import React from "react";
import { Link } from "react-router-dom";
import { Snowflake, Refrigerator, Calendar, ShieldCheck, Heart, Sparkles } from "lucide-react";

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
      title: "Pantry Helper",
      desc: "Cook with what's in your fridge",
      icon: Refrigerator,
      color: "bg-[#FFF6E5] text-[#B7791F]",
      link: "/pantry",
      badge: "Interactive",
    },
    {
      title: "Freezer Prep",
      desc: "Batch recipes to make & freeze",
      icon: Snowflake,
      color: "bg-[#E8F4FD] text-[#2B6CB0]",
      link: "/recipes?category=Snack",
      badge: "Batch",
    },
    {
      title: "Allergen Tracker",
      desc: "Top 9 allergens safety guide",
      icon: ShieldCheck,
      color: "bg-[#FDF2F4] text-[#C53030]",
      link: "/allergens",
      badge: "Pediatric",
    },
  ];

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-xl md:text-2xl font-serif font-bold text-forest tracking-tight">
          Parent Tools for Everyday Ease
        </h2>
        <Link to="/planner" className="text-xs font-semibold text-[#48B774] hover:underline">
          View all
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {tools.map((t, idx) => {
          const Icon = t.icon;
          return (
            <Link
              key={idx}
              to={t.link}
              className="p-4 rounded-[24px] bg-white border border-[#EBE8DF] shadow-[0_4px_16px_-4px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-200 flex flex-col justify-between group hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-2xl ${t.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {t.badge}
                </span>
              </div>
              <div>
                <h3 className="font-serif font-bold text-gray-900 text-sm group-hover:text-forest transition-colors">
                  {t.title}
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
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
