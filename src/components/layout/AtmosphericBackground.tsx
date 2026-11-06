import React from "react";
import pantryHeroBanner from "@/assets/pantry-hero-banner.webp";

export const AtmosphericBackground: React.FC = () => {
  return (
    <div 
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none" 
      aria-hidden="true"
    >
      {/* Blurred warm photographic base */}
      <img
        src={pantryHeroBanner}
        alt=""
        className="w-full h-full object-cover filter blur-[44px] scale-110 opacity-35 dark:opacity-15 transform-gpu"
        loading="eager"
      />
      {/* Luxury frosted veil for flawless contrast and readability */}
      <div className="absolute inset-0 bg-[#FAF9F5]/80 dark:bg-[#121614]/90 backdrop-blur-xs" />
    </div>
  );
};

export default AtmosphericBackground;
