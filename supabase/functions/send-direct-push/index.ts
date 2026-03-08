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

    const { user_id, title, body } = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const vapidKeys = getVapidKeys();
    if (!vapidKeys) {
      return new Response(JSON.stringify({ error: 'VAPID keys not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user_id);

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ error: 'No subscriptions found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sub = subscriptions[0];
    const result = await sendWebPushNotification(
      {
        id: sub.id,
        endpoint: sub.endpoint,
        keys: sub.keys as { p256dh: string; auth: string },
      },
      {
        title: title || '🎉 Teste BabyBites!',
        body: body || 'As tuas notificações estão a funcionar! 🍎',
        icon: 'https://storage.googleapis.com/gpt-engineer-file-uploads/L51M0kwelTgOzVygYpkcrDBNd6g2/uploads/1760365341349-yum.png',
        badge: 'https://storage.googleapis.com/gpt-engineer-file-uploads/L51M0kwelTgOzVygYpkcrDBNd6g2/uploads/1760365341349-yum.png',
        tag: 'test-notification',
      },
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );

    if (result.expired) {
      await supabase.from('push_subscriptions').delete().eq('id', sub.id);
    }

    return new Response(JSON.stringify({ result }), {
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
