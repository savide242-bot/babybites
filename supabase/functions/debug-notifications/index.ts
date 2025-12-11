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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Check VAPID keys
    let vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    let vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    
    const vapidStatus = {
      publicKeyExists: !!vapidPublicKey,
      privateKeyExists: !!vapidPrivateKey,
      publicKeyLength: vapidPublicKey?.replace(/^["']|["']$/g, '').trim().length || 0,
      privateKeyLength: vapidPrivateKey?.replace(/^["']|["']$/g, '').trim().length || 0,
      publicKeyHasQuotes: vapidPublicKey?.startsWith('"') || vapidPublicKey?.startsWith("'") || false,
      privateKeyHasQuotes: vapidPrivateKey?.startsWith('"') || vapidPrivateKey?.startsWith("'") || false,
    };

    // 2. Get all push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('id, user_id, endpoint, created_at, updated_at');

    // 3. Get all notification preferences
    const { data: preferences, error: prefError } = await supabase
      .from('notification_preferences')
      .select('user_id, meal_type, hour, minute, enabled');

    // 4. Get user profiles for context
    const userIds = [...new Set([
      ...(subscriptions?.map((s: { user_id: string }) => s.user_id) || []),
      ...(preferences?.map((p: { user_id: string }) => p.user_id) || [])
    ])];

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, mother_name, baby_name')
      .in('id', userIds);

    // 5. Get recent activity logs related to notifications
    const { data: recentLogs } = await supabase
      .from('activity_logs')
      .select('*')
      .in('action_type', ['inactivity_reminder_sent', 'notification_sent'])
      .order('created_at', { ascending: false })
      .limit(20);

    // 6. Current time info
    const now = new Date();
    const currentTime = {
      iso: now.toISOString(),
      hour: now.getHours(),
      minute: now.getMinutes(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    // 7. Build diagnostic report
    const report = {
      timestamp: now.toISOString(),
      currentTime,
      vapidKeys: vapidStatus,
      subscriptions: {
        count: subscriptions?.length || 0,
        list: subscriptions?.map((s: { id: string; user_id: string; endpoint: string; created_at: string }) => ({
          id: s.id.substring(0, 8) + '...',
          userId: s.user_id.substring(0, 8) + '...',
          endpoint: s.endpoint.substring(0, 60) + '...',
          createdAt: s.created_at
        })) || []
      },
      preferences: {
        count: preferences?.length || 0,
        enabled: preferences?.filter((p: { enabled: boolean }) => p.enabled).length || 0,
        list: preferences?.map((p: { user_id: string; meal_type: string; hour: number; minute: number; enabled: boolean }) => ({
          userId: p.user_id.substring(0, 8) + '...',
          mealType: p.meal_type,
          time: `${p.hour}:${p.minute.toString().padStart(2, '0')}`,
          enabled: p.enabled
        })) || []
      },
      profiles: {
        count: profiles?.length || 0,
        list: profiles?.map((p: { id: string; mother_name: string | null; baby_name: string | null }) => ({
          id: p.id.substring(0, 8) + '...',
          motherName: p.mother_name || 'Not set',
          babyName: p.baby_name || 'Not set'
        })) || []
      },
      recentNotificationLogs: recentLogs?.map((l: { user_id: string | null; action_type: string; created_at: string | null }) => ({
        userId: l.user_id?.substring(0, 8) + '...',
        type: l.action_type,
        createdAt: l.created_at
      })) || [],
      issues: [] as string[]
    };

    // 8. Identify issues
    if (!vapidStatus.publicKeyExists || !vapidStatus.privateKeyExists) {
      report.issues.push('VAPID keys are not configured');
    }
    if (vapidStatus.publicKeyHasQuotes || vapidStatus.privateKeyHasQuotes) {
      report.issues.push('VAPID keys may have extra quotes');
    }
    if (vapidStatus.publicKeyLength !== 87) {
      report.issues.push(`VAPID public key has unexpected length: ${vapidStatus.publicKeyLength} (expected 87)`);
    }
    if ((subscriptions?.length || 0) === 0) {
      report.issues.push('No push subscriptions found - users need to enable notifications');
    }
    if ((preferences?.length || 0) === 0) {
      report.issues.push('No notification preferences found');
    }
    
    // Check for users with preferences but no subscription
    const usersWithPrefs = new Set(preferences?.map((p: { user_id: string }) => p.user_id) || []);
    const usersWithSubs = new Set(subscriptions?.map((s: { user_id: string }) => s.user_id) || []);
    const usersNeedingSub = [...usersWithPrefs].filter(u => !usersWithSubs.has(u));
    if (usersNeedingSub.length > 0) {
      report.issues.push(`${usersNeedingSub.length} user(s) have preferences but no push subscription`);
    }

    console.log('📊 Diagnostic Report Generated');
    console.log(JSON.stringify(report, null, 2));

    return new Response(
      JSON.stringify(report, null, 2),
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
