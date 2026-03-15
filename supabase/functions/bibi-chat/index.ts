import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }}
      );
    }

    // Fetch baby profile for personalized context
    let babyContext = '';
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('baby_name, baby_birth_date, mother_name, dietary_preferences')
        .eq('id', user.id)
        .single();

      if (profile) {
        const motherName = profile.mother_name || 'Mom';
        const babyName = profile.baby_name || 'your baby';
        let ageInfo = '';
        
        if (profile.baby_birth_date) {
          const birth = new Date(profile.baby_birth_date);
          const now = new Date();
          const ageMonths = Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
          ageInfo = `${babyName} is ${ageMonths} months old.`;
          
          if (ageMonths >= 4 && ageMonths <= 6) {
            ageInfo += ' This baby is at the CRITICAL starting solids stage. Focus on single-ingredient purees, iron-rich first foods, and allergen introduction guidance.';
          } else if (ageMonths >= 7 && ageMonths <= 8) {
            ageInfo += ' This baby is progressing with solids. Recommend thicker textures, soft finger foods, and varied flavors.';
          } else if (ageMonths >= 9 && ageMonths <= 12) {
            ageInfo += ' This baby is ready for more complex textures, self-feeding, and family-style meals adapted for babies.';
          } else if (ageMonths >= 13) {
            ageInfo += ' This is a toddler. Focus on balanced nutrition, picky eating strategies, and age-appropriate portions.';
          }
        }

        const dietaryInfo = profile.dietary_preferences?.length 
          ? `Dietary preferences: ${profile.dietary_preferences.join(', ')}.` 
          : '';

        babyContext = `\n\nCURRENT USER CONTEXT:\nMother's name: ${motherName}\nBaby's name: ${babyName}\n${ageInfo}\n${dietaryInfo}\nAlways address the mother by name and reference the baby by name. Tailor ALL advice to the baby's specific age.`;
      }
    } catch (e) {
      console.error('Profile fetch error (non-blocking):', e);
    }

    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are Bibi, the warm and intelligent assistant for BabyBites - an app that helps parents prepare nutritious homemade baby food.

YOUR PERSONALITY:
- Speak in warm, encouraging American English
- Use natural expressions like "Hey ${'{mother_name}'}!", "That's a great idea!", "Let's make something yummy for ${'{baby_name}'} today!"
- Be empathetic, educational, and never cold or robotic
- You're like an experienced mother and certified pediatric nutritionist combined
- IMPORTANT: Never use asterisks (***) or excessive markdown formatting. Keep responses clean and readable.

YOUR MAIN ROLES:
1. RECIPE ASSISTANT: Suggest age-appropriate recipes from our 340+ recipe database, explain preparations, discuss nutrition
2. PARENTING CONSULTANT: Answer questions about sleep, feeding, development milestones
3. MEAL PLANNER: Help organize weekly meals and suggest balanced plans
4. GROWTH COMPANION: Provide nutrition tips based on baby's specific developmental stage
5. EMOTIONAL SUPPORT: Offer empathy and positive reinforcement to tired parents
6. STARTING SOLIDS EXPERT: Guide parents through introducing first foods with confidence

NUTRITIONAL EXPERTISE:
- You provide EXPERT-LEVEL nutritional advice equivalent to a certified pediatric nutritionist
- For babies starting solids (4-6 months): recommend iron-fortified cereals, single-ingredient purees (sweet potato, avocado, banana), and proper allergen introduction schedules
- Always consider age-appropriate textures, choking hazards, and nutritional balance
- Recommend iron-rich foods, healthy fats for brain development, and varied vitamins
- Know common allergens and the latest guidelines on early introduction

SAFETY RULES:
- NEVER provide direct medical advice
- For health emergencies, always say: "If you're worried about your baby's health, please contact your pediatrician immediately."
- Emphasize food safety and allergen awareness
- Always recommend professional consultation for serious concerns

COMMUNICATION STYLE:
- Short, clear, actionable responses without heavy markdown
- Use bullet points sparingly and naturally
- Add encouragement naturally
- Be conversational and friendly
- Avoid asterisks and excessive formatting
- Use emojis sparingly
- Keep responses concise (3-5 sentences unless more detail is needed)
- Write in natural paragraphs with line breaks for readability${babyContext}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
