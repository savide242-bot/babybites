import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image, babyAgeMonths } = await req.json();

    if (!image) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing food for ${babyAgeMonths} month old baby...`);

    const systemPrompt = `You are an expert pediatric nutritionist AI. Analyze the food/ingredient in the image and provide detailed nutritional analysis specifically for a ${babyAgeMonths}-month-old baby.

Your response MUST be valid JSON with this exact structure:
{
  "identified_food": "Name of the identified food/ingredient",
  "is_recommended": true or false,
  "recommendation_reason": "Detailed explanation why this food is or isn't recommended for a ${babyAgeMonths}-month-old",
  "estimated_calories": number (estimated calories per typical baby serving),
  "estimated_protein_g": number,
  "estimated_carbs_g": number,
  "estimated_fats_g": number,
  "vitamins": ["Vitamin A", "Vitamin C", etc.],
  "minerals": ["Iron", "Calcium", etc.],
  "allergens": ["Potential allergen 1", "Potential allergen 2"],
  "choking_risk": "Description of choking risk and how to mitigate it, or 'Low risk' if safe",
  "preparation_tips": "How to safely prepare this food for a ${babyAgeMonths}-month-old baby",
  "suggested_recipes": ["Recipe idea 1", "Recipe idea 2", "Recipe idea 3"],
  "confidence_score": number between 0 and 1
}

Age-specific guidelines:
- 4-6 months: Only single-ingredient purees, no allergens
- 6-8 months: Smooth purees, can introduce common allergens one at a time
- 8-10 months: Mashed foods with small soft lumps, finger foods
- 10-12 months: Chopped soft foods, more texture variety
- 12-24 months: Most family foods in appropriate sizes
- 24-36 months: Nearly all foods with proper preparation

IMPORTANT: 
- Be specific about the food you identify
- Calculate realistic nutritional estimates for baby-sized portions
- Always prioritize safety - when in doubt, recommend against
- Consider choking hazards seriously
- Provide actionable preparation tips`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this food image for a ${babyAgeMonths}-month-old baby. Identify the food, assess if it's safe and nutritious for this age, and provide detailed nutritional information. Return ONLY valid JSON.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Service temporarily unavailable. Please try again later.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to analyze food' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('No content in AI response');
      return new Response(
        JSON.stringify({ error: 'No analysis result received' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Raw AI response:', content.substring(0, 500));

    // Parse JSON from the response
    let analysisResult;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Content that failed to parse:', content);
      
      // Return a fallback response
      return new Response(
        JSON.stringify({
          identified_food: "Unable to identify",
          is_recommended: false,
          recommendation_reason: "Could not analyze the image properly. Please try with a clearer photo.",
          estimated_calories: 0,
          estimated_protein_g: 0,
          estimated_carbs_g: 0,
          estimated_fats_g: 0,
          vitamins: [],
          minerals: [],
          allergens: [],
          choking_risk: "Unknown - please consult a healthcare provider",
          preparation_tips: "Please retake the photo with better lighting",
          suggested_recipes: [],
          confidence_score: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully analyzed food:', analysisResult.identified_food);

    return new Response(
      JSON.stringify(analysisResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in analyze-food function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});