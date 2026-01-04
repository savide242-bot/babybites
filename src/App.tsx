import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/hooks/useLanguage";
import { useEffect, useRef } from "react";
import { updateLastVisit } from "@/hooks/useNotifications";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useMealReminders } from "@/hooks/useMealReminders";
import { useServiceWorkerUpdate } from "@/hooks/useServiceWorkerUpdate";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useSessionTracking } from "@/hooks/useSessionTracking";
import Header from "./components/Header";
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding";
import FirstDay from "./pages/FirstDay";
import Recipes from "./pages/Recipes";
import RecipeDetail from "./pages/RecipeDetail";
import MealPlanner from "./pages/MealPlanner";
import Advice from "./pages/Advice";
import Community from "./pages/Community";
import GrowthTracker from "./pages/GrowthTracker";
import FoodAnalyzer from "./pages/FoodAnalyzer";
import Settings from "./pages/Settings";
import Install from "./pages/Install";
import NotFound from "./pages/NotFound";
import ProgressReports from "./pages/ProgressReports";
import ShoppingList from "./pages/ShoppingList";
import Favorites from "./pages/Favorites";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Admin from "./pages/Admin";
import Achievements from "./pages/Achievements";
import Profile from "./pages/Profile";
import FoodDiary from "./pages/FoodDiary";
import IOSPushSetup from "./pages/IOSPushSetup";
import PrivateRoute from "./components/PrivateRoute";
import WhatsAppButton from "@/components/WhatsAppButton";
import { NotificationPromptModal } from "@/components/NotificationPromptModal";
import BirthdayCelebrationModal from "@/components/BirthdayCelebrationModal";
import BottomNavigation from "@/components/BottomNavigation";
import OfflineIndicator from "@/components/OfflineIndicator";

const AppContent = () => {
  // Activate PWA install detection and welcome notifications
  usePWAInstall();
  
  // NOTE: Local meal reminders (useMealReminders) are DISABLED
  // Server-side push notifications via check-meal-reminders scheduler are the source of truth
  // This ensures notifications work even when the app is closed
  
  // Activate service worker auto-update
  useServiceWorkerUpdate();
  
  // Track user sessions
  useSessionTracking();
  
  // Navigation refs for app tour
  const recipesNavRef = useRef<HTMLAnchorElement>(null);
  const plannerNavRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    // Update last visit timestamp on app load
    updateLastVisit().catch(console.error);
    
    // Store nav refs on window for tour access
    (window as any).__tourNavRefs = {
      recipes: recipesNavRef,
      planner: plannerNavRef,
    };
  }, []);

  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />
        <Route path="/*" element={
          <PrivateRoute>
            <>
              <Header />
              <OfflineIndicator />
              <WhatsAppButton />
              <NotificationPromptModal />
              <BirthdayCelebrationModal />
              <BottomNavigation navRefs={{ 
                recipes: recipesNavRef, 
                planner: plannerNavRef, 
              }} />
              <Routes>
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/first-day" element={<FirstDay />} />
                <Route path="/" element={<Home />} />
                <Route path="/recipes" element={<Recipes />} />
                <Route path="/recipe/:id" element={<RecipeDetail />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/planner" element={<MealPlanner />} />
                <Route path="/advice" element={<Advice />} />
                <Route path="/community" element={<Community />} />
                <Route path="/growth" element={<GrowthTracker />} />
                <Route path="/scanner" element={<FoodAnalyzer />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/install" element={<Install />} />
                <Route path="/reports" element={<ProgressReports />} />
                <Route path="/shopping" element={<ShoppingList />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/achievements" element={<Achievements />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/food-diary" element={<FoodDiary />} />
                <Route path="/ios-push-setup" element={<IOSPushSetup />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </>
          </PrivateRoute>
        } />
      </Routes>
    </div>
  );
};

const queryClient = new QueryClient();

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
