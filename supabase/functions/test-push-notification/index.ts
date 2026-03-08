import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ==================== VAPID / WEB PUSH NATIVE IMPLEMENTATION ====================

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

function toArrayBuffer(arr: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(arr.length);
  new Uint8Array(buffer).set(arr);
  return buffer;
}

function concatUint8Arrays(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

async function generateVapidAuthHeader(
  audience: string,
  subject: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<{ authorization: string; cryptoKey: string }> {
  const header = { typ: 'JWT', alg: 'ES256' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60, // 12 hours
    sub: subject,
  };

  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import private key for signing
  const privateKeyBytes = base64UrlDecode(vapidPrivateKey);
  const publicKeyBytes = base64UrlDecode(vapidPublicKey);

  // Create JWK for the private key
  const x = base64UrlEncode(publicKeyBytes.slice(1, 33));
  const y = base64UrlEncode(publicKeyBytes.slice(33, 65));
  const d = base64UrlEncode(privateKeyBytes);

  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    x,
    y,
    d,
  };

  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(unsignedToken)
  );

  // Convert DER signature to raw format if needed
  const signatureBytes = new Uint8Array(signature);
  let r: Uint8Array, s: Uint8Array;
  
  if (signatureBytes.length === 64) {
    r = signatureBytes.slice(0, 32);
    s = signatureBytes.slice(32, 64);
  } else {
    r = signatureBytes.slice(0, 32);
    s = signatureBytes.slice(32);
  }

  const rawSignature = concatUint8Arrays(r, s);
  const signatureB64 = base64UrlEncode(rawSignature);

  const jwt = `${unsignedToken}.${signatureB64}`;

  return {
    authorization: `vapid t=${jwt}, k=${vapidPublicKey}`,
    cryptoKey: `p256ecdsa=${vapidPublicKey}`,
  };
}

async function encryptPayload(
  payload: string,
  p256dhKey: string,
  authSecret: string
): Promise<{ ciphertext: Uint8Array; salt: Uint8Array; localPublicKey: Uint8Array }> {
  const userPublicKeyBytes = base64UrlDecode(p256dhKey);
  const userAuthBytes = base64UrlDecode(authSecret);

  // Generate ephemeral key pair
  const localKeyPair = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits']
  );

  // Export local public key
  const localPublicKeyRaw = await crypto.subtle.exportKey('raw', localKeyPair.publicKey);
  const localPublicKey = new Uint8Array(localPublicKeyRaw);

  // Import user's public key
  const userPublicKey = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(userPublicKeyBytes),
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

  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // HKDF for IKM
  const authInfo = new TextEncoder().encode('Content-Encoding: auth\0');
  const prkKey = await crypto.subtle.importKey('raw', toArrayBuffer(sharedSecret), { name: 'HKDF' }, false, ['deriveBits']);
  const ikmBits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: toArrayBuffer(userAuthBytes), info: toArrayBuffer(authInfo) },
    prkKey,
    256
  );
  const ikm = new Uint8Array(ikmBits);

  // Create context for key derivation
  const keyInfoPrefix = new TextEncoder().encode('Content-Encoding: aes128gcm\0');
  const keyInfo = concatUint8Arrays(keyInfoPrefix);

  const nonceInfoPrefix = new TextEncoder().encode('Content-Encoding: nonce\0');
  const nonceInfo = concatUint8Arrays(nonceInfoPrefix);

  // Derive encryption key and nonce
  const prkKey2 = await crypto.subtle.importKey('raw', toArrayBuffer(ikm), { name: 'HKDF' }, false, ['deriveBits']);
  
  const keyBits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: toArrayBuffer(salt), info: toArrayBuffer(keyInfo) },
    prkKey2,
    128
  );
  const contentEncryptionKey = new Uint8Array(keyBits);

  const nonceBits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: toArrayBuffer(salt), info: toArrayBuffer(nonceInfo) },
    prkKey2,
    96
  );
  const nonce = new Uint8Array(nonceBits);

  // Encrypt with AES-GCM
  const aesKey = await crypto.subtle.importKey('raw', toArrayBuffer(contentEncryptionKey), { name: 'AES-GCM' }, false, ['encrypt']);
  
  const payloadBytes = new TextEncoder().encode(payload);
  const paddedPayload = concatUint8Arrays(payloadBytes, new Uint8Array([2])); // Add delimiter

  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce },
    aesKey,
    toArrayBuffer(paddedPayload)
  );
  const ciphertext = new Uint8Array(ciphertextBuffer);

  return { ciphertext, salt, localPublicKey };
}

function buildAes128GcmBody(
  ciphertext: Uint8Array,
  salt: Uint8Array,
  localPublicKey: Uint8Array,
  recordSize: number = 4096
): Uint8Array {
  const header = new Uint8Array(86);
  header.set(salt, 0); // 16 bytes salt
  new DataView(header.buffer).setUint32(16, recordSize, false); // 4 bytes record size
  header[20] = localPublicKey.length; // 1 byte key length
  header.set(localPublicKey, 21); // 65 bytes public key

  return concatUint8Arrays(header, ciphertext);
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
  body: string,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<{ success: boolean; error?: string; status?: number }> {
  try {
    const payload = JSON.stringify({
      title,
      body,
      icon: 'https://storage.googleapis.com/gpt-engineer-file-uploads/L51M0kwelTgOzVygYpkcrDBNd6g2/uploads/1760365341349-yum.png',
      badge: 'https://storage.googleapis.com/gpt-engineer-file-uploads/L51M0kwelTgOzVygYpkcrDBNd6g2/uploads/1760365341349-yum.png',
      tag: `notification-${Date.now()}`,
      data: { url: '/', timestamp: Date.now() }
    });

    console.log('📤 Preparing push notification...');
    console.log('📍 Endpoint:', subscription.endpoint.substring(0, 80) + '...');

    // Get audience from endpoint URL
    const endpointUrl = new URL(subscription.endpoint);
    const audience = `${endpointUrl.protocol}//${endpointUrl.host}`;

    // Generate VAPID authorization header
    const vapidHeaders = await generateVapidAuthHeader(
      audience,
      'mailto:support@babybites.app',
      vapidPublicKey,
      vapidPrivateKey
    );

    // Encrypt the payload
    const { ciphertext, salt, localPublicKey } = await encryptPayload(
      payload,
      subscription.keys.p256dh,
      subscription.keys.auth
    );

    // Build the encrypted body
    const encryptedBody = buildAes128GcmBody(ciphertext, salt, localPublicKey);

    console.log('🔐 Payload encrypted, sending to push service...');

    // Send the push notification
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'Authorization': vapidHeaders.authorization,
        'TTL': '86400',
        'Urgency': 'high',
      },
      body: toArrayBuffer(encryptedBody),
    });

    console.log('📬 Push service response:', response.status, response.statusText);

    if (response.ok || response.status === 201) {
      console.log('✅ Push notification sent successfully!');
      return { success: true, status: response.status };
    } else {
      const errorText = await response.text();
      console.error('❌ Push service error:', response.status, errorText);
      return { success: false, status: response.status, error: errorText };
    }
  } catch (error) {
    console.error('💥 Error sending push:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔔 test-push-notification function called');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get VAPID keys
    let vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    let vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('❌ VAPID keys not configured');
      return new Response(
        JSON.stringify({ error: 'VAPID keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean up keys (remove quotes if present)
    vapidPublicKey = vapidPublicKey.replace(/^['"]|['"]$/g, '').trim();
    vapidPrivateKey = vapidPrivateKey.replace(/^['"]|['"]$/g, '').trim();

    console.log('🔑 VAPID public key length:', vapidPublicKey.length);
    console.log('🔑 VAPID private key length:', vapidPrivateKey.length);

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
      console.error('❌ Failed to fetch subscription:', subError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscription', details: subError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('📭 No push subscription found for user');
      return new Response(
        JSON.stringify({
          error: 'No push subscription found',
          message: 'Please enable notifications first in Settings',
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
    console.log('📱 Subscription endpoint type:', 
      subscription.endpoint.includes('apple') ? 'Apple' :
      subscription.endpoint.includes('google') ? 'Google FCM' :
      subscription.endpoint.includes('mozilla') ? 'Mozilla' : 'Other'
    );

    const result = await sendWebPushNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys as { p256dh: string; auth: string }
      },
      '🔔 Test Notification',
      `Hi ${motherName}! Your meal reminders are working perfectly!`,
      vapidPublicKey,
      vapidPrivateKey
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
        console.log('🗑️ Deleting expired subscription');
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
