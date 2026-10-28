import { useState, useEffect, useCallback } from "react";
import { Recipe } from "@/data/recipes";
import { useAdminRole } from "@/hooks/useAdminRole";
import {
  getMergedRecipes,
  getStagedModifications,
  getPublishedModifications,
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

  const refresh = useCallback(() => {
    setRecipes(getMergedRecipes(isAdmin));
    setStagedMods(getStagedModifications());
    setPublishedMods(getPublishedModifications());
  }, [isAdmin]);

  useEffect(() => {
    refresh();

    const handleStagingUpdate = () => refresh();
    const handleDeployUpdate = () => refresh();

    window.addEventListener("babybites_recipe_staging_updated", handleStagingUpdate);
    window.addEventListener("babybites_recipe_deployed", handleDeployUpdate);

    return () => {
      window.removeEventListener("babybites_recipe_staging_updated", handleStagingUpdate);
      window.removeEventListener("babybites_recipe_deployed", handleDeployUpdate);
    };
  }, [isAdmin, refresh]);

  return {
    recipes,
    stagedCount: Object.keys(stagedMods).length,
    stagedMods,
    publishedMods,
    refresh,
    isAdmin,
  };
};
