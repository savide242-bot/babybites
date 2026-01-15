// ==================== UNIFIED WEB PUSH MODULE ====================
// This module is shared by ALL edge functions that need to send push notifications
// It implements VAPID JWT signing and AES-GCM encryption correctly for all platforms including iOS

export interface PushSubscription {
  id?: string;
  user_id?: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
  actions?: Array<{ action: string; title: string }>;
  requireInteraction?: boolean;
}

export interface SendResult {
  success: boolean;
  expired: boolean;
  status?: number;
  error?: string;
}

// ==================== HELPER FUNCTIONS ====================

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

// ==================== VAPID JWT GENERATION ====================

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

  // Convert signature to raw format
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

// ==================== PAYLOAD ENCRYPTION (AES-128-GCM) ====================

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

// ==================== MAIN SEND FUNCTION ====================

export async function sendWebPushNotification(
  subscription: PushSubscription,
  notification: NotificationPayload,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<SendResult> {
  try {
    // Build the full notification payload
    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/icon-192x192.png',
      badge: notification.badge || '/icon-192x192.png',
      tag: notification.tag || `notification-${Date.now()}`,
      data: notification.data || { url: '/', timestamp: Date.now() },
      actions: notification.actions || [],
      requireInteraction: notification.requireInteraction || false,
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
      return { success: true, expired: false, status: response.status };
    } else {
      const errorText = await response.text();
      console.error('❌ Push service error:', response.status, errorText);
      
      // Check if subscription expired
      const expired = response.status === 410 || response.status === 404;
      return { success: false, expired, status: response.status, error: errorText };
    }
  } catch (error) {
    console.error('💥 Error sending push:', error);
    return { 
      success: false, 
      expired: false,
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

// ==================== BATCH SEND HELPER ====================

export async function sendToMultipleSubscriptions(
  subscriptions: PushSubscription[],
  notification: NotificationPayload,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<{ sent: number; failed: number; expired: string[] }> {
  const expiredIds: string[] = [];
  let sent = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    const result = await sendWebPushNotification(
      sub,
      notification,
      vapidPublicKey,
      vapidPrivateKey
    );

    if (result.success) {
      sent++;
    } else {
      failed++;
      if (result.expired && sub.id) {
        expiredIds.push(sub.id);
      }
    }
  }

  return { sent, failed, expired: expiredIds };
}

// ==================== VAPID KEY HELPERS ====================

export function cleanVapidKey(key: string): string {
  return key.replace(/^['"]|['"]$/g, '').trim();
}

export function getVapidKeys(): { publicKey: string; privateKey: string } | null {
  let publicKey = Deno.env.get('VAPID_PUBLIC_KEY');
  let privateKey = Deno.env.get('VAPID_PRIVATE_KEY');

  if (!publicKey || !privateKey) {
    console.error('❌ VAPID keys not configured');
    return null;
  }

  return {
    publicKey: cleanVapidKey(publicKey),
    privateKey: cleanVapidKey(privateKey),
  };
}
