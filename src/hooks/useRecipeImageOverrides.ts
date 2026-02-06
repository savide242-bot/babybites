import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ImageOverrides {
  [recipeId: string]: string;
}

export const useRecipeImageOverrides = () => {
  const [overrides, setOverrides] = useState<ImageOverrides>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverrides = async () => {
      try {
        const { data, error } = await supabase
          .from("recipe_image_overrides")
          .select("recipe_id, image_url");

        if (error) {
          console.error("Error fetching image overrides:", error);
          return;
        }

        if (data) {
          const overrideMap: ImageOverrides = {};
          data.forEach((item) => {
            overrideMap[item.recipe_id] = item.image_url;
          });
          setOverrides(overrideMap);
        }
      } catch (err) {
        console.error("Error in useRecipeImageOverrides:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOverrides();
  }, []);

  const getImageWithOverride = (recipeId: string, fallbackSrc: string): string => {
    return overrides[recipeId] || fallbackSrc;
  };

  return { overrides, loading, getImageWithOverride };
};
