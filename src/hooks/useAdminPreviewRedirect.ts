import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const PREVIEW_URL = "https://id-preview--c5922e44-641f-47eb-8afc-e9b38124e2b3.lovable.app";
const PRODUCTION_URL = "https://babybites.lovable.app";

interface AdminPreviewState {
  isAdmin: boolean;
  isOnProduction: boolean;
  showBanner: boolean;
  previewUrl: string;
  loading: boolean;
}

export const useAdminPreviewRedirect = (): AdminPreviewState => {
  const [state, setState] = useState<AdminPreviewState>({
    isAdmin: false,
    isOnProduction: false,
    showBanner: false,
    previewUrl: PREVIEW_URL,
    loading: true,
  });

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setState(prev => ({ ...prev, loading: false }));
          return;
        }

        // Check if user has admin role in user_roles table (secure server-side check)
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();

        const isAdmin = !!roleData;
        
        // Check if we're on the production domain
        const currentHost = window.location.hostname;
        const isOnProduction = currentHost === "babybites.lovable.app" || 
                               currentHost.includes("babybites");
        
        // Get current path to preserve navigation when redirecting
        const currentPath = window.location.pathname + window.location.search;
        const previewUrl = `${PREVIEW_URL}${currentPath}`;

        setState({
          isAdmin,
          isOnProduction,
          showBanner: isAdmin && isOnProduction,
          previewUrl,
          loading: false,
        });
      } catch (error) {
        console.error("Error checking admin status:", error);
        setState(prev => ({ ...prev, loading: false }));
      }
    };

    checkAdminStatus();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAdminStatus();
    });

    return () => subscription.unsubscribe();
  }, []);

  return state;
};
