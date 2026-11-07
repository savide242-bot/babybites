import React from "react";
import { useLocation } from "react-router-dom";
import appBgBaby from "@/assets/app-bg-baby.jpg";
import { useVisualTheme } from "@/hooks/useVisualTheme";

export const AtmosphericBackground: React.FC = () => {
  const location = useLocation();
  const { settings } = useVisualTheme();

  // Explicit user requirement: Do not apply wallpaper background on Home and Pantry Helper tabs
  if (location.pathname === '/' || location.pathname === '/home' || location.pathname === '/pantry') {
    return null;
  }

  const currentTabBg = settings.tabBackgrounds[location.pathname];
  const activeImage = settings.wallpaperUrl || appBgBaby;
  const blurPx = settings.wallpaperBlur ?? 1.5;
  const opacityLight = (settings.wallpaperOpacityLight ?? 70) / 100;
  const opacityDark = (settings.wallpaperOpacityDark ?? 20) / 100;

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none" 
      aria-hidden="true"
    >
      {/* Background Wallpaper */}
      <img
        src={activeImage}
        alt=""
        style={{
          filter: `blur(${blurPx}px)`,
          opacity: opacityLight,
        }}
        className="w-full h-full object-cover object-top sm:object-center scale-105 transform-gpu transition-all duration-300 dark:hidden"
        loading="eager"
      />
      <img
        src={activeImage}
        alt=""
        style={{
          filter: `blur(${blurPx}px)`,
          opacity: opacityDark,
        }}
        className="w-full h-full object-cover object-top sm:object-center scale-105 transform-gpu transition-all duration-300 hidden dark:block"
        loading="eager"
      />

      {/* Light mode base tint & custom tab background overlay */}
      <div 
        className="absolute inset-0 transition-colors duration-300 pointer-events-none dark:hidden"
        style={{
          backgroundColor: currentTabBg ? currentTabBg : "rgba(250, 249, 245, 0.45)",
          opacity: currentTabBg ? 0.75 : 1,
        }}
      />

      {/* Dark mode base tint */}
      <div 
        className="absolute inset-0 transition-colors duration-300 pointer-events-none hidden dark:block bg-[#121614]/85"
      />
    </div>
  );
};

export default AtmosphericBackground;
