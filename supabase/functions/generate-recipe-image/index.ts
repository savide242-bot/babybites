import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipeId, recipeTitle, ingredients } = await req.json();

    if (!recipeId || !recipeTitle) {
      return new Response(
        JSON.stringify({ error: 'recipeId and recipeTitle are required' }),
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

    console.log(`🎨 Generating image for recipe: ${recipeTitle}`);

    // Create a detailed prompt for baby food
    const ingredientList = ingredients?.slice(0, 5).join(', ') || '';
    const prompt = `Professional food photography of baby food: "${recipeTitle}". 
A beautiful, appetizing dish in a cute baby bowl or small plate. 
${ingredientList ? `Made with ${ingredientList}.` : ''}
Soft natural lighting, warm colors, shallow depth of field, 
garnished elegantly, shot from 45-degree angle, 
clean white or pastel background, high-end food magazine style.
Safe, healthy, colorful baby meal presentation.`;

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
      console.error('❌ AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded, please try again later' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to generate image' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error('❌ No image in response');
      return new Response(
        JSON.stringify({ error: 'No image generated' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Image generated for ${recipeTitle}`);

    // Initialize Supabase to store the image reference
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract base64 data and upload to storage
    const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    const fileName = `recipe-${recipeId}-${Date.now()}.png`;
    
    // Upload to storage bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('recipe-images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      // Return the base64 image if storage fails
      return new Response(
        JSON.stringify({ 
          success: true, 
          imageUrl: imageUrl,
          stored: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('recipe-images')
      .getPublicUrl(fileName);

    console.log(`📦 Image stored: ${publicUrlData.publicUrl}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl: publicUrlData.publicUrl,
        stored: true,
        recipeId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
