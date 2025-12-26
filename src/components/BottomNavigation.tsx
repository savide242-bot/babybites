import { Link, useLocation } from "react-router-dom";
import { Home, BookOpen, Calendar, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/recipes", icon: BookOpen, label: "Recipes" },
  { to: "/planner", icon: Calendar, label: "Planner" },
  { to: "/chat", icon: MessageCircle, label: "Bibi" },
  { to: "/profile", icon: User, label: "Profile" },
];

const BottomNavigation = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      {/* Glass background with blur */}
      <div className="bg-card/95 backdrop-blur-xl border-t border-border/50 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to);
            
            return (
              <Link
                key={item.to}
                to={item.to}
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
};

export default BottomNavigation;
