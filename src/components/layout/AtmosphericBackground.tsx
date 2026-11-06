import React from "react";
import appBgBaby from "@/assets/app-bg-baby.jpg";

export const AtmosphericBackground: React.FC = () => {
  return (
    <div 
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none" 
      aria-hidden="true"
    >
      {/* Real Baby Portrait Background Wallpaper */}
      <img
        src={appBgBaby}
        alt=""
        className="w-full h-full object-cover object-top sm:object-center opacity-70 dark:opacity-20 filter blur-[1.5px] scale-105 transform-gpu transition-opacity duration-300"
        loading="eager"
      />
      {/* Soft translucent tint ensuring crisp typography and card contrast */}
      <div className="absolute inset-0 bg-[#FAF9F5]/45 dark:bg-[#121614]/85 pointer-events-none" />
    </div>
  );
};

export default AtmosphericBackground;
