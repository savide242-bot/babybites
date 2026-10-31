import { Link, useLocation } from "react-router-dom";
import { Home, Calendar, Users, TrendingUp, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { forwardRef, RefObject } from "react";

interface NavItem {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const navItems: NavItem[] = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/planner", icon: Calendar, label: "Planner" },
  { to: "/community", icon: Users, label: "Community" },
  { to: "/growth", icon: TrendingUp, label: "Tracker" },
  { to: "/profile", icon: User, label: "Profile" },
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

    const isActive = (path: string) => {
      if (path === "/") return location.pathname === "/";
      return location.pathname.startsWith(path);
    };

    return (
      <nav ref={ref as any} className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
        {/* Clean organic glass background */}
        <div className="relative bg-white/95 dark:bg-[#121614]/95 backdrop-blur-xl border-t border-[#EBE8DF] dark:border-stone-800 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] transition-colors">
          <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
            {navItems.map((item) => {
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
          </div>
        </div>
      </nav>
    );
  }
);

BottomNavigation.displayName = "BottomNavigation";

export default BottomNavigation;
