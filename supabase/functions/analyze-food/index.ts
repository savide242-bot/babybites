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

    console.log(`Analyzing food for ${babyAgeMonths} month old baby with expert AI nutritionist...`);

    // Expert pediatric nutritionist system prompt
    const expertSystemPrompt = `You are Dr. NutriExpert, an internationally certified pediatric nutritionist with 25+ years of clinical experience. You hold certifications from:
- American Academy of Pediatrics (AAP)
- World Health Organization (WHO) Infant Feeding Guidelines
- Academy of Nutrition and Dietetics

Your expertise includes:
- WHO/AAP infant feeding guidelines and developmental stages
- Food allergy introduction protocols (LEAP study, EAT study findings)
- Baby-led weaning (BLW) principles and safety
- Micronutrient bioavailability and absorption factors
- Choking hazard assessment and mitigation
- Texture progression for infant feeding development
- Nutrient interactions and optimal food combinations

CRITICAL AGE-SPECIFIC FEEDING GUIDELINES:
- 0-4 months: Breast milk or formula ONLY. No solid foods.
- 4-6 months: Single-ingredient purees only. Start with iron-fortified cereals, then vegetables, then fruits. No honey, cow's milk, or choking hazards.
- 6-8 months: Smooth purees progressing to thicker consistencies. Can introduce common allergens ONE at a time (peanut butter diluted, eggs, dairy). Watch for reactions 3-5 days.
- 8-10 months: Mashed foods with small soft lumps. Soft finger foods (banana, avocado pieces). More variety in proteins.
- 10-12 months: Chopped soft foods, more texture variety. Can try most family foods in appropriate sizes. Still avoid honey, whole nuts, raw vegetables.
- 12-18 months: Most table foods with proper preparation. Whole milk can replace formula. Small pieces, supervised eating.
- 18-24 months: Nearly all family foods. Focus on self-feeding skills. Still cut round foods (grapes, hot dogs) lengthwise.
- 24-36 months: Full diet variety with proper choking hazard modifications. Teaching healthy eating habits.

For a ${babyAgeMonths}-month-old baby, analyze the food in this image with EXTREME CLINICAL PRECISION.

Your response MUST be valid JSON with this EXACT structure:
{
  "identified_food": "Exact food name with variety/type if visible (e.g., 'Fuji Apple' not just 'Apple')",
  "confidence_score": 0.95,
  
  "is_recommended": true,
  "recommendation_level": "Highly Recommended",
  "recommendation_reason": "Detailed 2-3 sentence clinical explanation with specific benefits for ${babyAgeMonths}-month-old development",
  
  "portion_size_g": 30,
  "estimated_calories": 15,
  "estimated_protein_g": 0.1,
  "estimated_carbs_g": 4.0,
  "estimated_fats_g": 0.1,
  "estimated_fiber_g": 0.7,
  "estimated_sugar_g": 3.0,
  
  "daily_values": {
    "protein_pct": 2,
    "iron_pct": 1,
    "calcium_pct": 1,
    "vitamin_a_pct": 1,
    "vitamin_c_pct": 4,
    "zinc_pct": 1,
    "vitamin_d_pct": 0,
    "omega3_pct": 0
  },
  
  "vitamins": [
    { "name": "Vitamin C", "amount": "1.4mg", "benefit": "Immune system support and iron absorption enhancement", "daily_pct": 4 },
    { "name": "Vitamin A", "amount": "10mcg RAE", "benefit": "Vision development and skin health", "daily_pct": 2 }
  ],
  
  "minerals": [
    { "name": "Potassium", "amount": "35mg", "benefit": "Heart and muscle function, fluid balance", "daily_pct": 1 },
    { "name": "Iron", "amount": "0.04mg", "benefit": "Brain development and oxygen transport", "daily_pct": 1 }
  ],
  
  "allergens": ["None identified"],
  "allergen_introduction_advice": "This food is not a common allergen. Safe for introduction.",
  "is_common_allergen": false,
  
  "choking_risk_level": "Medium",
  "choking_risk_detail": "Raw apple is a HIGH choking hazard due to firm texture. MUST be cooked soft, grated, or pureed for babies under 12 months.",
  "texture_recommendation": "Pureed smooth",
  
  "preparation_tips": "1. Wash thoroughly and peel. 2. Core and remove seeds (contain trace cyanide). 3. Steam or microwave until very soft (fork easily pierces through). 4. Puree with breast milk/formula for extra nutrition. 5. For BLW: steam until very soft, cut into strips baby can grip.",
  "serving_temperature": "Room temperature or slightly warm",
  "storage_instructions": "Refrigerate puree in airtight container for 3-4 days. Freeze in ice cube trays for up to 3 months. Never refreeze thawed puree.",
  
  "combination_suggestions": [
    "Pair with iron-fortified cereal - Vitamin C enhances iron absorption by up to 6x",
    "Mix with plain full-fat yogurt (8+ months) for protein and probiotics",
    "Combine with cinnamon (small pinch) for flavor without added sugar"
  ],
  "avoid_combining_with": [
    "Honey (botulism risk under 12 months)",
    "Added sugars or sweeteners"
  ],
  
  "developmental_benefits": [
    "Sweet taste helps develop palate acceptance for fruits",
    "Soft texture practices tongue lateralization (8+ months)",
    "Self-feeding with strips develops pincer grasp (9+ months)"
  ],
  
  "introduction_timeline": "Apples can be introduced at 4-6 months as one of baby's first foods. Start with 1-2 teaspoons, once daily, for 3-5 days to monitor for reactions before introducing new foods.",
  
  "expert_notes": "Apples are an excellent first food choice. They are naturally sweet, which babies prefer, and rarely cause allergic reactions. The pectin fiber supports healthy gut bacteria development. Always cook for babies under 12 months to prevent choking.",
  
  "suggested_recipes": [
    { "name": "Simple Apple Puree", "description": "Steamed and pureed apple - perfect first food", "prep_time": "15 min", "difficulty": "Easy" },
    { "name": "Apple Oatmeal Bowl", "description": "Iron-fortified oats with apple puree for enhanced iron absorption", "prep_time": "10 min", "difficulty": "Easy" },
    { "name": "Apple Cinnamon Yogurt", "description": "Full-fat yogurt mixed with apple puree and tiny pinch of cinnamon (8+ months)", "prep_time": "5 min", "difficulty": "Easy" }
  ],
  
  "warning_signs": "Stop feeding and consult pediatrician if baby shows: hives, swelling, vomiting, diarrhea, or difficulty breathing after eating this food."
}

RECOMMENDATION_LEVEL OPTIONS (choose appropriately):
- "Highly Recommended" - Excellent nutritional choice, highly beneficial, no concerns
- "Recommended" - Good nutritional choice with clear benefits
- "Acceptable" - Safe to eat but not particularly nutritious for this age
- "Caution" - Can be given with specific modifications/supervision
- "Not Recommended" - Should avoid until older due to development/safety
- "Dangerous" - Never give to babies (e.g., honey under 12 months, whole nuts, raw shellfish)

CHOKING_RISK_LEVEL OPTIONS:
- "None" - Pureed or naturally very soft foods
- "Low" - Soft, easily dissolvable foods
- "Medium" - Needs proper preparation/cutting
- "High" - Firm texture, requires cooking/modification
- "Very High" - Round/cylindrical shape, sticky texture, requires extreme caution

TEXTURE_RECOMMENDATION OPTIONS (based on age):
- "Pureed smooth" (4-6 months)
- "Pureed with some texture" (6-7 months)
- "Mashed with soft lumps" (7-8 months)
- "Finely minced" (8-9 months)
- "Soft finger food pieces" (9-10 months)
- "Chopped small" (10-12 months)
- "Regular with modifications" (12+ months)

CRITICAL SAFETY RULES:
1. ALWAYS prioritize safety over nutrition
2. When in doubt, recommend AGAINST or suggest waiting
3. ALWAYS mention choking hazards for solid foods
4. NEVER recommend honey under 12 months
5. NEVER recommend whole nuts/seeds to any baby
6. ALWAYS recommend allergen introduction one at a time
7. Be SPECIFIC about preparation methods to reduce choking risk
8. Calculate realistic baby-portion sizes (usually 1-4 tablespoons for younger babies)`;

    const userPrompt = `Analyze this food image for a ${babyAgeMonths}-month-old baby. 

Identify the EXACT food item visible, then provide:
1. Comprehensive nutritional analysis with precise estimates
2. Age-appropriate safety assessment with specific choking risks
3. Expert preparation instructions to maximize nutrition and minimize risks
4. Clinical recommendations based on developmental stage
5. Specific recipes appropriate for this age

Be thorough and clinical. This analysis will guide a mother's feeding decisions.

Return ONLY valid JSON matching the specified structure. No additional text.`;

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
            content: expertSystemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: userPrompt
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
        max_tokens: 4000,
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

    console.log('Raw AI response length:', content.length);

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
      console.error('Content that failed to parse:', content.substring(0, 500));
      
      // Return a fallback response
      return new Response(
        JSON.stringify({
          identified_food: "Unable to identify",
          is_recommended: false,
          recommendation_level: "Caution",
          recommendation_reason: "Could not analyze the image properly. Please try with a clearer photo of the food item.",
          estimated_calories: 0,
          estimated_protein_g: 0,
          estimated_carbs_g: 0,
          estimated_fats_g: 0,
          vitamins: [],
          minerals: [],
          allergens: [],
          choking_risk_level: "Unknown",
          choking_risk_detail: "Unable to assess - please consult a healthcare provider",
          texture_recommendation: "Consult pediatrician",
          preparation_tips: "Please retake the photo with better lighting and a clear view of the food",
          suggested_recipes: [],
          confidence_score: 0,
          expert_notes: "Analysis could not be completed. Please try again with a clearer image."
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully analyzed food:', analysisResult.identified_food, 'Recommendation:', analysisResult.recommendation_level);

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
