import { useState, useEffect, useCallback, useRef } from "react";
import { Recipe } from "@/data/recipes";
import { useAdminRole } from "@/hooks/useAdminRole";
import {
  getMergedRecipes,
  getStagedModifications,
  getPublishedModifications,
  fetchPublishedFromCloud,
  RecipeModification,
} from "@/services/adminRecipeService";

export const useAppRecipes = () => {
  const { isAdmin } = useAdminRole();
  const [recipes, setRecipes] = useState<Recipe[]>(() => getMergedRecipes(isAdmin));
  const [stagedMods, setStagedMods] = useState<Record<string, RecipeModification>>(() =>
    getStagedModifications()
  );
  const [publishedMods, setPublishedMods] = useState<Record<string, RecipeModification>>(() =>
    getPublishedModifications()
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const lastSyncTimeRef = useRef<number>(0);

  const refresh = useCallback(() => {
    setRecipes(getMergedRecipes(isAdmin));
    setStagedMods(getStagedModifications());
    setPublishedMods(getPublishedModifications());
  }, [isAdmin]);

  // Synchronize with Supabase Cloud so any updates deployed by admin are immediately visible
  const syncCloud = useCallback(async () => {
    // Throttle checks to once every 10 seconds unless forced
    const now = Date.now();
    if (now - lastSyncTimeRef.current < 10000) return;
    lastSyncTimeRef.current = now;

    try {
      setIsSyncing(true);
      const latestPublished = await fetchPublishedFromCloud();
      setPublishedMods(latestPublished);
      setRecipes(getMergedRecipes(isAdmin));
    } catch (err) {
      console.warn("Background cloud recipe sync error:", err);
    } finally {
      setIsSyncing(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    refresh();
    // Run cloud sync on mount
    syncCloud();

    const handleStagingUpdate = () => refresh();
    const handleDeployUpdate = () => {
      refresh();
      syncCloud();
    };

    window.addEventListener("babybites_recipe_staging_updated", handleStagingUpdate);
    window.addEventListener("babybites_recipe_deployed", handleDeployUpdate);

    // When user returns to the mobile PWA (app resumes or browser tab gains focus)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        syncCloud();
      }
    };
    const handleFocus = () => {
      syncCloud();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("babybites_recipe_staging_updated", handleStagingUpdate);
      window.removeEventListener("babybites_recipe_deployed", handleDeployUpdate);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [isAdmin, refresh, syncCloud]);

  return {
    recipes,
    stagedCount: Object.keys(stagedMods).length,
    stagedMods,
    publishedMods,
    refresh,
    syncCloud,
    isSyncing,
    isAdmin,
  };
};
