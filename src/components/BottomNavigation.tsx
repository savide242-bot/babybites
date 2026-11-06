import { Link, useLocation } from "react-router-dom";
import { Home, Calendar, Users, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { forwardRef, RefObject, useState } from "react";
import { useBabyProfiles } from "@/hooks/useBabyProfiles";
import { BabyQuickSwitcherSheet } from "@/components/baby/BabyQuickSwitcherSheet";

interface NavItem {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const mainNavItems: NavItem[] = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/planner", icon: Calendar, label: "Planner" },
  { to: "/community", icon: Users, label: "Community" },
  { to: "/growth", icon: TrendingUp, label: "Tracker" },
];

interface BottomNavigationProps {
  navRefs?: {
    recipes?: RefObject<HTMLAnchorElement>;
    planner?: RefObject<HTMLAnchorElement>;
  };
}

const BottomNavigation = forwardRef<HTMLElement, BottomNavigationProps>(
  ({ navRefs }, ref) => {
    const location = useLocation();
    const { activeBaby, babies } = useBabyProfiles();
    const [switcherOpen, setSwitcherOpen] = useState(false);

    const isActive = (path: string) => {
      if (path === "/") return location.pathname === "/";
      return location.pathname.startsWith(path);
    };

    const isProfileActive = location.pathname.startsWith("/profile");

    return (
      <>
        <nav ref={ref as any} className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
          {/* Clean organic glass background */}
          <div className="relative bg-white/95 dark:bg-[#121614]/95 backdrop-blur-xl border-t border-[#EBE8DF] dark:border-stone-800 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] transition-colors">
            <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
              {/* Primary 4 navigation tabs */}
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.to);

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex flex-col items-center justify-center flex-1 h-full py-1.5 transition-all duration-200 relative group",
                      active
                        ? "text-[#1E5E3A] dark:text-emerald-400 font-bold"
                        : "text-gray-400 dark:text-stone-500 hover:text-gray-600 dark:hover:text-stone-300"
                    )}
                  >
                    {/* Subtle active pill indicator on top */}
                    {active && (
                      <div className="absolute top-0 w-8 h-1 rounded-full bg-[#48B774] dark:bg-emerald-400" />
                    )}

                    <div className="relative">
                      <Icon
                        className={cn(
                          "w-5 h-5 transition-transform duration-200",
                          active && "scale-110 text-[#1E5E3A] dark:text-emerald-400"
                        )}
                      />
                    </div>

                    <span
                      className={cn(
                        "text-[10px] mt-1 tracking-tight transition-all",
                        active ? "font-semibold text-[#1E5E3A] dark:text-emerald-400" : "font-medium"
                      )}
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              })}

              {/* 5th Tab at Bottom Right: Baby Profile Icon & Quick Switcher */}
              <button
                type="button"
                onClick={() => setSwitcherOpen(true)}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full py-1.5 transition-all duration-200 relative group cursor-pointer",
                  isProfileActive
                    ? "text-[#1E5E3A] dark:text-emerald-400 font-bold"
                    : "text-gray-400 dark:text-stone-500 hover:text-gray-600 dark:hover:text-stone-300"
                )}
                title="Switch child profile or view full profile"
              >
                {/* Active indicator */}
                {isProfileActive && (
                  <div className="absolute top-0 w-8 h-1 rounded-full bg-[#48B774] dark:bg-emerald-400" />
                )}

                <div className="relative">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs transition-transform duration-200 border",
                      isProfileActive
                        ? "bg-[#EAF5EE] dark:bg-emerald-950/60 border-[#1E5E3A] dark:border-emerald-400 scale-110 shadow-xs"
                        : "bg-amber-50 dark:bg-stone-800 border-amber-300/70 dark:border-stone-700"
                    )}
                  >
                    <span>{activeBaby?.avatarEmoji || "👶"}</span>
                  </div>

                  {/* Multi-baby badge dot */}
                  {babies.length > 1 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-white dark:border-[#121614] shadow-xs" />
                  )}
                </div>

                <span
                  className={cn(
                    "text-[10px] mt-1 tracking-tight transition-all truncate max-w-[56px]",
                    isProfileActive ? "font-semibold text-[#1E5E3A] dark:text-emerald-400" : "font-medium"
                  )}
                >
                  {activeBaby?.name || "Profile"}
                </span>
              </button>
            </div>
          </div>
        </nav>

        {/* Quick Baby Switcher Sheet */}
        <BabyQuickSwitcherSheet
          open={switcherOpen}
          onOpenChange={setSwitcherOpen}
        />
      </>
    );
  }
);

BottomNavigation.displayName = "BottomNavigation";

export default BottomNavigation;
