import { supabase } from "@/integrations/supabase/client";

/**
 * BABYBITES API SECURITY GATEWAY & MIDDLEWARE
 * -------------------------------------------
 * Intercepts requests between the UI (screen) and Supabase (database)
 * 1. Sanitizes inputs (strips XSS / injection payloads)
 * 2. Enforces IDOR protection (user can only write to their own user_id)
 * 3. Client-side rate limiting (prevents spam and denial of service)
 * 4. Role & Permission verification
 */

// Rate limiting state
const requestHistory: Record<string, number[]> = {};
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 40; // Max 40 operations per minute per client

export class SecurityError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "SecurityError";
  }
}

// 1. Input Sanitization: Removes script tags, javascript: URIs, null bytes, and dangerous HTML
export const sanitizeInput = (val: any): any => {
  if (typeof val === "string") {
    return val
      .replace(/\0/g, "") // Null byte removal
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Strip script tags
      .replace(/javascript:[^\s]*/gi, "") // Strip javascript: URLs
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "") // Strip inline event handlers like onclick=
      .trim();
  }
  if (Array.isArray(val)) {
    return val.map(sanitizeInput);
  }
  if (val !== null && typeof val === "object") {
    const cleaned: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      cleaned[sanitizeInput(k)] = sanitizeInput(v);
    }
    return cleaned;
  }
  return val;
};

// 2. Rate Limiting Check
export const checkRateLimit = (actionKey = "global"): boolean => {
  const now = Date.now();
  if (!requestHistory[actionKey]) {
    requestHistory[actionKey] = [];
  }

  // Filter timestamps within the window
  requestHistory[actionKey] = requestHistory[actionKey].filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
  );

  if (requestHistory[actionKey].length >= MAX_REQUESTS_PER_WINDOW) {
    return false; // Rate limit exceeded
  }

  requestHistory[actionKey].push(now);
  return true;
};

// 3. User Identity & Session Verification
export const getVerifiedSession = async () => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.user) {
    throw new SecurityError("Unauthorized: Active user session required.", "AUTH_REQUIRED");
  }

  return session;
};

// 4. Admin Role Verification Guard
export const verifyAdminPermission = async (): Promise<string> => {
  const session = await getVerifiedSession();

  const { data: roleData, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", session.user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (error || !roleData) {
    throw new SecurityError("Forbidden: Admin privileges required.", "ADMIN_REQUIRED");
  }

  return session.user.id;
};

/**
 * SECURE API GATEWAY WRAPPER
 * All UI components write to the database through this gateway.
 */
export const apiGateway = {
  /**
   * Secure INSERT: Validates user_id against authenticated session and sanitizes payload
   */
  async insert<T = any>(table: any, payload: Record<string, any>): Promise<T> {
    if (!checkRateLimit(`insert_${table}`)) {
      throw new SecurityError("Too many requests. Please wait a moment.", "RATE_LIMITED");
    }

    const session = await getVerifiedSession();
    const sanitized = sanitizeInput(payload);

    // IDOR Protection: If payload contains a user_id, ensure it strictly matches the logged-in user
    if ("user_id" in sanitized) {
      if (sanitized.user_id !== session.user.id) {
        throw new SecurityError("Security Violation: Cannot write data for another user account.", "IDOR_PREVENTED");
      }
    } else {
      // Auto-assign authenticated user_id if relevant
      sanitized.user_id = session.user.id;
    }

    const { data, error } = await (supabase.from(table) as any)
      .insert(sanitized)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Secure UPDATE: Ensures user can only update their own records
   */
  async update<T = any>(table: any, id: string, payload: Record<string, any>): Promise<T> {
    if (!checkRateLimit(`update_${table}`)) {
      throw new SecurityError("Too many requests. Please wait a moment.", "RATE_LIMITED");
    }

    const session = await getVerifiedSession();
    const sanitized = sanitizeInput(payload);

    // Never allow changing user_id
    delete sanitized.user_id;

    const { data, error } = await (supabase.from(table) as any)
      .update(sanitized)
      .eq("id", id)
      .eq("user_id", session.user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Secure DELETE: Ensures user can only delete their own records
   */
  async delete(table: any, id: string): Promise<void> {
    if (!checkRateLimit(`delete_${table}`)) {
      throw new SecurityError("Too many requests. Please wait a moment.", "RATE_LIMITED");
    }

    const session = await getVerifiedSession();

    const { error } = await (supabase.from(table) as any)
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (error) throw error;
  },

  /**
   * Secure QUERY (Read): Always enforces user_id equality unless explicitly public
   */
  async queryOwn<T = any[]>(table: any): Promise<T> {
    const session = await getVerifiedSession();

    const { data, error } = await (supabase.from(table) as any)
      .select("*")
      .eq("user_id", session.user.id);

    if (error) throw error;
    return data as T;
  },
};
