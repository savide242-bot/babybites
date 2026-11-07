import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/hooks/useLanguage";
import { BabyProfileProvider } from "@/contexts/BabyProfileContext";
import { useEffect, useRef, Suspense, lazy } from "react";
import { useNotifications, updateLastVisit } from "@/hooks/useNotifications";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useServiceWorkerUpdate } from "@/hooks/useServiceWorkerUpdate";
import { useSessionTracking } from "@/hooks/useSessionTracking";
import { useBanCheck } from "@/hooks/useBanCheck";
import AppErrorBoundary from "./components/AppErrorBoundary";
import Header from "./components/Header";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import PrivateRoute from "./components/PrivateRoute";
import WhatsAppButton from "@/components/WhatsAppButton";
import BirthdayCelebrationModal from "@/components/BirthdayCelebrationModal";
import BottomNavigation from "@/components/BottomNavigation";
import OfflineIndicator from "@/components/OfflineIndicator";
import { AdminPreviewBanner } from "@/components/AdminPreviewBanner";
import { LiveVisualInspector } from "@/components/admin/LiveVisualInspector";
import { AtmosphericBackground } from "@/components/layout/AtmosphericBackground";
import { Skeleton } from "@/components/ui/skeleton";
import SmartInstallBanner from "@/components/SmartInstallBanner";
import { BadgeCelebrationModal } from "@/components/gamification/BadgeCelebrationModal";
import { BadgeDetailModal } from "@/components/gamification/BadgeDetailModal";

// Eagerly imported core navigation tabs for INSTANT tab switching without white screen delay
import Recipes from "./pages/Recipes";
import MealPlanner from "./pages/MealPlanner";
import Community from "./pages/Community";
import GrowthTracker from "./pages/GrowthTracker";
import Profile from "./pages/Profile";
import PantryHelper from "./pages/PantryHelper";
import FoodAnalyzer from "./pages/FoodAnalyzer";
import Favorites from "./pages/Favorites";
import Achievements from "./pages/Achievements";
import { Leaderboard } from "./pages/Leaderboard";

// Lazy load secondary/admin routes
const Onboarding = lazy(() => import("./pages/Onboarding"));
const FirstDay = lazy(() => import("./pages/FirstDay"));
const RecipeDetail = lazy(() => import("./pages/RecipeDetail"));
const VideoRecipeDetail = lazy(() => import("./pages/VideoRecipeDetail"));
const Advice = lazy(() => import("./pages/Advice"));
const Bonus = lazy(() => import("./pages/Bonus"));
const Settings = lazy(() => import("./pages/Settings"));
const Install = lazy(() => import("./pages/Install"));
const ProgressReports = lazy(() => import("./pages/ProgressReports"));
const ShoppingList = lazy(() => import("./pages/ShoppingList"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminRecipeImages = lazy(() => import("./pages/AdminRecipeImages"));
const FoodDiary = lazy(() => import("./pages/FoodDiary"));
const AllergenTracker = lazy(() => import("./pages/AllergenTracker"));
const FreezerPrep = lazy(() => import("./pages/FreezerPrep"));
const FoodsTried = lazy(() => import("./pages/FoodsTried"));
const IngredientSwap = lazy(() => import("./pages/IngredientSwap"));
const IOSPushSetup = lazy(() => import("./pages/IOSPushSetup"));
const MistakesGuide = lazy(() => import("./pages/MistakesGuide"));

// Non-disruptive loading fallback for secondary lazy pages (preserves background, no white flash)
const PageLoader = () => (
  <div className="w-full min-h-[35vh] flex items-center justify-center p-8">
    <div className="w-8 h-8 border-3 border-[#1E5E3A]/20 border-t-[#1E5E3A] rounded-full animate-spin" />
  </div>
);

// Routes where Header and BottomNavigation should be hidden for full-screen experience
const FULLSCREEN_ROUTES = ["/onboarding", "/first-day"];

const AppContent = () => {
  const location = useLocation();
  
  // Check if current route should be fullscreen (no header/bottom nav)
  const isFullscreenRoute = FULLSCREEN_ROUTES.includes(location.pathname);

  // Activate PWA install detection and notifications
  usePWAInstall();
  useNotifications();
  useServiceWorkerUpdate();
  useSessionTracking();
  useBanCheck();

  // Navigation refs for app tour
  const recipesNavRef = useRef<HTMLAnchorElement>(null);
  const plannerNavRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    updateLastVisit().catch(console.error);
    (window as any).__tourNavRefs = {
      recipes: recipesNavRef,
      planner: plannerNavRef,
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5] dark:bg-[#0f1411] text-stone-900 dark:text-stone-100 w-full max-w-full overflow-x-hidden min-w-0 transition-colors duration-200">
      <AtmosphericBackground />
      <LiveVisualInspector />
      <AdminPreviewBanner />
      {!isFullscreenRoute && <Header />}
      {!isFullscreenRoute && <BottomNavigation />}
      <OfflineIndicator />
      <WhatsAppButton />
      <BirthdayCelebrationModal />
      <SmartInstallBanner />
      <main className="flex-1 w-full max-w-full overflow-x-hidden min-w-0">
        <Suspense fallback={<PageLoader />}>
          <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/first-day" element={<FirstDay />} />
          <Route path="/" element={<Home />} />
          <Route path="/recipes" element={<Recipes />} />
          <Route path="/recipe/:id" element={<RecipeDetail />} />
          <Route path="/video-recipe/:id" element={<VideoRecipeDetail />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/planner" element={<MealPlanner />} />
          <Route path="/community" element={<Community />} />
          <Route path="/pantry" element={<PantryHelper />} />
          <Route path="/allergens" element={<AllergenTracker />} />
          <Route path="/freezer" element={<FreezerPrep />} />
          <Route path="/foods-tried" element={<FoodsTried />} />
          <Route path="/ingredient-swap" element={<IngredientSwap />} />
          <Route path="/advice" element={<Advice />} />
          <Route path="/bonus" element={<Bonus />} />
          <Route path="/growth" element={<GrowthTracker />} />
          <Route path="/scanner" element={<FoodAnalyzer />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/install" element={<Install />} />
          <Route path="/reports" element={<ProgressReports />} />
          <Route path="/shopping" element={<ShoppingList />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/recipe-images" element={<AdminRecipeImages />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/food-diary" element={<FoodDiary />} />
          <Route path="/ios-push-setup" element={<IOSPushSetup />} />
          <Route path="/mistakes" element={<MistakesGuide />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      </main>
    </div>
  );
};

const AppWrapper = () => {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/auth/reset-password" element={<ResetPassword />} />
      <Route path="/*" element={
        <PrivateRoute>
          <AppContent />
        </PrivateRoute>
      } />
    </Routes>
  );
};

const queryClient = new QueryClient();

const App = () => (
  <AppErrorBoundary>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="babybites-theme">
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <BabyProfileProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BadgeCelebrationModal />
              <BadgeDetailModal />
              <BrowserRouter>
                <AppWrapper />
              </BrowserRouter>
            </TooltipProvider>
          </BabyProfileProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </AppErrorBoundary>
);

export default App;
