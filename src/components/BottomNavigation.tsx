import { Link, useLocation } from "react-router-dom";
import { Home, BookOpen, Calendar, Gift, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { forwardRef, RefObject } from "react";

interface NavItem {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const navItems: NavItem[] = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/recipes", icon: BookOpen, label: "Recipes" },
  { to: "/planner", icon: Calendar, label: "Planner" },
  { to: "/bonus", icon: Gift, label: "Bonus" },
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

    const getRefForItem = (to: string) => {
      switch (to) {
        case "/recipes":
          return navRefs?.recipes;
        case "/planner":
          return navRefs?.planner;
        default:
          return undefined;
      }
    };

    return (
      <nav ref={ref as any} className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
        {/* Premium glass background with gold accent */}
        <div className="relative bg-card/90 backdrop-blur-2xl border-t border-gold/20 shadow-[0_-8px_30px_-4px_rgba(0,0,0,0.1)]">
          {/* Subtle gold gradient line at top */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
          
          <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              const itemRef = getRefForItem(item.to);
              
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  ref={itemRef}
                  className={cn(
                    "flex flex-col items-center justify-center w-16 h-full gap-0.5 transition-all duration-300 active:scale-95",
                    active 
                      ? "text-gold" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className={cn(
                    "relative flex items-center justify-center w-10 h-10 rounded-2xl transition-all duration-300",
                    active && "bg-gradient-to-br from-gold/20 to-primary/20 scale-105"
                  )}>
                    {/* Gold glow effect for active */}
                    {active && (
                      <div className="absolute inset-0 bg-gold/20 rounded-2xl blur-md animate-pulse" />
                    )}
                    <Icon className={cn(
                      "relative w-5 h-5 transition-all duration-300",
                      active && "text-gold scale-110"
                    )} />
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium transition-all duration-300",
                    active ? "text-gold font-bold" : ""
                  )}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
        
        {/* Safe area spacer for iOS */}
        <div className="h-[env(safe-area-inset-bottom)] bg-card" />
      </nav>
    );
  }
);

BottomNavigation.displayName = "BottomNavigation";

export default BottomNavigation;
