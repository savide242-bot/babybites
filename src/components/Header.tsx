import { Button } from "@/components/ui/button";
import { Menu, Heart, Calendar, BookOpen, Home, Bot, Users, TrendingUp, Scan, Settings, FileText, ShoppingCart, LogOut, Baby } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };
  
  const navLinks = [
    { to: "/", label: t('nav.home'), icon: Home },
    { to: "/recipes", label: t('nav.recipes'), icon: BookOpen },
    { to: "/favorites", label: "Favorites", icon: Heart },
    { to: "/planner", label: t('nav.planner'), icon: Calendar },
    { to: "/growth", label: t('nav.growth'), icon: TrendingUp },
    { to: "/scanner", label: t('nav.scanner'), icon: Scan },
    { to: "/reports", label: t('nav.progressReports'), icon: FileText },
    { to: "/shopping", label: t('nav.shoppingList'), icon: ShoppingCart },
    { to: "/community", label: t('nav.community'), icon: Users },
    { to: "/advice", label: t('nav.advice'), icon: Heart },
    { to: "/chat", label: t('nav.chat'), icon: Bot },
    { to: "/settings", label: t('nav.settings'), icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary shadow-md group-hover:shadow-lg transition-shadow">
            <Baby className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            BabyBites
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.slice(0, 7).map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isActive(link.to) 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Mobile Navigation */}
        <Sheet>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 p-0">
            <div className="flex flex-col h-full">
              {/* Sheet Header */}
              <div className="p-4 border-b bg-gradient-to-r from-primary/10 to-secondary/10">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary shadow-md">
                    <Baby className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-foreground">BabyBites</h2>
                    <p className="text-xs text-muted-foreground">Baby Nutrition App</p>
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <SheetTrigger key={link.to} asChild>
                      <Link
                        to={link.to}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                          isActive(link.to) 
                            ? "bg-gradient-to-r from-primary/15 to-secondary/15 text-primary shadow-sm" 
                            : "text-foreground hover:bg-muted"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{link.label}</span>
                      </Link>
                    </SheetTrigger>
                  );
                })}
              </nav>

              {/* Logout Button */}
              <div className="p-3 border-t">
                <SheetTrigger asChild>
                  <Button
                    variant="destructive"
                    onClick={handleLogout}
                    className="w-full justify-start gap-3 h-11 rounded-xl"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log Out</span>
                  </Button>
                </SheetTrigger>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default Header;
