const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔑 get-vapid-key function called');
    
    let vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    
    if (!vapidPublicKey) {
      console.error('❌ VAPID_PUBLIC_KEY not configured in secrets');
      return new Response(
        JSON.stringify({ error: 'VAPID_PUBLIC_KEY not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Remove extra quotes if present (fix for stored values with quotes)
    vapidPublicKey = vapidPublicKey.replace(/^["']|["']$/g, '').trim();
    
    console.log('✅ VAPID key found, length:', vapidPublicKey.length);
    console.log('🔑 Key preview:', vapidPublicKey.substring(0, 20) + '...');

    return new Response(
      JSON.stringify({ vapidPublicKey }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('💥 Error in get-vapid-key function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
