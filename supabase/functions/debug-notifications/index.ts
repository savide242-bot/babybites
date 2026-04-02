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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Require authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user and check admin role
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = claimsData.claims.sub;

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await adminClient.rpc('has_role', { _user_id: userId, _role: 'admin' });
    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // --- Admin verified, proceed with diagnostics ---
    const supabase = adminClient;

    // 1. Check VAPID keys
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    
    const vapidStatus = {
      publicKeyExists: !!vapidPublicKey,
      privateKeyExists: !!vapidPrivateKey,
      publicKeyLength: vapidPublicKey?.replace(/^["']|["']$/g, '').trim().length || 0,
      privateKeyLength: vapidPrivateKey?.replace(/^["']|["']$/g, '').trim().length || 0,
    };

    // 2. Get push subscriptions (truncated for safety)
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('id, user_id, endpoint, created_at, updated_at');

    // 3. Get notification preferences
    const { data: preferences } = await supabase
      .from('notification_preferences')
      .select('user_id, meal_type, hour, minute, enabled');

    // 4. Current time info
    const now = new Date();

    // 5. Build diagnostic report (redact sensitive data)
    const report = {
      timestamp: now.toISOString(),
      vapidKeys: vapidStatus,
      subscriptions: {
        count: subscriptions?.length || 0,
        list: subscriptions?.map((s: any) => ({
          id: s.id.substring(0, 8) + '...',
          userId: s.user_id.substring(0, 8) + '...',
          endpoint: s.endpoint.substring(0, 50) + '...',
          createdAt: s.created_at,
        })) || [],
      },
      preferences: {
        count: preferences?.length || 0,
        enabled: preferences?.filter((p: any) => p.enabled).length || 0,
        byMealType: preferences?.reduce((acc: Record<string, number>, p: any) => {
          acc[p.meal_type] = (acc[p.meal_type] || 0) + 1;
          return acc;
        }, {}) || {},
      },
      issues: [] as string[],
    };

    if (!vapidStatus.publicKeyExists || !vapidStatus.privateKeyExists) {
      report.issues.push('VAPID keys are not configured');
    }
    if ((subscriptions?.length || 0) === 0) {
      report.issues.push('No push subscriptions found');
    }

    return new Response(JSON.stringify(report, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
