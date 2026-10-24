import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { LanguageProvider } from "@/hooks/useLanguage";
import { useEffect, useRef, Suspense, lazy } from "react";
import { updateLastVisit } from "@/hooks/useNotifications";
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
import { Skeleton } from "@/components/ui/skeleton";
import SmartInstallBanner from "@/components/SmartInstallBanner";

// Lazy load heavy pages for better initial bundle size
const Onboarding = lazy(() => import("./pages/Onboarding"));
const FirstDay = lazy(() => import("./pages/FirstDay"));
const Recipes = lazy(() => import("./pages/Recipes"));
const RecipeDetail = lazy(() => import("./pages/RecipeDetail"));
const VideoRecipeDetail = lazy(() => import("./pages/VideoRecipeDetail"));
const MealPlanner = lazy(() => import("./pages/MealPlanner"));
const Advice = lazy(() => import("./pages/Advice"));
const Bonus = lazy(() => import("./pages/Bonus"));
const GrowthTracker = lazy(() => import("./pages/GrowthTracker"));
const FoodAnalyzer = lazy(() => import("./pages/FoodAnalyzer"));
const Settings = lazy(() => import("./pages/Settings"));
const Install = lazy(() => import("./pages/Install"));
const ProgressReports = lazy(() => import("./pages/ProgressReports"));
const ShoppingList = lazy(() => import("./pages/ShoppingList"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminRecipeImages = lazy(() => import("./pages/AdminRecipeImages"));
const Achievements = lazy(() => import("./pages/Achievements"));
const Profile = lazy(() => import("./pages/Profile"));
const FoodDiary = lazy(() => import("./pages/FoodDiary"));
const Community = lazy(() => import("./pages/Community"));
const PantryHelper = lazy(() => import("./pages/PantryHelper"));
const AllergenTracker = lazy(() => import("./pages/AllergenTracker"));
const IOSPushSetup = lazy(() => import("./pages/IOSPushSetup"));
const MistakesGuide = lazy(() => import("./pages/MistakesGuide"));

// Loading fallback for lazy loaded pages
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="space-y-4 text-center">
      <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
      <Skeleton className="h-4 w-32 mx-auto" />
    </div>
  </div>
);

// Routes where Header and BottomNavigation should be hidden for full-screen experience
const FULLSCREEN_ROUTES = ["/onboarding", "/first-day"];

const AppContent = () => {
  const location = useLocation();
  
  // Check if current route should be fullscreen (no header/bottom nav)
  const isFullscreenRoute = FULLSCREEN_ROUTES.includes(location.pathname);

  // Activate PWA install detection and welcome notifications
  usePWAInstall();
  
  // NOTE: Local meal reminders (useMealReminders) are DISABLED
  // Server-side push notifications via check-meal-reminders scheduler are the source of truth
  // This ensures notifications work even when the app is closed
  
  // Activate service worker auto-update
  useServiceWorkerUpdate();
  
  // Track user sessions
  useSessionTracking();
  
  // Check if user is banned
  useBanCheck();
  
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
      <AdminPreviewBanner />
      {!isFullscreenRoute && <Header />}
      {!isFullscreenRoute && <OfflineIndicator />}
      {!isFullscreenRoute && <WhatsAppButton />}
      {!isFullscreenRoute && <SmartInstallBanner />}
      {!isFullscreenRoute && (
        <BottomNavigation navRefs={{ 
          recipes: recipesNavRef, 
          planner: plannerNavRef, 
        }} />
      )}
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
          <Route path="/profile" element={<Profile />} />
          <Route path="/food-diary" element={<FoodDiary />} />
          <Route path="/ios-push-setup" element={<IOSPushSetup />} />
          <Route path="/mistakes" element={<MistakesGuide />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
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
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AppWrapper />
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </AppErrorBoundary>
);

export default App;
