import { Link, useLocation } from "react-router-dom";
import { Home, BookOpen, Calendar, MessageCircle, User } from "lucide-react";
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
  { to: "/chat", icon: MessageCircle, label: "Bibi" },
  { to: "/profile", icon: User, label: "Profile" },
];

interface BottomNavigationProps {
  navRefs?: {
    recipes?: RefObject<HTMLAnchorElement>;
    planner?: RefObject<HTMLAnchorElement>;
    chat?: RefObject<HTMLAnchorElement>;
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
        case "/chat":
          return navRefs?.chat;
        default:
          return undefined;
      }
    };

    return (
      <nav ref={ref as any} className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
        {/* Glass background with blur */}
        <div className="bg-card/95 backdrop-blur-xl border-t border-border/50 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)]">
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
                    "flex flex-col items-center justify-center w-16 h-full gap-0.5 transition-all duration-200",
                    active 
                      ? "text-primary" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-2xl transition-all duration-200",
                    active && "bg-primary/15 scale-105"
                  )}>
                    <Icon className={cn(
                      "w-5 h-5 transition-transform duration-200",
                      active && "scale-110"
                    )} />
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium transition-all",
                    active && "text-primary font-semibold"
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
