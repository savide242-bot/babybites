import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, Heart, Calendar, BookOpen, Home, Bot, Users, TrendingUp, Scan, Settings, FileText, ShoppingCart, LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import LogoutConfirmDialog from "./LogoutConfirmDialog";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  
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
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/90 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 shadow-md">
      <div className="container flex h-20 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 group">
          <div className="text-3xl font-extrabold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent tracking-tight group-hover:scale-105 transition-transform duration-300">
            BabyBites
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center space-x-2 text-sm font-semibold transition-all duration-300 hover:text-primary hover:scale-110 relative group ${
                  isActive(link.to) ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{link.label}</span>
                {isActive(link.to) && (
                  <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-secondary rounded-full shadow-glow" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Mobile Navigation */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="outline" size="icon" className="rounded-full shadow-md hover:shadow-glow transition-all duration-300">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <nav className="flex flex-col space-y-3 mt-12">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <SheetTrigger key={link.to} asChild>
                    <Link
                      to={link.to}
                      className={`flex items-center space-x-4 text-base font-semibold transition-all duration-300 hover:text-primary p-4 rounded-2xl hover:scale-105 ${
                        isActive(link.to) ? "bg-gradient-to-r from-primary/10 to-secondary/10 text-primary border-2 border-primary/20 shadow-md" : "text-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                      <span>{link.label}</span>
                    </Link>
                  </SheetTrigger>
                );
              })}
              
              <SheetTrigger asChild>
                <Button
                  variant="destructive"
                  onClick={() => setShowLogoutDialog(true)}
                  className="flex items-center justify-start space-x-4 w-full p-4 rounded-2xl mt-4"
                >
                  <LogOut className="h-6 w-6" />
                  <span>Log Out</span>
                </Button>
              </SheetTrigger>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
      
      <LogoutConfirmDialog 
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        onConfirm={handleLogout}
      />
    </header>
  );
};

export default Header;
