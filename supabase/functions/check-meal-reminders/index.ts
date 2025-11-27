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

interface PushSubscriptionRecord {
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

// Helper to convert Uint8Array to ArrayBuffer for crypto operations
function toBuffer(arr: Uint8Array): ArrayBuffer {
  return arr.buffer.slice(arr.byteOffset, arr.byteOffset + arr.byteLength) as ArrayBuffer;
}

// Base64 URL decode helper
function base64UrlDecode(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - base64.length % 4) % 4);
  const rawData = atob(base64 + padding);
  return Uint8Array.from(rawData, c => c.charCodeAt(0));
}

// Base64 URL encode helper
function base64UrlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// HKDF implementation
async function hkdf(
  ikm: Uint8Array,
  salt: Uint8Array,
  info: Uint8Array,
  length: number
): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    toBuffer(ikm),
    { name: 'HKDF' },
    false,
    ['deriveBits']
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: toBuffer(salt),
      info: toBuffer(info)
    },
    keyMaterial,
    length * 8
  );
  
  return new Uint8Array(derivedBits);
}

// Create info bytes for HKDF
function createInfo(type: string, context: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(type);
  const info = new Uint8Array(typeBytes.length + 1 + context.length);
  info.set(typeBytes);
  info[typeBytes.length] = 0;
  info.set(context, typeBytes.length + 1);
  return info;
}

async function sendWebPushNotification(
  subscription: PushSubscriptionRecord,
  title: string,
  body: string,
  motherName?: string
): Promise<boolean> {
  try {
    let vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    let vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('❌ VAPID keys not configured');
      return false;
    }

    // Clean up VAPID keys
    vapidPublicKey = vapidPublicKey.replace(/^["']|["']$/g, '').trim();
    vapidPrivateKey = vapidPrivateKey.replace(/^["']|["']$/g, '').trim();

    console.log('🔑 VAPID public key length:', vapidPublicKey.length);

    const personalizedBody = motherName ? `Hi ${motherName}! ${body}` : body;

    const payload = JSON.stringify({
      title,
      body: personalizedBody,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: 'meal-reminder',
      data: {
        url: '/planner',
        timestamp: Date.now()
      }
    });

    // Parse endpoint URL for audience
    const endpointUrl = new URL(subscription.endpoint);
    const audience = `${endpointUrl.protocol}//${endpointUrl.host}`;

    // Create JWT for VAPID authentication
    const jwtHeader = { typ: 'JWT', alg: 'ES256' };
    const jwtPayload = {
      aud: audience,
      exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
      sub: 'mailto:support@babybites.app'
    };

    const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(jwtHeader)));
    const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(jwtPayload)));
    const unsignedToken = `${headerB64}.${payloadB64}`;

    // Import VAPID private key as JWK
    const jwk = {
      kty: 'EC',
      crv: 'P-256',
      d: vapidPrivateKey,
      x: vapidPublicKey.substring(0, 43),
      y: vapidPublicKey.substring(43)
    };
    
    let privateKey;
    try {
      privateKey = await crypto.subtle.importKey(
        'jwk',
        jwk,
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['sign']
      );
    } catch (e) {
      console.error('❌ Failed to import VAPID private key:', e);
      return false;
    }

    const signature = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      privateKey,
      new TextEncoder().encode(unsignedToken)
    );

    const signatureBytes = new Uint8Array(signature);
    const signatureB64 = base64UrlEncode(signatureBytes);
    const vapidToken = `${unsignedToken}.${signatureB64}`;

    // Generate ephemeral ECDH key pair for encryption
    const localKeyPair = await crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: 'P-256' },
      true,
      ['deriveBits']
    );

    // Export local public key
    const localPublicKeyRaw = await crypto.subtle.exportKey('raw', localKeyPair.publicKey);
    const localPublicKeyBytes = new Uint8Array(localPublicKeyRaw);

    // Import user's p256dh key
    const p256dhBytes = base64UrlDecode(subscription.keys.p256dh);
    const userPublicKey = await crypto.subtle.importKey(
      'raw',
      toBuffer(p256dhBytes),
      { name: 'ECDH', namedCurve: 'P-256' },
      false,
      []
    );

    // Derive shared secret
    const sharedSecretBits = await crypto.subtle.deriveBits(
      { name: 'ECDH', public: userPublicKey },
      localKeyPair.privateKey,
      256
    );
    const sharedSecret = new Uint8Array(sharedSecretBits);

    // Get auth secret
    const authSecret = base64UrlDecode(subscription.keys.auth);

    // Derive encryption keys using HKDF
    const authInfo = new TextEncoder().encode('Content-Encoding: auth\0');
    const prk = await hkdf(sharedSecret, authSecret, authInfo, 32);

    // Create context for key derivation
    const context = new Uint8Array(1 + 2 + 65 + 2 + 65);
    context[0] = 0;
    context[1] = 0;
    context[2] = 65;
    context.set(p256dhBytes, 3);
    context[68] = 0;
    context[69] = 65;
    context.set(localPublicKeyBytes, 70);

    const cekInfo = createInfo('Content-Encoding: aes128gcm', context);
    const nonceInfo = createInfo('Content-Encoding: nonce', context);

    const cek = await hkdf(prk, new Uint8Array(0), cekInfo, 16);
    const nonce = await hkdf(prk, new Uint8Array(0), nonceInfo, 12);

    // Encrypt payload with AES-GCM
    const payloadBytes = new TextEncoder().encode(payload);
    const paddedPayload = new Uint8Array(payloadBytes.length + 2);
    paddedPayload.set(payloadBytes);
    paddedPayload[payloadBytes.length] = 2;
    paddedPayload[payloadBytes.length + 1] = 0;

    const aesKey = await crypto.subtle.importKey(
      'raw',
      toBuffer(cek),
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: toBuffer(nonce) },
      aesKey,
      toBuffer(paddedPayload)
    );

    // Build aes128gcm header
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const recordSize = new Uint8Array(4);
    new DataView(recordSize.buffer).setUint32(0, 4096, false);
    
    const header = new Uint8Array(16 + 4 + 1 + 65);
    header.set(salt);
    header.set(recordSize, 16);
    header[20] = 65;
    header.set(localPublicKeyBytes, 21);

    // Combine header and encrypted payload
    const encryptedPayload = new Uint8Array(header.length + encrypted.byteLength);
    encryptedPayload.set(header);
    encryptedPayload.set(new Uint8Array(encrypted), header.length);

    console.log('📤 Sending push notification to:', subscription.endpoint.substring(0, 60) + '...');

    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'Authorization': `vapid t=${vapidToken}, k=${vapidPublicKey}`,
        'TTL': '86400',
        'Urgency': 'high'
      },
      body: encryptedPayload
    });

    console.log(`📬 Push response: ${response.status} ${response.statusText}`);

    if (response.status === 410 || response.status === 404) {
      console.log(`📭 Subscription expired for user ${subscription.user_id}`);
      return false;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Push failed: ${errorText}`);
      return false;
    }

    console.log('✅ Push notification sent successfully');
    return true;
  } catch (error) {
    console.error('❌ Error sending push notification:', error);
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

    console.log(`⏰ Checking meal reminders for ${currentHour}:${currentMinute.toString().padStart(2, '0')}`);

    // Get all enabled notification preferences for this time
    const { data: preferences, error: prefsError } = await supabase
      .from('notification_preferences')
      .select('user_id, meal_type, hour, minute, enabled')
      .eq('enabled', true)
      .eq('hour', currentHour)
      .eq('minute', currentMinute);

    if (prefsError) {
      console.error('❌ Error fetching preferences:', prefsError);
      throw prefsError;
    }

    if (!preferences || preferences.length === 0) {
      console.log('📭 No preferences found for this time');
      return new Response(
        JSON.stringify({ message: 'No reminders to send', count: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 Found ${preferences.length} reminders to process`);

    let sentCount = 0;
    let failedCount = 0;
    const expiredSubscriptions: string[] = [];

    for (const pref of preferences as NotificationPreference[]) {
      console.log(`👤 Processing reminder for user ${pref.user_id}, meal: ${pref.meal_type}`);
      
      const { data: subscriptions, error: subError } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', pref.user_id);

      if (subError) {
        console.error(`❌ Error fetching subscriptions for user ${pref.user_id}:`, subError);
        continue;
      }

      if (!subscriptions || subscriptions.length === 0) {
        console.log(`📭 No subscription found for user ${pref.user_id}`);
        continue;
      }

      console.log(`📱 Found ${subscriptions.length} subscription(s) for user ${pref.user_id}`);

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

      const notificationTitle = `${mealInfo.emoji} ${mealInfo.title}`;

      for (const sub of subscriptions as PushSubscriptionRecord[]) {
        const success = await sendWebPushNotification(sub, notificationTitle, mealInfo.body, motherName);

        if (success) {
          sentCount++;
        } else {
          failedCount++;
          expiredSubscriptions.push(sub.id);
        }
      }
    }

    if (expiredSubscriptions.length > 0) {
      console.log(`🧹 Cleaning up ${expiredSubscriptions.length} expired subscriptions`);
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('id', expiredSubscriptions);
    }

    console.log(`📊 Summary: Sent ${sentCount}, Failed ${failedCount}`);

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
    console.error('💥 Error in check-meal-reminders:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
