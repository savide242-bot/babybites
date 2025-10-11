import { Button } from "@/components/ui/button";
import { Menu, Heart, Calendar, BookOpen, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const Header = () => {
  const location = useLocation();
  
  const navLinks = [
    { to: "/", label: "Home", icon: Home },
    { to: "/recipes", label: "Recipes", icon: BookOpen },
    { to: "/planner", label: "Meal Planner", icon: Calendar },
    { to: "/advice", label: "Advice", icon: Heart },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            BabyBites
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center space-x-1 text-sm font-medium transition-colors hover:text-primary ${
                  isActive(link.to) ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center space-x-4">
          <Button variant="default" className="hidden md:flex rounded-full">
            Get Started
          </Button>

          {/* Mobile Navigation */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="outline" size="icon" className="rounded-full">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <nav className="flex flex-col space-y-4 mt-8">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`flex items-center space-x-3 text-base font-medium transition-colors hover:text-primary p-3 rounded-xl ${
                        isActive(link.to) ? "bg-muted text-primary" : "text-foreground"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
                <Button className="mt-4 rounded-full w-full">Get Started</Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
