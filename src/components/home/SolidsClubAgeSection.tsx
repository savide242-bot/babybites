import React from "react";
import { Link } from "react-router-dom";
import { Play } from "lucide-react";

export interface MealCardData {
  title: string;
  subtitle: string;
  ageTag: string;
  image: string;
  link: string;
  isPosterCard?: boolean;
}

interface AgeSectionProps {
  title: string;
  cards: MealCardData[];
}

export const SolidsClubAgeSection: React.FC<AgeSectionProps> = ({ title, cards }) => {
  return (
    <section className="mb-8 w-full max-w-full overflow-hidden">
      {/* Section Title in Elegant Serif Forest Green */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-forest tracking-tight">
          {title}
        </h2>
      </div>

      {/* Horizontal Carousel of Meal Cards */}
      <div className="flex gap-3.5 sm:gap-4 overflow-x-auto pb-3 sm:pb-4 pt-1 snap-x no-scrollbar scroll-smooth w-full max-w-full min-w-0">
        {cards.map((card, idx) => {
          // If it's a dedicated botanical poster card (like the uploaded 6-8m images)
          if (card.isPosterCard) {
            return (
              <div
                key={idx}
                className="flex-shrink-0 w-[240px] sm:w-[260px] snap-start rounded-[28px] bg-white border border-[#EBE8DF] shadow-[0_8px_24px_-6px_rgba(30,94,58,0.08)] overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                {/* Full poster artwork image */}
                <div className="w-full aspect-[2/3] overflow-hidden bg-[#FAF9F5] relative">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-102"
                    loading="lazy"
                  />
                </div>

                {/* Button CTA: View Recipes ▶ */}
                <div className="p-3.5 pt-2.5 bg-white">
                  <Link
                    to={card.link}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-full bg-[#48B774] hover:bg-[#3ca465] text-white text-sm font-semibold transition-all duration-200 shadow-sm active:scale-98"
                  >
                    <span>View Recipes</span>
                    <div className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center">
                      <Play className="w-3 h-3 fill-current text-gray-900 ml-0.5" />
                    </div>
                  </Link>
                </div>
              </div>
            );
          }

          // Standard circular plate card
          return (
            <div
              key={idx}
              className="flex-shrink-0 w-[240px] sm:w-[260px] snap-start rounded-[28px] bg-white border border-[#EBE8DF] shadow-[0_8px_24px_-6px_rgba(30,94,58,0.08)] overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              {/* Header info */}
              <div className="p-4 pb-2 relative">
                {/* Subtle botanical leaves background decoration */}
                <div className="absolute top-2 right-2 opacity-15 pointer-events-none select-none text-2xl">
                  🌿
                </div>

                {/* Tag pill */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3F6F3] text-forest text-xs font-semibold mb-2">
                  <span className="text-[10px]">💚</span>
                  <span>{card.ageTag}</span>
                </div>

                {/* Title in Serif font */}
                <h3 className="text-2xl font-serif font-bold text-gray-900 leading-tight">
                  {card.title}
                </h3>

                {/* Subtitle */}
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {card.subtitle}
                </p>
              </div>

              {/* Food Image in rounded plate/container */}
              <div className="px-4 py-2 flex items-center justify-center">
                <div className="w-36 h-36 rounded-full overflow-hidden shadow-md border-4 border-[#FAF9F5] bg-gray-50">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    loading="lazy"
                  />
                </div>
              </div>

              {/* Button CTA: View Recipes ▶ */}
              <div className="p-4 pt-2">
                <Link
                  to={card.link}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-full bg-[#48B774] hover:bg-[#3ca465] text-white text-sm font-semibold transition-all duration-200 shadow-sm active:scale-98"
                >
                  <span>View Recipes</span>
                  <div className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center">
                    <Play className="w-3 h-3 fill-current text-gray-900 ml-0.5" />
                  </div>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default SolidsClubAgeSection;
