import { Button } from "@/components/ui/button";
import { Search, Bell, MessageCircle, Menu, Calendar, BookOpen, Heart, TrendingUp, Settings, ShoppingCart, Snowflake, Refrigerator, LogOut, Sparkles } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

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
    { to: "/community", label: "Parents Community", icon: MessageCircle },
    { to: "/growth", label: "Baby Profile & Progress", icon: TrendingUp },
    { to: "/favorites", label: "Saved Favorites", icon: Heart },
    { to: "/recipes?filter=freezer", label: "Freezer-Friendly Meals", icon: Snowflake },
    { to: "/recipes?filter=pantry", label: "Pantry Helper", icon: Refrigerator },
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FAF9F5]/90 backdrop-blur-md border-b border-[#EBE8DF]">
      <div className="max-w-2xl lg:max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand Logo in Serif Botanical Style */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-full bg-white border border-[#E3DFD3] flex items-center justify-center text-sm shadow-xs group-hover:scale-105 transition-transform">
            🥑
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest leading-none">
              The
            </span>
            <span className="text-lg font-serif font-bold text-forest leading-tight">
              BabyBites <span className="font-sans text-xs font-semibold text-[#48B774]">Club</span>
            </span>
          </div>
        </Link>

        {/* Action Icons right side (Search, Notification, Community & Drawer Menu) */}
        <div className="flex items-center gap-1.5">
          <Link
            to="/recipes"
            className="w-9 h-9 rounded-full bg-white border border-[#EBE8DF] flex items-center justify-center text-gray-600 hover:text-forest hover:border-[#CCE0D2] transition-colors shadow-xs"
            title="Search recipes"
          >
            <Search className="w-4 h-4" />
          </Link>

          <Link
            to="/community"
            className="w-9 h-9 rounded-full bg-white border border-[#EBE8DF] flex items-center justify-center text-gray-600 hover:text-forest hover:border-[#CCE0D2] transition-colors shadow-xs"
            title="Parent Community"
          >
            <MessageCircle className="w-4 h-4" />
          </Link>

          {/* Side Drawer Menu for all extra features */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="w-9 h-9 rounded-full bg-white border border-[#EBE8DF] hover:bg-white hover:text-forest transition-colors shadow-xs"
              >
                <Menu className="w-4 h-4 text-gray-700" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0 bg-[#FAF9F5] border-l border-[#EBE8DF]">
              <div className="flex flex-col h-full">
                {/* Drawer Header */}
                <div className="p-6 pb-4 border-b border-[#EBE8DF] bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#EAF5EE] border border-[#CCE0D2] flex items-center justify-center text-2xl">
                      🥑
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-forest text-lg">
                        BabyBites Menu
                      </h3>
                      <p className="text-xs text-gray-500">
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
                            ? "bg-forest text-white shadow-xs"
                            : "text-gray-700 hover:bg-white hover:text-forest"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>

                {/* Logout Button */}
                <div className="p-4 border-t border-[#EBE8DF] bg-white">
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="w-full justify-start text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
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
