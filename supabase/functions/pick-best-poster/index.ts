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

    const { frames } = await req.json();
    if (!Array.isArray(frames) || frames.length === 0) {
      return new Response(JSON.stringify({ error: 'frames array required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Each frame is a data URL data:image/jpeg;base64,...
    const content: any[] = [
      {
        type: 'text',
        text: `You are selecting the most attractive thumbnail for a baby food recipe video. Look at these ${frames.length} candidate frames (numbered 0 to ${frames.length - 1}) and pick the SINGLE BEST one as the video poster.\n\nCriteria (in order):\n1. Food must be clearly visible, sharp, and centered\n2. Bright, well-lit, appetizing colors\n3. NO text overlays covering the food (avoid frames with big captions like "Recipe", "Ingredients", "Step 1" etc.)\n4. Clean, finished plating preferred over messy work-in-progress shots\n5. No motion blur, no hands in motion, no half-finished cooking\n\nReturn ONLY valid JSON: { "bestIndex": <number 0-${frames.length - 1}>, "reason": "<short reason>" }`,
      },
      ...frames.map((url: string) => ({ type: 'image_url', image_url: { url } })),
    ];

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Lovable-API-Key': LOVABLE_API_KEY },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [{ role: 'user', content }],
        response_format: { type: 'json_object' },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error('AI poster pick error:', aiRes.status, errText);
      // Fallback: middle frame
      return new Response(JSON.stringify({ bestIndex: Math.floor(frames.length / 2), reason: 'fallback (AI unavailable)' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const aiData = await aiRes.json();
    const raw = aiData.choices?.[0]?.message?.content || '{}';
    const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
    let parsed: any = {};
    try { parsed = JSON.parse(cleaned); } catch { parsed = {}; }
    let idx = Number(parsed.bestIndex);
    if (!Number.isFinite(idx) || idx < 0 || idx >= frames.length) idx = Math.floor(frames.length / 2);

    return new Response(JSON.stringify({ bestIndex: idx, reason: parsed.reason || '' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error('pick-best-poster error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Internal error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
