import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPreference {
  user_id: string;
  meal_type: string;
  hour: number;
  minute: number;
  enabled: boolean;
}

interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

const MEAL_MESSAGES: Record<string, { title: string; body: string; emoji: string }> = {
  'breakfast': {
    title: 'Good Morning! Breakfast Time',
    body: "Start baby's day with a nutritious breakfast!",
    emoji: '🍳'
  },
  'morning-snack': {
    title: 'Morning Snack Time',
    body: 'A healthy snack keeps baby energized!',
    emoji: '🍎'
  },
  'lunch': {
    title: 'Lunch Time!',
    body: 'Time for a delicious and balanced lunch!',
    emoji: '🥗'
  },
  'afternoon-snack': {
    title: 'Afternoon Snack',
    body: 'Keep baby happy with a tasty snack!',
    emoji: '🍌'
  },
  'dinner': {
    title: 'Dinner Time!',
    body: 'End the day with a wholesome dinner!',
    emoji: '🍽️'
  }
};

async function sendWebPushNotification(
  subscription: PushSubscription,
  title: string,
  body: string,
  motherName?: string
): Promise<boolean> {
  try {
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('VAPID keys not configured');
      return false;
    }

    const personalizedBody = motherName ? `Hi ${motherName}! ${body}` : body;

    const payload = JSON.stringify({
      title,
      body: personalizedBody,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: 'meal-reminder',
      vibrate: [200, 100, 200],
      requireInteraction: false,
      data: {
        url: '/planner',
        timestamp: Date.now()
      }
    });

    // Parse endpoint to get audience (for VAPID)
    const endpointUrl = new URL(subscription.endpoint);
    const audience = `${endpointUrl.protocol}//${endpointUrl.host}`;

    // Create JWT for VAPID authentication
    const encoder = new TextEncoder();
    const header = {
      typ: 'JWT',
      alg: 'ES256'
    };
    
    const jwtPayload = {
      aud: audience,
      exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60, // 12 hours
      sub: 'mailto:support@babybites.app'
    };

    const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const payloadB64 = btoa(JSON.stringify(jwtPayload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    
    // Import VAPID private key for signing
    const pemHeader = "-----BEGIN PRIVATE KEY-----";
    const pemFooter = "-----END PRIVATE KEY-----";
    const pemContents = vapidPrivateKey.substring(pemHeader.length, vapidPrivateKey.length - pemFooter.length).trim();
    const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      binaryDer,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      privateKey,
      encoder.encode(`${headerB64}.${payloadB64}`)
    );

    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    
    const vapidToken = `${headerB64}.${payloadB64}.${signatureB64}`;

    // Encrypt payload using p256dh and auth from subscription
    const p256dhKey = Uint8Array.from(atob(subscription.keys.p256dh), c => c.charCodeAt(0));
    const authSecret = Uint8Array.from(atob(subscription.keys.auth), c => c.charCodeAt(0));

    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'Authorization': `vapid t=${vapidToken}, k=${vapidPublicKey.replace(/=/g, '')}`,
        'TTL': '86400',
        'Urgency': 'high'
      },
      body: encoder.encode(payload)
    });

    console.log(`Push notification response: ${response.status} ${response.statusText}`);

    if (response.status === 410 || response.status === 404) {
      console.log(`Subscription expired for user ${subscription.user_id}`);
      return false;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Push notification failed: ${errorText}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
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

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    console.log(`Checking meal reminders for ${currentHour}:${currentMinute}`);

    // Get all enabled notification preferences for this time
    const { data: preferences, error: prefsError } = await supabase
      .from('notification_preferences')
      .select('user_id, meal_type, hour, minute, enabled')
      .eq('enabled', true)
      .eq('hour', currentHour)
      .eq('minute', currentMinute);

    if (prefsError) {
      throw prefsError;
    }

    if (!preferences || preferences.length === 0) {
      console.log('No preferences found for this time');
      return new Response(
        JSON.stringify({ message: 'No reminders to send', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${preferences.length} reminders to send`);

    let sentCount = 0;
    let failedCount = 0;
    const expiredSubscriptions: string[] = [];

    for (const pref of preferences as NotificationPreference[]) {
      // Get user's push subscription
      const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', pref.user_id);

      if (!subscriptions || subscriptions.length === 0) {
        console.log(`No subscription found for user ${pref.user_id}`);
        continue;
      }

      // Get user's mother name for personalization
      const { data: profile } = await supabase
        .from('profiles')
        .select('mother_name')
        .eq('id', pref.user_id)
        .single();

      const motherName = profile?.mother_name;
      const mealInfo = MEAL_MESSAGES[pref.meal_type] || {
        title: 'Meal Reminder',
        body: 'Time for a meal!',
        emoji: '🍽️'
      };

      const title = `${mealInfo.emoji} ${mealInfo.title}`;

      for (const sub of subscriptions as PushSubscription[]) {
        const success = await sendWebPushNotification(sub, title, mealInfo.body, motherName);

        if (success) {
          sentCount++;
        } else {
          failedCount++;
          expiredSubscriptions.push(sub.id);
        }
      }
    }

    // Clean up expired subscriptions
    if (expiredSubscriptions.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('id', expiredSubscriptions);
      console.log(`Cleaned up ${expiredSubscriptions.length} expired subscriptions`);
    }

    console.log(`Sent ${sentCount} notifications, ${failedCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentCount,
        failed: failedCount,
        expired: expiredSubscriptions.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in check-meal-reminders:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
