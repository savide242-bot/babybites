import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { barcode } = await req.json();
    
    console.log(`Verifying product with barcode: ${barcode}`);
    
    // Call Open Food Facts API
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
      {
        headers: {
          'User-Agent': 'BabyBites - Baby Nutrition App - Version 1.0'
        }
      }
    );
    
    if (!response.ok) {
      console.error(`API request failed with status: ${response.status}`);
      return new Response(
        JSON.stringify({ 
          found: false, 
          message: 'Unable to verify product. Please try again.' 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const data = await response.json();
    
    if (data.status === 0 || !data.product) {
      console.log(`Product not found in Open Food Facts database`);
      return new Response(
        JSON.stringify({ 
          found: false, 
          message: 'Product not found in our database. This barcode may not be registered yet.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const product = data.product;
    console.log(`Product found: ${product.product_name}`);
    
    // Analyze for baby safety
    const safetyAnalysis = analyzeBabySafety(product);
    
    return new Response(
      JSON.stringify({
        found: true,
        product_name: product.product_name || 'Unknown Product',
        brands: product.brands || 'Unknown Brand',
        ingredients: product.ingredients_text || 'Ingredients not available',
        allergens: product.allergens_tags || [],
        nutrition_grade: product.nutrition_grades || 'unknown',
        is_baby_safe: safetyAnalysis.safe,
        safety_notes: safetyAnalysis.notes,
        image_url: product.image_url || product.image_front_url || null,
        nutriscore: product.nutriscore_grade || null,
        nova_group: product.nova_group || null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error: any) {
    console.error('Error in verify-product function:', error);
    return new Response(
      JSON.stringify({ 
        found: false,
        error: 'An error occurred while verifying the product',
        message: error?.message || 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

/**
 * Analyzes product safety for babies based on ingredients and nutrition
 */
function analyzeBabySafety(product: any): { safe: boolean; notes: string } {
  const warnings: string[] = [];
  let safe = true;
  
  const ingredientsText = (product.ingredients_text || '').toLowerCase();
  
  // Critical: Check for honey (dangerous for babies <12 months)
  if (ingredientsText.includes('honey') || ingredientsText.includes('mel')) {
    warnings.push('⚠️ Contains HONEY - NOT suitable for babies under 12 months (botulism risk)');
    safe = false;
  }
  
  // Check for added sugars
  if (
    ingredientsText.includes('sugar') || 
    ingredientsText.includes('syrup') ||
    ingredientsText.includes('glucose') ||
    ingredientsText.includes('fructose') ||
    ingredientsText.includes('sucrose')
  ) {
    warnings.push('⚠️ Contains added sugars - Not recommended for babies');
    safe = false;
  }
  
  // Check for high salt content
  const saltContent = product.nutriments?.salt_100g || 0;
  if (saltContent > 0.5) {
    warnings.push(`⚠️ High salt content (${saltContent.toFixed(2)}g per 100g) - Not suitable for babies`);
    safe = false;
  }
  
  // Check for artificial additives
  if (ingredientsText.includes('e1') || ingredientsText.includes('e2') || ingredientsText.includes('e3')) {
    warnings.push('⚠️ Contains artificial additives - Not recommended for babies');
    safe = false;
  }
  
  // Check allergens
  const allergens = product.allergens_tags || [];
  if (allergens.length > 0) {
    const allergenList = allergens
      .map((a: string) => a.replace('en:', '').replace(/-/g, ' '))
      .join(', ');
    warnings.push(`ℹ️ Contains allergens: ${allergenList} - Introduce with caution`);
  }
  
  // Check NOVA group (food processing level)
  const novaGroup = product.nova_group;
  if (novaGroup === 4) {
    warnings.push('⚠️ Ultra-processed food (NOVA 4) - Not ideal for babies');
    safe = false;
  } else if (novaGroup === 3) {
    warnings.push('ℹ️ Processed food (NOVA 3) - Use sparingly');
  }
  
  // Nutriscore check
  const nutriscore = (product.nutriscore_grade || '').toLowerCase();
  if (nutriscore === 'd' || nutriscore === 'e') {
    warnings.push(`⚠️ Poor nutritional quality (Nutri-Score: ${nutriscore.toUpperCase()}) - Not recommended`);
    safe = false;
  }
  
  // Default message if no warnings
  if (warnings.length === 0) {
    return {
      safe: true,
      notes: '✓ No obvious concerns detected. Always verify with your pediatrician before introducing new foods to babies, especially under 12 months.'
    };
  }
  
  return {
    safe,
    notes: warnings.join('\n')
  };
}
