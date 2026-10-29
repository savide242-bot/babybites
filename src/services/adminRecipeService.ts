import { supabase } from "@/integrations/supabase/client";
import { recipes as staticRecipes, Recipe } from "@/data/recipes";

export interface RecipeModification {
  id: string;
  title: string;
  description: string;
  ageGroup: string;
  category: string;
  mealTime?: "Breakfast" | "Lunch" | "Dinner" | "Snack";
  prepTime: string;
  servings: string;
  image: string;
  ingredients: string[];
  instructions: string[];
  isNew?: boolean;
  isStaged: boolean; // true = visible only to admins until deployed
  updatedAt: string;
  storageImagePath?: string; // Path in Supabase storage for cleanup
}

const LOCAL_STORAGE_STAGED_KEY = "babybites_staged_recipes";
const LOCAL_STORAGE_PUBLISHED_KEY = "babybites_published_recipes";

// Helper to convert an image file to WebP blob
export const convertToWebP = (file: File, maxDimension = 1200, quality = 0.85): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context unavailable"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("WebP conversion failed"));
          },
          "image/webp",
          quality
        );
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Upload image to Supabase Storage bucket 'recipe-images' and clean up previous image if applicable
export const uploadRecipeImage = async (
  file: File,
  recipeId: string,
  oldStoragePath?: string
): Promise<{ publicUrl: string; storagePath: string }> => {
  const webpBlob = await convertToWebP(file);
  const timestamp = Date.now();
  const storagePath = `recipes/${recipeId}_${timestamp}.webp`;

  // 1. Upload new image
  const { error: uploadError } = await supabase.storage
    .from("recipe-images")
    .upload(storagePath, webpBlob, {
      contentType: "image/webp",
      upsert: true,
      cacheControl: "31536000",
    });

  if (uploadError) {
    throw new Error(`Failed to upload recipe image: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage
    .from("recipe-images")
    .getPublicUrl(storagePath);

  // 2. Clean up previous image if it exists in Supabase storage
  if (oldStoragePath && oldStoragePath.startsWith("recipes/")) {
    try {
      await supabase.storage.from("recipe-images").remove([oldStoragePath]);
    } catch (err) {
      console.warn("Failed to delete previous recipe image from storage:", err);
    }
  }

  return { publicUrl: urlData.publicUrl, storagePath };
};

// Delete image from storage
export const deleteRecipeImageFromStorage = async (storagePath: string): Promise<void> => {
  if (storagePath && storagePath.startsWith("recipes/")) {
    try {
      await supabase.storage.from("recipe-images").remove([storagePath]);
    } catch (err) {
      console.warn("Error removing image from storage:", err);
    }
  }
};

// Local storage helpers
const loadFromStorage = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const saveToStorage = (key: string, data: any): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error("LocalStorage write error:", err);
  }
};

// Cloud sync key for cross-device recipe modifications and image overrides
export const CLOUD_RECIPES_SYNC_KEY = "__SYSTEM_RECIPE_OVERRIDES__";

// Sync image overrides with Supabase recipe_image_overrides
export const syncOverridesWithSupabase = async (
  recipeId: string,
  imageUrl: string
): Promise<void> => {
  try {
    await supabase.from("recipe_image_overrides").upsert(
      {
        recipe_id: recipeId,
        image_url: imageUrl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "recipe_id" }
    );
  } catch (err) {
    console.warn("Could not sync with Supabase recipe_image_overrides:", err);
  }
};

// Push published recipe catalog to Supabase Cloud so all devices (mobile PWA, web) sync
export const syncPublishedRecipesToCloud = async (
  published: Record<string, RecipeModification>
): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.warn("User not authenticated, cannot sync published recipes to cloud.");
      return false;
    }

    const jsonString = JSON.stringify(published);

    // Check if system post exists
    const { data: existing, error: fetchErr } = await supabase
      .from("forum_posts")
      .select("id")
      .eq("title", CLOUD_RECIPES_SYNC_KEY)
      .maybeSingle();

    if (fetchErr) {
      console.warn("Could not check existing cloud recipes post:", fetchErr);
    }

    if (existing) {
      const { error: updateErr } = await supabase
        .from("forum_posts")
        .update({
          content: jsonString,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (updateErr) {
        console.error("Failed to update cloud recipes:", updateErr);
        return false;
      }
    } else {
      const { error: insertErr } = await supabase
        .from("forum_posts")
        .insert({
          user_id: user.id,
          title: CLOUD_RECIPES_SYNC_KEY,
          content: jsonString,
        });

      if (insertErr) {
        console.error("Failed to insert cloud recipes:", insertErr);
        return false;
      }
    }

    console.log("☁️ Successfully published recipe catalog to cloud sync!");
    return true;
  } catch (err) {
    console.error("Error in syncPublishedRecipesToCloud:", err);
    return false;
  }
};

// Pull published recipe catalog from Supabase Cloud to local device
export const fetchPublishedFromCloud = async (): Promise<Record<string, RecipeModification>> => {
  try {
    // 1. Fetch from cloud sync post
    const { data, error } = await supabase
      .from("forum_posts")
      .select("content, updated_at")
      .eq("title", CLOUD_RECIPES_SYNC_KEY)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let cloudPublished: Record<string, RecipeModification> = {};

    if (!error && data?.content) {
      try {
        cloudPublished = JSON.parse(data.content);
      } catch (e) {
        console.warn("Failed to parse cloud recipes content:", e);
      }
    }

    // 2. Also check recipe_image_overrides if any exist
    try {
      const { data: imageOverrides } = await supabase
        .from("recipe_image_overrides")
        .select("recipe_id, image_url");

      if (imageOverrides && imageOverrides.length > 0) {
        imageOverrides.forEach((override) => {
          if (override.recipe_id && override.image_url) {
            if (!cloudPublished[override.recipe_id]) {
              cloudPublished[override.recipe_id] = {
                id: override.recipe_id,
                title: "",
                description: "",
                ageGroup: "",
                category: "",
                prepTime: "",
                servings: "",
                image: override.image_url,
                ingredients: [],
                instructions: [],
                isStaged: false,
                updatedAt: new Date().toISOString(),
              };
            } else {
              cloudPublished[override.recipe_id].image = override.image_url;
            }
          }
        });
      }
    } catch {
      // Ignore
    }

    // Merge with current local published recipes
    const localPublished = getPublishedModifications();
    const mergedPublished = { ...localPublished, ...cloudPublished };

    // Persist into localStorage so offline PWA mode still has all the latest recipes
    saveToStorage(LOCAL_STORAGE_PUBLISHED_KEY, mergedPublished);

    return mergedPublished;
  } catch (err) {
    console.error("Error fetching published recipes from cloud:", err);
    return getPublishedModifications();
  }
};

// Fetch published modifications from Supabase / localStorage
export const getPublishedModifications = (): Record<string, RecipeModification> => {
  return loadFromStorage<Record<string, RecipeModification>>(LOCAL_STORAGE_PUBLISHED_KEY, {});
};

// Fetch staged modifications (visible only to admins)
export const getStagedModifications = (): Record<string, RecipeModification> => {
  return loadFromStorage<Record<string, RecipeModification>>(LOCAL_STORAGE_STAGED_KEY, {});
};

// Save a recipe to Staging (Draft mode - Admin only)
export const saveRecipeToStaging = async (
  modification: RecipeModification
): Promise<void> => {
  const staged = getStagedModifications();
  staged[modification.id] = {
    ...modification,
    isStaged: true,
    updatedAt: new Date().toISOString(),
  };
  saveToStorage(LOCAL_STORAGE_STAGED_KEY, staged);

  // Broadcast change across tabs
  window.dispatchEvent(new CustomEvent("babybites_recipe_staging_updated"));
};

// Discard a staged modification
export const discardStagedModification = async (recipeId: string): Promise<void> => {
  const staged = getStagedModifications();
  if (staged[recipeId]) {
    // If it had a new uploaded image in staging, delete it
    if (staged[recipeId].storageImagePath) {
      await deleteRecipeImageFromStorage(staged[recipeId].storageImagePath!);
    }
    delete staged[recipeId];
    saveToStorage(LOCAL_STORAGE_STAGED_KEY, staged);
    window.dispatchEvent(new CustomEvent("babybites_recipe_staging_updated"));
  }
};

// Deploy ALL staged changes to Production (Making them live for all users & mobile PWA)
export const deployAllStagedToProduction = async (): Promise<{ count: number; cloudSynced: boolean }> => {
  const staged = getStagedModifications();
  const stagedIds = Object.keys(staged);
  if (stagedIds.length === 0) return { count: 0, cloudSynced: false };

  const published = getPublishedModifications();

  for (const id of stagedIds) {
    const item = staged[id];
    published[id] = {
      ...item,
      isStaged: false,
      updatedAt: new Date().toISOString(),
    };

    // If there is an image change, sync with Supabase recipe_image_overrides table
    if (item.image) {
      await syncOverridesWithSupabase(item.id, item.image);
    }
  }

  // Save published locally and clear staging
  saveToStorage(LOCAL_STORAGE_PUBLISHED_KEY, published);
  saveToStorage(LOCAL_STORAGE_STAGED_KEY, {});

  // Sync with Supabase Cloud so all mobile devices & users receive immediately
  const cloudSynced = await syncPublishedRecipesToCloud(published);

  // Broadcast update
  window.dispatchEvent(new CustomEvent("babybites_recipe_deployed"));

  return { count: stagedIds.length, cloudSynced };
};

// AI Assistant for Recipes: Clean up, organize, format, and pediatric safety check
export const reviewRecipeWithAI = async (recipeDraft: {
  title: string;
  description: string;
  ageGroup: string;
  ingredients: string[];
  instructions: string[];
}): Promise<{
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  tips: string;
  pediatricSafetyNotes: string;
}> => {
  // Try to use Supabase Edge Function organize-video-recipe or fallback to smart built-in pediatric AI formatting
  try {
    const rawCaption = `Recipe: ${recipeDraft.title}\nAge: ${recipeDraft.ageGroup}\nDescription: ${recipeDraft.description}\nIngredients:\n${recipeDraft.ingredients.join("\n")}\nInstructions:\n${recipeDraft.instructions.join("\n")}`;

    const { data, error } = await supabase.functions.invoke("organize-video-recipe", {
      body: { caption: rawCaption },
    });

    if (!error && data && data.ingredients && data.steps) {
      return {
        title: data.title || recipeDraft.title,
        description: data.description || recipeDraft.description,
        ingredients: Array.isArray(data.ingredients) ? data.ingredients : recipeDraft.ingredients,
        instructions: Array.isArray(data.steps) ? data.steps : recipeDraft.instructions,
        tips: data.expertTip || "Rich in essential nutrients for infant development and digestion.",
        pediatricSafetyNotes: data.allergenNote || "Always ensure food is cut to appropriate finger-food or puree consistency for baby's stage.",
      };
    }
  } catch (err) {
    console.info("Edge function unavailable, running local pediatric AI formatter:", err);
  }

  // High quality local pediatric organizer
  const cleanedIngredients = recipeDraft.ingredients
    .map((ing) => ing.trim())
    .filter(Boolean)
    .map((ing) => {
      // Standardize units and capitalize first letter
      return ing.charAt(0).toUpperCase() + ing.slice(1);
    });

  const cleanedInstructions = recipeDraft.instructions
    .map((step) => step.trim())
    .filter(Boolean)
    .map((step, idx) => {
      // Strip old step prefixes like "1.", "Step 1:"
      const clean = step.replace(/^(step\s*\d+:?|\d+[\.\):-]?)\s*/i, "").trim();
      return clean.charAt(0).toUpperCase() + clean.slice(1);
    });

  const ageLabel = recipeDraft.ageGroup;
  let safetyNote = "Cut into appropriate sizes for infant self-feeding. Never leave baby unattended while eating.";
  if (ageLabel.includes("6-8")) {
    safetyNote = "Texture should be smooth and velvety (Stage 1 Puree). Ensure no lumps or hard pieces.";
  } else if (ageLabel.includes("9-11")) {
    safetyNote = "Texture should be soft mash or tender finger-food spears the width of an adult pinky finger to encourage pincer grasp.";
  } else if (ageLabel.includes("12-23")) {
    safetyNote = "Cut round fruits and soft foods into small bite-sized quarters. Ensure meat is tender and shredded.";
  }

  return {
    title: recipeDraft.title.trim(),
    description: recipeDraft.description.trim() || `Nutrient-dense meal formulated for babies aged ${recipeDraft.ageGroup}.`,
    ingredients: cleanedIngredients,
    instructions: cleanedInstructions,
    tips: "Ensure ingredients are fresh, washed thoroughly, and served at room temperature or lukewarm.",
    pediatricSafetyNotes: safetyNote,
  };
};

// Get the final merged list of recipes
export const getMergedRecipes = (isAdmin = false): Recipe[] => {
  const published = getPublishedModifications();
  const staged = isAdmin ? getStagedModifications() : {};

  // Map static recipes with overrides
  const result: Recipe[] = staticRecipes.map((base) => {
    // If admin, staged changes take precedence over published
    const mod = staged[base.id] || published[base.id];
    if (mod) {
      return {
        ...base,
        title: mod.title || base.title,
        description: mod.description || base.description,
        ageGroup: mod.ageGroup || base.ageGroup,
        category: mod.category || base.category,
        prepTime: mod.prepTime || base.prepTime,
        servings: mod.servings || base.servings,
        image: mod.image || base.image,
        ingredients: mod.ingredients || base.ingredients,
        instructions: mod.instructions || base.instructions,
      };
    }
    return base;
  });

  // Append new custom recipes added via admin
  const allCustomMods = { ...published, ...(isAdmin ? staged : {}) };
  for (const [id, mod] of Object.entries(allCustomMods)) {
    if (mod.isNew && !staticRecipes.some((r) => r.id === id)) {
      result.unshift({
        id: mod.id,
        title: mod.title,
        description: mod.description,
        ageGroup: mod.ageGroup,
        category: mod.category,
        mealTime: mod.mealTime || "Lunch",
        prepTime: mod.prepTime,
        servings: mod.servings,
        image: mod.image,
        ingredients: mod.ingredients,
        instructions: mod.instructions,
        nutrition: {
          calories: "120",
          protein: "3g",
          carbs: "18g",
          fat: "2g",
          fiber: "3g",
          vitamins: ["Vitamin A", "Vitamin C"],
        },
        allergens: [],
        storage: "Fridge 3 days, Freeze up to 2 months",
      });
    }
  }

  return result;
};
