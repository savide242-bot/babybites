import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecipeToGenerate {
  id: string;
  title: string;
  ingredients?: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipes, maxCount = 5 } = await req.json() as { 
      recipes: RecipeToGenerate[]; 
      maxCount?: number 
    };

    if (!recipes || !Array.isArray(recipes) || recipes.length === 0) {
      return new Response(
        JSON.stringify({ error: 'recipes array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Limit to prevent rate limiting
    const recipesToProcess = recipes.slice(0, maxCount);
    const results: Array<{ id: string; success: boolean; imageUrl?: string; error?: string }> = [];

    console.log(`🎨 Starting batch generation for ${recipesToProcess.length} recipes`);

    for (const recipe of recipesToProcess) {
      try {
        console.log(`📸 Generating image for recipe ${recipe.id}: ${recipe.title}`);

        // Create a detailed prompt for baby food
        const ingredientList = recipe.ingredients?.slice(0, 4).join(', ') || '';
        const prompt = `Professional food photography of baby food: "${recipe.title}". 
A beautiful, appetizing dish in a cute baby bowl or small ceramic plate. 
${ingredientList ? `Made with ${ingredientList}.` : ''}
Soft natural lighting from the left, warm inviting colors, shallow depth of field, 
garnished elegantly with fresh herbs, shot from 45-degree angle, 
clean white marble or light wood background, high-end food magazine style.
Safe, healthy, colorful baby meal presentation. Ultra high resolution.`;

        // Call Lovable AI to generate image
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-image-preview',
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            modalities: ['image', 'text']
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ AI error for ${recipe.id}:`, response.status, errorText);
          
          if (response.status === 429) {
            results.push({ id: recipe.id, success: false, error: 'Rate limit exceeded' });
            // Stop processing more to avoid more rate limit errors
            break;
          }
          
          results.push({ id: recipe.id, success: false, error: `API error: ${response.status}` });
          continue;
        }

        const data = await response.json();
        const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!imageUrl) {
          results.push({ id: recipe.id, success: false, error: 'No image generated' });
          continue;
        }

        // Extract base64 data and upload to storage
        const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, '');
        const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        
        const fileName = `recipe-${recipe.id}-unique-${Date.now()}.png`;
        
        // Upload to storage bucket
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('recipe-images')
          .upload(fileName, imageBuffer, {
            contentType: 'image/png',
            upsert: true
          });

        if (uploadError) {
          console.error(`❌ Upload error for ${recipe.id}:`, uploadError);
          results.push({ 
            id: recipe.id, 
            success: true, 
            imageUrl: imageUrl, // Return base64 as fallback
            error: 'Storage upload failed, using base64'
          });
          continue;
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from('recipe-images')
          .getPublicUrl(fileName);

        console.log(`✅ Image generated for ${recipe.id}: ${publicUrlData.publicUrl}`);
        results.push({ 
          id: recipe.id, 
          success: true, 
          imageUrl: publicUrlData.publicUrl 
        });

        // Add delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (recipeError) {
        console.error(`💥 Error for recipe ${recipe.id}:`, recipeError);
        results.push({ 
          id: recipe.id, 
          success: false, 
          error: recipeError instanceof Error ? recipeError.message : 'Unknown error' 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`🏁 Batch complete: ${successCount}/${results.length} successful`);

    return new Response(
      JSON.stringify({ 
        success: true,
        processed: results.length,
        successful: successCount,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Batch error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
