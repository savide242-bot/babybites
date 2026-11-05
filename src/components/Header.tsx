import { Button } from "@/components/ui/button";
import { 
  Search, 
  MessageCircle, 
  Menu, 
  Calendar, 
  BookOpen, 
  Heart, 
  TrendingUp, 
  Settings, 
  ShoppingCart, 
  Snowflake, 
  Refrigerator, 
  LogOut, 
  ShieldCheck, 
  Repeat, 
  Bookmark,
  Trophy 
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import appLogo from "@/assets/logo.png";
import { BabySwitcher } from "@/components/baby/BabySwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { StreakDisplay } from "@/components/gamification/StreakDisplay";

export const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const menuLinks = [
    { to: "/", label: "Home", icon: BookOpen },
    { to: "/recipes", label: "All Recipes Library", icon: BookOpen },
    { to: "/planner", label: "Weekly Meal Planner", icon: Calendar },
    { to: "/shopping", label: "Smart Shopping List", icon: ShoppingCart },
    { to: "/foods-tried", label: "100 Foods Tried Tracker", icon: Heart },
    { to: "/freezer", label: "Freezer Prep & Stash", icon: Snowflake },
    { to: "/allergens", label: "Allergen Safety Tracker", icon: ShieldCheck },
    { to: "/pantry", label: "Pantry Helper", icon: Refrigerator },
    { to: "/ingredient-swap", label: "Ingredient Swap", icon: Repeat },
    { to: "/community", label: "Parents Community", icon: MessageCircle },
    { to: "/favorites", label: "Saved Collections", icon: Bookmark },
    { to: "/achievements", label: "Achievements & Medals", icon: Trophy },
    { to: "/leaderboard", label: "Weekly Leaderboard", icon: Trophy },
    { to: "/growth", label: "Growth & Milestones", icon: TrendingUp },
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FAF9F5]/90 dark:bg-[#121614]/90 backdrop-blur-md border-b border-[#EBE8DF] dark:border-stone-800 transition-colors">
      <div className="w-full px-2.5 sm:px-4 lg:px-6 h-14 sm:h-16 flex items-center justify-between gap-1">
        {/* Brand Logo - Compact on mobile to prevent overlapping */}
        <Link to="/" className="flex items-center gap-1.5 sm:gap-2.5 group shrink-0">
          <img
            src={appLogo}
            alt="BabyBites"
            className="w-7 h-7 sm:w-9 sm:h-9 rounded-full object-cover shadow-xs group-hover:scale-105 transition-transform shrink-0"
          />
          <span className="text-[15px] sm:text-xl font-serif font-bold text-forest dark:text-emerald-400 tracking-tight whitespace-nowrap">
            BabyBites
          </span>
        </Link>

        {/* Action Icons right side (Baby Switcher, Streak, Search, Theme & Drawer Menu) */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 min-w-0">
          <BabySwitcher variant="header" />
          <StreakDisplay variant="compact" />

          <Link
            to="/recipes"
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white dark:bg-stone-800/90 border border-[#EBE8DF] dark:border-stone-700/60 flex items-center justify-center text-gray-600 dark:text-stone-300 hover:text-forest dark:hover:text-emerald-400 hover:border-[#CCE0D2] dark:hover:border-emerald-600/50 transition-colors shadow-xs shrink-0"
            title="Search recipes"
          >
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Link>

          {/* Community is always in bottom nav on mobile; keep visible on sm+ */}
          <Link
            to="/community"
            className="hidden sm:flex w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white dark:bg-stone-800/90 border border-[#EBE8DF] dark:border-stone-700/60 items-center justify-center text-gray-600 dark:text-stone-300 hover:text-forest dark:hover:text-emerald-400 hover:border-[#CCE0D2] dark:hover:border-emerald-600/50 transition-colors shadow-xs shrink-0"
            title="Parent Community"
          >
            <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Link>

          {/* Quick Theme Toggle (Light / Dark) */}
          <ThemeToggle variant="icon" />

          {/* Side Drawer Menu for all extra features */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white dark:bg-stone-800/90 border border-[#EBE8DF] dark:border-stone-700/60 hover:bg-white dark:hover:bg-stone-800 hover:text-forest dark:hover:text-emerald-400 transition-colors shadow-xs shrink-0"
              >
                <Menu className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-700 dark:text-stone-300" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 max-w-[85vw] p-0 bg-[#FAF9F5] dark:bg-[#121614] border-l border-[#EBE8DF] dark:border-stone-800 text-stone-900 dark:text-stone-100">
              <div className="flex flex-col h-full">
                {/* Drawer Header */}
                <div className="p-6 pb-4 border-b border-[#EBE8DF] dark:border-stone-800 bg-white dark:bg-[#161c18]">
                  <div className="flex items-center gap-3">
                    <img
                      src={appLogo}
                      alt="BabyBites"
                      className="w-12 h-12 rounded-full object-cover shadow-xs border border-[#CCE0D2] dark:border-emerald-800/50"
                    />
                    <div>
                      <h3 className="font-serif font-bold text-forest dark:text-emerald-400 text-lg">
                        BabyBites
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-stone-400">
                        Nourishing meals & guidance
                      </p>
                    </div>
                  </div>
                </div>

                {/* Drawer Navigation Links */}
                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                  {menuLinks.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.to;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                          isActive
                            ? "bg-forest dark:bg-emerald-600 text-white shadow-xs"
                            : "text-gray-700 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-800 hover:text-forest dark:hover:text-emerald-400"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>

                {/* Appearance & Logout */}
                <div className="p-4 border-t border-[#EBE8DF] dark:border-stone-800 bg-white dark:bg-[#161c18] space-y-2">
                  <ThemeToggle variant="menu-item" />
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="w-full justify-start text-xs text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
