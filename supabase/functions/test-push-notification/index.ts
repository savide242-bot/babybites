import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ==================== VAPID / WEB PUSH HELPERS ====================

function base64UrlDecode(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - base64.length % 4) % 4);
  const rawData = atob(base64 + padding);
  return Uint8Array.from(rawData, c => c.charCodeAt(0));
}

function base64UrlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function toBuffer(arr: Uint8Array): ArrayBuffer {
  return arr.buffer.slice(arr.byteOffset, arr.byteOffset + arr.byteLength) as ArrayBuffer;
}

async function hkdf(ikm: Uint8Array, salt: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey('raw', toBuffer(ikm), { name: 'HKDF' }, false, ['deriveBits']);
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: toBuffer(salt), info: toBuffer(info) },
    keyMaterial,
    length * 8
  );
  return new Uint8Array(derivedBits);
}

function createInfo(type: string, context: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(type);
  const info = new Uint8Array(typeBytes.length + 1 + context.length);
  info.set(typeBytes);
  info[typeBytes.length] = 0;
  info.set(context, typeBytes.length + 1);
  return info;
}

// Properly decode VAPID public key (65-byte uncompressed EC point) to x and y coordinates
function decodeVapidPublicKey(vapidPublicKey: string): { x: string; y: string } {
  const publicKeyBytes = base64UrlDecode(vapidPublicKey);
  
  // Uncompressed EC point format: 0x04 || x (32 bytes) || y (32 bytes)
  if (publicKeyBytes.length !== 65 || publicKeyBytes[0] !== 0x04) {
    throw new Error(`Invalid VAPID public key format. Length: ${publicKeyBytes.length}, First byte: ${publicKeyBytes[0]}`);
  }
  
  const x = publicKeyBytes.slice(1, 33);
  const y = publicKeyBytes.slice(33, 65);
  
  return {
    x: base64UrlEncode(x),
    y: base64UrlEncode(y)
  };
}

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

async function sendWebPushNotification(
  subscription: PushSubscription,
  title: string,
  body: string
): Promise<{ success: boolean; error?: string; status?: number }> {
  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

  if (!vapidPublicKey || !vapidPrivateKey) {
    return { success: false, error: 'VAPID keys not configured' };
  }

  try {
    const webpush = await import('https://esm.sh/web-push@3.6.7');

    webpush.setVapidDetails(
      'mailto:support@babybites.app',
      vapidPublicKey.replace(/^['"]|['"]$/g, '').trim(),
      vapidPrivateKey.replace(/^['"]|['"]$/g, '').trim()
    );

    const payload = JSON.stringify({
      title,
      body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      // Unique tag so repeated tests always show as a new notification
      tag: `test-${Date.now()}`,
      data: { url: '/', timestamp: Date.now() }
    });

    console.log('📤 Sending test push to:', subscription.endpoint.substring(0, 60) + '...');

    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      payload,
      {
        TTL: 60 * 60 * 24,
        urgency: 'high',
      }
    );

    console.log('✅ Push accepted by provider');
    return { success: true, status: 201 };
  } catch (error: any) {
    const status = error?.statusCode ?? error?.status;
    const details = error?.body ?? error?.message ?? String(error);
    console.error('❌ web-push error:', { status, details });
    return { success: false, status, error: details };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid user' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🧪 Testing push notification for user ${user.id}`);

    // Get user's push subscription
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user.id);

    if (subError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscription', details: subError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'No push subscription found',
          message: 'Please enable notifications first in Settings > Meal Reminders',
          subscriptionCount: 0
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user profile for personalization
    const { data: profile } = await supabase
      .from('profiles')
      .select('mother_name')
      .eq('id', user.id)
      .single();

    const motherName = profile?.mother_name || 'Mom';

    // Send test notification
    const subscription = subscriptions[0];
    const result = await sendWebPushNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys as { p256dh: string; auth: string }
      },
      '🔔 Test Notification',
      `Hi ${motherName}! Your meal reminders are working perfectly!`
    );

    if (result.success) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Test notification sent successfully!',
          subscriptionCount: subscriptions.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // If subscription is expired, delete it
      if (result.status === 410 || result.status === 404) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('id', subscription.id);

        return new Response(
          JSON.stringify({
            error: 'Subscription expired',
            message: 'Please re-enable notifications in Settings.',
            needsResubscribe: true
          }),
          { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          error: 'Failed to send notification',
          details: result.error,
          status: result.status
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('💥 Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
