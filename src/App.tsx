import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/hooks/useLanguage";
import { useEffect } from "react";
import { updateLastVisit } from "@/hooks/useNotifications";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useMealReminders } from "@/hooks/useMealReminders";
import { useServiceWorkerUpdate } from "@/hooks/useServiceWorkerUpdate";
import { usePushNotifications } from "@/hooks/usePushNotifications";
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
import Settings from "./pages/Settings";
import Install from "./pages/Install";
import NotFound from "./pages/NotFound";
import ProgressReports from "./pages/ProgressReports";
import ShoppingList from "./pages/ShoppingList";
import Favorites from "./pages/Favorites";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Admin from "./pages/Admin";
import PrivateRoute from "./components/PrivateRoute";
import WhatsAppButton from "@/components/WhatsAppButton";

const queryClient = new QueryClient();

const AppContent = () => {
  // Activate PWA install detection and welcome notifications
  usePWAInstall();
  
  // Activate meal time reminders
  useMealReminders();
  
  // Activate service worker auto-update
  useServiceWorkerUpdate();
  
  // Push notifications setup
  const { subscribeToPushNotifications, isSupported } = usePushNotifications();
  
  useEffect(() => {
    // Update last visit timestamp on app load
    updateLastVisit().catch(console.error);
  }, []);

  useEffect(() => {
    // Request notification permission on first visit if supported
    const hasAskedPermission = localStorage.getItem('notification-permission-asked');
    
    if (!hasAskedPermission && isSupported && Notification.permission === 'default') {
      // Wait 3 seconds after app loads to ask (better UX)
      const timer = setTimeout(() => {
        subscribeToPushNotifications();
        localStorage.setItem('notification-permission-asked', 'true');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isSupported, subscribeToPushNotifications]);

  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />
        <Route path="/*" element={
          <PrivateRoute>
            <>
              <Header />
              <WhatsAppButton />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/recipes" element={<Recipes />} />
                <Route path="/recipe/:id" element={<RecipeDetail />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/planner" element={<MealPlanner />} />
                <Route path="/advice" element={<Advice />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/community" element={<Community />} />
                <Route path="/growth" element={<GrowthTracker />} />
                <Route path="/scanner" element={<BarcodeScanner />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/install" element={<Install />} />
                <Route path="/reports" element={<ProgressReports />} />
                <Route path="/shopping" element={<ShoppingList />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </>
          </PrivateRoute>
        } />
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
