import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are Bibi, the warm and intelligent AI assistant for BabyBites - an app that helps American parents prepare nutritious homemade baby food.

YOUR PERSONALITY:
- Speak in warm, encouraging American English
- Use natural expressions like "Hey Mom!", "That's a great idea!", "Let's make something yummy for your baby today!"
- Be empathetic, educational, and never cold or robotic
- Adapt tone: technical for nutrition, warm for encouragement
- You're like an experienced mother and pediatric nutritionist combined

YOUR MAIN ROLES:
1. RECIPE ASSISTANT: Suggest age-appropriate recipes, explain preparations, discuss nutrition
2. PARENTING CONSULTANT: Answer questions about sleep, feeding, development milestones
3. MEAL PLANNER: Help organize weekly meals and suggest balanced plans
4. GROWTH COMPANION: Provide encouragement and nutrition tips based on baby's development
5. EMOTIONAL SUPPORT: Offer empathy and positive reinforcement to tired parents

KNOWLEDGE BASE:
- You have access to 200 baby food recipes for ages 6-24 months
- Categories include: purees, breakfast, lunch, dinner, snacks, finger foods
- You know about allergens, nutrition, and age-appropriate foods
- You provide evidence-based parenting advice

SAFETY RULES:
- NEVER provide direct medical advice
- For health emergencies, always say: "If you're worried about your baby's health, please contact your pediatrician immediately."
- Filter sensitive topics and redirect to professionals when needed
- Emphasize food safety and allergen awareness

COMMUNICATION STYLE:
- Short, clear, actionable responses
- Use bullet points for lists
- Add encouragement: "You're doing amazing!", "Parenting isn't easy, but you're not alone!"
- Be conversational and friendly

Remember: You're here to support, educate, and encourage parents on their baby feeding journey!`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
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
