import { Button } from "@/components/ui/button";
import { Menu, Heart, Calendar, BookOpen, Home, Users, TrendingUp, Scan, Settings, FileText, ShoppingCart, LogOut, Baby, UserCircle } from "lucide-react";
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
    { to: "/profile", label: "Profile", icon: UserCircle },
    { to: "/settings", label: t('nav.settings'), icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full bg-card/95 backdrop-blur-xl shadow-sm">
      {/* Gold accent line at top */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-gold via-primary to-gold" />
      
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-gold via-primary to-secondary shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
            <Baby className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-foreground">
            Baby<span className="bg-gradient-to-r from-gold to-primary bg-clip-text text-transparent">Bites</span>
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${
                    isActive(link.to) 
                      ? "bg-gradient-to-r from-gold/20 to-primary/20 text-gold shadow-sm" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive(link.to) ? 'text-gold' : ''}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
        </nav>

        {/* Mobile Navigation */}
        <Sheet>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-muted">
              <Menu className="h-5 w-5 text-foreground" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 p-0 bg-card border-border/50">
            <div className="flex flex-col h-full">
              {/* Sheet Header */}
              <div className="p-5 border-b border-border/50 bg-peach/30">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary shadow-soft">
                    <Baby className="w-6 h-6 text-primary-foreground" />
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
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                          isActive(link.to) 
                            ? "bg-primary/15 text-primary" 
                            : "text-foreground hover:bg-muted/70"
                        }`}
                      >
                        <Icon className="h-4.5 w-4.5" />
                        <span>{link.label}</span>
                      </Link>
                    </SheetTrigger>
                  );
                })}
              </nav>

              {/* Logout Button */}
              <div className="p-4 border-t border-border/50">
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="w-full justify-start gap-3 h-11 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
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
