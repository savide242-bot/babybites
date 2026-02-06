import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RecipeToFix {
  id: string;
  title: string;
  ingredients: string[];
}

interface RequestBody {
  recipes: RecipeToFix[];
  maxCount?: number;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    // Client for user verification
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is admin
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check admin role
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: RequestBody = await req.json();
    const { recipes, maxCount = 10 } = body;

    if (!recipes || !Array.isArray(recipes) || recipes.length === 0) {
      return new Response(
        JSON.stringify({ error: "No recipes provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Limit processing count for safety
    const recipesToProcess = recipes.slice(0, maxCount);
    const results: { id: string; success: boolean; imageUrl?: string; error?: string }[] = [];

    // Service role client for storage and database writes
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    for (const recipe of recipesToProcess) {
      try {
        // Generate image prompt from recipe details
        const topIngredients = recipe.ingredients.slice(0, 4).join(", ");
        const prompt = `Professional food photography of "${recipe.title}" for babies. A beautiful, appetizing dish showing ${topIngredients}. Soft natural lighting, shallow depth of field, clean white plate, colorful fresh ingredients visible. Baby food styling, nutritious and wholesome appearance. Ultra high resolution.`;

        // Check if LOVABLE_API_KEY is available
        if (!lovableApiKey) {
          results.push({
            id: recipe.id,
            success: false,
            error: "LOVABLE_API_KEY not configured",
          });
          continue;
        }

        // Generate image using Lovable AI
        const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image",
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
            modalities: ["image", "text"],
          }),
        });

        if (!imageResponse.ok) {
          const errorText = await imageResponse.text();
          results.push({
            id: recipe.id,
            success: false,
            error: `Image generation failed: ${errorText}`,
          });
          continue;
        }

        const imageData = await imageResponse.json();
        const generatedImageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!generatedImageUrl) {
          results.push({
            id: recipe.id,
            success: false,
            error: "No image returned from AI",
          });
          continue;
        }

        // Extract base64 data
        const base64Match = generatedImageUrl.match(/^data:image\/(\w+);base64,(.+)$/);
        if (!base64Match) {
          results.push({
            id: recipe.id,
            success: false,
            error: "Invalid image format returned",
          });
          continue;
        }

        const imageFormat = base64Match[1];
        const base64Data = base64Match[2];
        const imageBuffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));

        // Upload to Supabase Storage
        const fileName = `recipe-${recipe.id}.${imageFormat}`;
        const { error: uploadError } = await supabaseAdmin.storage
          .from("recipe-images")
          .upload(fileName, imageBuffer, {
            contentType: `image/${imageFormat}`,
            upsert: true,
          });

        if (uploadError) {
          results.push({
            id: recipe.id,
            success: false,
            error: `Upload failed: ${uploadError.message}`,
          });
          continue;
        }

        // Get public URL
        const { data: urlData } = supabaseAdmin.storage
          .from("recipe-images")
          .getPublicUrl(fileName);

        const publicUrl = urlData.publicUrl;

        // Upsert into recipe_image_overrides
        const { error: upsertError } = await supabaseAdmin
          .from("recipe_image_overrides")
          .upsert(
            {
              recipe_id: recipe.id,
              image_url: publicUrl,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "recipe_id" }
          );

        if (upsertError) {
          results.push({
            id: recipe.id,
            success: false,
            error: `Database update failed: ${upsertError.message}`,
          });
          continue;
        }

        results.push({
          id: recipe.id,
          success: true,
          imageUrl: publicUrl,
        });
      } catch (recipeError) {
        results.push({
          id: recipe.id,
          success: false,
          error: recipeError instanceof Error ? recipeError.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;

    return new Response(
      JSON.stringify({
        message: `Processed ${recipesToProcess.length} recipes: ${successCount} successful, ${failedCount} failed`,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in fix-recipe-images:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
