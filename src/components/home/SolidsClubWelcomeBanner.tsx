import React from "react";
import { Sparkles, Heart } from "lucide-react";
import appLogo from "@/assets/logo.png";

interface WelcomeBannerProps {
  motherName?: string;
  babyName?: string;
  babyAgeMonths?: number;
}

export const SolidsClubWelcomeBanner: React.FC<WelcomeBannerProps> = ({
  motherName,
  babyName,
  babyAgeMonths,
}) => {
  const greeting = motherName ? `Welcome back, ${motherName}!` : "Welcome to BabyBites";
  const babyText = babyName 
    ? `${babyName} is ${babyAgeMonths || 6} months old` 
    : "Your trusted baby feeding companion";

  return (
    <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#FAF9F5] via-white to-[#F2EFE9] border border-[#EBE8DF] p-5 sm:p-6 mb-6 sm:mb-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
      {/* Decorative leaf branch in background */}
      <div className="absolute -top-6 -right-6 w-32 h-32 opacity-15 pointer-events-none select-none text-7xl transform rotate-45">
        🌿
      </div>

      <div className="flex items-center gap-4 sm:gap-5">
        {/* Circular Avatar / Official Brand Logo */}
        <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white border-2 border-[#E3DFD3] shadow-md overflow-hidden flex items-center justify-center">
          <img
            src={appLogo}
            alt="BabyBites"
            className="w-full h-full object-cover rounded-full"
          />
        </div>

        {/* Text Details */}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-3xl font-serif font-bold text-gray-900 leading-tight">
            {greeting}
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
            Nutritious, pediatrician-approved baby recipes in just a few taps. Tailored for your baby's current feeding stage.
          </p>

          <div className="flex items-center gap-2 mt-2.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white text-forest text-xs font-medium border border-[#E3DFD3]">
              <Heart className="w-3 h-3 text-[#48B774] fill-current" />
              {babyText}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolidsClubWelcomeBanner;
