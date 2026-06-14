import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseService = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const userClient = createClient(supabaseUrl, supabaseAnon, { global: { headers: { Authorization: authHeader } } });
    const admin = createClient(supabaseUrl, supabaseService);

    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: isAdmin } = await admin.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!isAdmin) return new Response(JSON.stringify({ error: 'Admin required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { caption } = await req.json();
    if (!caption || typeof caption !== 'string') {
      return new Response(JSON.stringify({ error: 'caption required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const systemPrompt = `You are Dr. NutriExpert, a professional baby nutritionist. Transform messy recipe captions (often from TikTok/Instagram) into structured baby-led-weaning recipe data in CLEAN ENGLISH.

Rules:
- Write professionally, warmly, no hashtags, no emojis in text fields (except where natural).
- Description: 2-3 sentences, emphasize WHY it's good for baby (texture, nutrition, BLW-friendly).
- Steps: clear, numbered procedural sentences. No "step 1:" prefix.
- Ingredients: list with exact quantities. One per line.
- Always include an expert tip rooted in baby nutrition (iron, vitamin A, texture for chewing, etc).
- ageLabel: "6 months+", "8 months+", "10 months+", or "12 months+".
- difficulty: "Easy" or "Medium".
- nutritionHighlights: 3 short bullet points (e.g., "Iron-rich for development").
- allergenNote: include ONLY if recipe contains common allergens (peanut, egg, dairy, wheat, fish, etc). Otherwise null.

Return ONLY valid JSON, no markdown fences.`;

    const userPrompt = `Transform this rough recipe caption into structured data:\n\n${caption}\n\nReturn JSON matching this exact shape:\n{\n  "title": "string",\n  "shortTitle": "string (max 25 chars)",\n  "description": "string (2-3 sentences)",\n  "ageLabel": "string",\n  "minAgeMonths": number,\n  "prepTime": "string like '10 min'",\n  "cookTime": "string like '15 min'",\n  "totalTime": "string like '25 min'",\n  "servings": "string",\n  "difficulty": "Easy" | "Medium",\n  "videoDuration": "string like '0:25'",\n  "ingredients": ["string", ...],\n  "steps": ["string", ...],\n  "storage": "string",\n  "expertTip": "string",\n  "nutritionHighlights": ["string", "string", "string"],\n  "allergenNote": "string or null"\n}`;

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Lovable-API-Key': LOVABLE_API_KEY },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error('AI error:', aiRes.status, errText);
      if (aiRes.status === 429) return new Response(JSON.stringify({ error: 'Rate limited. Try again in a moment.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (aiRes.status === 402) return new Response(JSON.stringify({ error: 'AI credits exhausted. Add credits to your workspace.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      throw new Error(`AI gateway: ${aiRes.status}`);
    }

    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty AI response');

    const cleaned = content.replace(/```json\n?|\n?```/g, '').trim();
    const recipe = JSON.parse(cleaned);

    return new Response(JSON.stringify({ recipe }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error('organize-video-recipe error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
