import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider, useLanguage } from "@/hooks/useLanguage";
import Header from "./components/Header";
import Home from "./pages/Home";
import Recipes from "./pages/Recipes";
import RecipeDetail from "./pages/RecipeDetail";
import MealPlanner from "./pages/MealPlanner";
import Advice from "./pages/Advice";
import Chat from "./pages/Chat";
import Community from "./pages/Community";
import GrowthTracker from "./pages/GrowthTracker";
import BarcodeScanner from "./pages/BarcodeScanner";
import LanguageSelector from "./pages/LanguageSelector";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { supabase } from "@/integrations/supabase/client";

const queryClient = new QueryClient();

const AppContent = () => {
  const { isLoading } = useLanguage();
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [isCheckingPreferences, setIsCheckingPreferences] = useState(true);

  useEffect(() => {
    checkUserPreferences();
  }, []);

  const checkUserPreferences = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data } = await supabase
          .from('user_preferences')
          .select('language')
          .eq('user_id', session.user.id)
          .maybeSingle();

        setShowLanguageSelector(!data);
      } else {
        setShowLanguageSelector(true);
      }
    } catch (error) {
      console.error('Error checking preferences:', error);
      setShowLanguageSelector(true);
    } finally {
      setIsCheckingPreferences(false);
    }
  };

  if (isLoading || isCheckingPreferences) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (showLanguageSelector) {
    return <LanguageSelector onComplete={() => setShowLanguageSelector(false)} />;
  }

  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/recipes" element={<Recipes />} />
        <Route path="/recipe/:id" element={<RecipeDetail />} />
        <Route path="/planner" element={<MealPlanner />} />
        <Route path="/advice" element={<Advice />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/community" element={<Community />} />
        <Route path="/growth" element={<GrowthTracker />} />
        <Route path="/scanner" element={<BarcodeScanner />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
