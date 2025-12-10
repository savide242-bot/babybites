import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper functions for Web Push encryption
function toBuffer(arr: Uint8Array): ArrayBuffer {
  return arr.buffer.slice(arr.byteOffset, arr.byteOffset + arr.byteLength) as ArrayBuffer;
}

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

function createInfo(type: string, context: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(type);
  const info = new Uint8Array(typeBytes.length + 1 + context.length);
  info.set(typeBytes);
  info[typeBytes.length] = 0;
  info.set(context, typeBytes.length + 1);
  return info;
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
  try {
    let vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    let vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      return { success: false, error: 'VAPID keys not configured' };
    }

    // Clean up VAPID keys
    vapidPublicKey = vapidPublicKey.replace(/^["']|["']$/g, '').trim();
    vapidPrivateKey = vapidPrivateKey.replace(/^["']|["']$/g, '').trim();

    console.log('🔑 VAPID public key length:', vapidPublicKey.length);
    console.log('🔑 VAPID private key length:', vapidPrivateKey.length);

    const payload = JSON.stringify({
      title,
      body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: 'test-notification',
      data: {
        url: '/',
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
      return { success: false, error: `VAPID key import failed: ${e}` };
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

    console.log('📤 Sending test push notification to:', subscription.endpoint.substring(0, 60) + '...');

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
      return { success: false, error: 'Subscription expired', status: response.status };
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Push failed: ${errorText}`);
      return { success: false, error: errorText, status: response.status };
    }

    console.log('✅ Test push notification sent successfully');
    return { success: true, status: response.status };
  } catch (error) {
    console.error('❌ Error sending push notification:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
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
      console.error('❌ Error fetching subscription:', subError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscription', details: subError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('📭 No subscription found for user');
      return new Response(
        JSON.stringify({ 
          error: 'No push subscription found', 
          message: 'Please enable notifications first in Settings > Meal Reminders',
          subscriptionCount: 0
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📱 Found ${subscriptions.length} subscription(s)`);

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
      `Hi ${motherName}! Your meal reminders are working perfectly! You'll receive notifications at your scheduled times.`
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
            message: 'Your notification subscription has expired. Please re-enable notifications in Settings.',
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
    console.error('💥 Error in test-push-notification:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});