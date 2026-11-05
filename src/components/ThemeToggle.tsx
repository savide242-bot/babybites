import React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Laptop } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ThemeToggleProps {
  variant?: "icon" | "segmented" | "menu-item";
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = "icon", className = "" }) => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    // Ensure document reflects persisted choice on mount
    try {
      const saved = localStorage.getItem("babybites-theme");
      if (saved && saved !== theme) {
        setTheme(saved);
      }
    } catch {
      // Ignore
    }
  }, []);

  const handleSetTheme = (newTheme: string) => {
    setTheme(newTheme);
    try {
      localStorage.setItem("babybites-theme", newTheme);
      // Immediately adjust html class for instantaneous feedback
      const isSystemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (newTheme === "dark" || (newTheme === "system" && isSystemDark)) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch {
      // Ignore
    }
  };

  if (!mounted) {
    return (
      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/50 dark:bg-stone-800/50 shrink-0 ${className}`} />
    );
  }

  const isDark = resolvedTheme === "dark";

  if (variant === "segmented") {
    return (
      <div className={`grid grid-cols-3 p-1 rounded-2xl bg-stone-100 dark:bg-stone-800/80 border border-[#EBE8DF] dark:border-stone-700/60 ${className}`}>
        <button
          type="button"
          onClick={() => handleSetTheme("light")}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
            theme === "light"
              ? "bg-white text-forest shadow-xs font-bold"
              : "text-gray-600 dark:text-stone-400 hover:text-gray-900 dark:hover:text-stone-200"
          }`}
        >
          <Sun className="w-3.5 h-3.5 text-amber-500" />
          <span>Light</span>
        </button>

        <button
          type="button"
          onClick={() => handleSetTheme("dark")}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
            theme === "dark"
              ? "bg-[#1E5E3A] text-white shadow-xs font-bold"
              : "text-gray-600 dark:text-stone-400 hover:text-gray-900 dark:hover:text-stone-200"
          }`}
        >
          <Moon className="w-3.5 h-3.5 text-emerald-300" />
          <span>Dark</span>
        </button>

        <button
          type="button"
          onClick={() => handleSetTheme("system")}
          className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
            theme === "system"
              ? "bg-white dark:bg-stone-700 text-forest dark:text-stone-100 shadow-xs font-bold"
              : "text-gray-600 dark:text-stone-400 hover:text-gray-900 dark:hover:text-stone-200"
          }`}
        >
          <Laptop className="w-3.5 h-3.5 text-stone-500" />
          <span>Auto</span>
        </button>
      </div>
    );
  }

  if (variant === "menu-item") {
    return (
      <button
        type="button"
        onClick={() => handleSetTheme(isDark ? "light" : "dark")}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all text-gray-700 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-800 ${className}`}
      >
        <div className="flex items-center gap-3">
          {isDark ? (
            <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          )}
          <span>Appearance: {isDark ? "Dark Mode" : "Light Mode"}</span>
        </div>
        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40">
          {isDark ? "DARK 🌙" : "LIGHT ☀️"}
        </span>
      </button>
    );
  }

  // Default Icon Button
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => handleSetTheme(isDark ? "light" : "dark")}
      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white dark:bg-stone-800/90 border border-[#EBE8DF] dark:border-stone-700/60 flex items-center justify-center text-gray-600 dark:text-stone-300 hover:text-forest dark:hover:text-emerald-400 hover:border-[#CCE0D2] dark:hover:border-emerald-600/50 transition-all shadow-xs shrink-0 ${className}`}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label="Toggle Dark Mode"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400" />
      ) : (
        <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 dark:text-stone-300" />
      )}
    </Button>
  );
};

export default ThemeToggle;
