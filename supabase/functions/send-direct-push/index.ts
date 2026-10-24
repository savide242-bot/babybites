import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendWebPushNotification, getVapidKeys } from '../_shared/webpush.ts';

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

    const { user_id, email, title, body } = await req.json();

    let resolvedUserId = user_id as string | undefined;

    if (!resolvedUserId && email) {
      const { data: usersPage, error: usersError } = await supabase.auth.admin.listUsers();
      if (!usersError && usersPage?.users) {
        resolvedUserId = usersPage.users.find((user) => user.email?.toLowerCase() === String(email).toLowerCase())?.id;
      }
    }

    const vapidKeys = getVapidKeys();
    if (!vapidKeys) {
      return new Response(JSON.stringify({ error: 'VAPID keys not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let query = supabase.from('push_subscriptions').select('id, endpoint, p256dh, auth, user_id');
    if (resolvedUserId) {
      query = query.eq('user_id', resolvedUserId);
    }

    const { data: subscriptions, error: subError } = await query;

    if (subError) {
      return new Response(JSON.stringify({ error: subError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!subscriptions || subscriptions.length === 0) {
      // Diagnostic check of how many total users exist
      const { data: usersList } = await supabase.auth.admin.listUsers();
      return new Response(JSON.stringify({ 
        error: 'No active push subscriptions found in database',
        totalRegisteredUsersInAuth: usersList?.users?.length || 0,
        resolvedUserId: resolvedUserId || null
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results = [];
    for (const sub of subscriptions) {
      const result = await sendWebPushNotification(
        {
          id: sub.id,
          user_id: sub.user_id,
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        {
          title: title || '🎉 Teste BabyBites!',
          body: body || 'As tuas notificações estão a funcionar! 🍎',
          icon: 'https://babybites.lovable.app/icon-192x192.png',
          badge: 'https://babybites.lovable.app/icon-192x192.png',
          tag: `test-notification-${Date.now()}`,
          data: { url: '/' },
        },
        vapidKeys.publicKey,
        vapidKeys.privateKey
      );

      if (result.expired) {
        await supabase.from('push_subscriptions').delete().eq('id', sub.id);
      }

      results.push({ subscriptionId: sub.id, ...result });
    }

    return new Response(JSON.stringify({ user_id: resolvedUserId, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
