import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-hotmart-hottok",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Generates a memorable, secure temporary password (e.g. Baby#9k4M2)
function generateTemporaryPassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let randomPart = "";
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `Baby#${randomPart}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed. Hotmart webhooks must be POST." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // 1. Parse body (supports JSON and application/x-www-form-urlencoded)
    let body: any = {};
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      body = await req.json();
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries());
    } else {
      // Fallback try reading as text then JSON
      const rawText = await req.text();
      try {
        body = JSON.parse(rawText);
      } catch {
        const params = new URLSearchParams(rawText);
        body = Object.fromEntries(params.entries());
      }
    }

    console.log("📥 Hotmart Webhook Received:", JSON.stringify(body, null, 2));

    // 2. Optional Hottok verification
    const expectedHottok = Deno.env.get("HOTMART_HOTTOK");
    const receivedHottok =
      req.headers.get("x-hotmart-hottok") ||
      body.hottok ||
      body.data?.hottok;

    if (expectedHottok && receivedHottok && expectedHottok !== receivedHottok) {
      console.warn("❌ Hotmart hottok token mismatch");
      return new Response(
        JSON.stringify({ error: "Invalid Hotmart security token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Extract event type and status
    const event = (body.event || body.status || "").toString().toUpperCase();
    const purchaseStatus = (
      body.data?.purchase?.status ||
      body.purchase?.status ||
      body.status ||
      ""
    ).toString().toUpperCase();

    // Handle cancellations / refunds if needed
    if (
      event.includes("REFUND") ||
      event.includes("CHARGEBACK") ||
      event.includes("CANCEL") ||
      purchaseStatus.includes("REFUND") ||
      purchaseStatus.includes("CHARGEBACK")
    ) {
      console.log(`ℹ️ Refund or Cancellation event received (${event || purchaseStatus}).`);
      return new Response(
        JSON.stringify({ success: true, message: "Cancellation noted" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Extract Buyer Details
    const rawEmail =
      body.data?.buyer?.email ||
      body.buyer?.email ||
      body.email ||
      body.buyer_email ||
      "";

    const rawName =
      body.data?.buyer?.name ||
      body.buyer?.name ||
      body.name ||
      body.first_name ||
      "Loving Mother";

    const transactionId =
      body.data?.purchase?.transaction ||
      body.purchase?.transaction ||
      body.transaction ||
      body.order_id ||
      `HM-${Date.now()}`;

    const cleanEmail = rawEmail.toString().trim().toLowerCase();
    const cleanName = rawName.toString().trim();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      console.warn("⚠️ Webhook missing valid buyer email. Payload was:", body);
      return new Response(
        JSON.stringify({ error: "Buyer email is missing or invalid in webhook payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Initialize Supabase Admin Client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 6. Generate temporary password
    const tempPassword = generateTemporaryPassword();
    let targetUserId = "";

    console.log(`👤 Processing account creation for: ${cleanEmail} (${cleanName})`);

    // 7. Create or Update user in Supabase Auth
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: cleanName,
        mother_name: cleanName,
        verified_buyer: true,
        must_change_password: true,
        source: "hotmart",
        hotmart_transaction: transactionId,
      },
    });

    if (createError) {
      // If user already exists, update their password so they can log in
      console.log(`User already exists or create returned notice: ${createError.message}. Updating password...`);
      const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = userList?.users?.find(
        (u) => u.email?.toLowerCase() === cleanEmail
      );

      if (existingUser) {
        targetUserId = existingUser.id;
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          existingUser.id,
          {
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
              ...(existingUser.user_metadata || {}),
              full_name: cleanName,
              mother_name: cleanName,
              verified_buyer: true,
              must_change_password: true,
              source: "hotmart",
              hotmart_transaction: transactionId,
            },
          }
        );
        if (updateError) {
          console.warn("Password update for existing user notice:", updateError);
        }
      } else {
        throw createError;
      }
    } else if (createData?.user?.id) {
      targetUserId = createData.user.id;
    }

    // 8. Upsert in profiles table
    if (targetUserId) {
      try {
        await supabaseAdmin.from("profiles").upsert(
          {
            id: targetUserId,
            full_name: cleanName,
            mother_name: cleanName,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );
      } catch (profileErr) {
        console.warn("Profile table update notice:", profileErr);
      }
    }

    // 9. Send Welcome Email via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    let emailSent = false;
    let emailError: string | null = null;

    const appUrl = Deno.env.get("APP_URL") || "https://babybites.app";
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "BabyBites <onboarding@resend.dev>";

    if (resendApiKey) {
      const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to BabyBites</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF9F5; margin: 0; padding: 24px; color: #2D3748; }
            .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 28px; border: 1px solid #EBE8DF; overflow: hidden; box-shadow: 0 10px 30px rgba(30, 94, 58, 0.06); }
            .header { background: linear-gradient(135deg, #FAF9F5 0%, #F5F3EC 100%); padding: 36px 24px 28px; text-align: center; border-bottom: 1px solid #EBE8DF; }
            .brand-tag { display: inline-block; padding: 4px 12px; border-radius: 9999px; background: rgba(30, 94, 58, 0.1); color: #1E5E3A; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
            .brand { font-family: Georgia, serif; font-size: 30px; font-weight: bold; color: #1E5E3A; letter-spacing: -0.5px; }
            .tagline { margin: 6px 0 0; font-size: 13px; color: #64748B; }
            .content { padding: 36px 28px; }
            .greeting { font-family: Georgia, serif; font-size: 22px; font-weight: bold; color: #1A202C; margin-bottom: 12px; }
            .body-text { font-size: 15px; line-height: 1.65; color: #4A5568; margin-bottom: 24px; }
            
            /* Credentials Card */
            .credentials-card { background: #EAF5EE; border-radius: 20px; padding: 22px; border: 1px solid #CCE0D2; margin: 26px 0; }
            .credentials-title { font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #1E5E3A; margin-bottom: 14px; display: flex; align-items: center; }
            .cred-row { background: #ffffff; border-radius: 12px; padding: 12px 16px; margin-bottom: 10px; border: 1px solid #D6E8DC; display: flex; justify-content: space-between; align-items: center; }
            .cred-label { font-size: 12px; color: #718096; font-weight: 600; }
            .cred-value { font-family: Monaco, Menlo, Consolas, monospace; font-size: 14px; color: #1E5E3A; font-weight: bold; word-break: break-all; }
            .cred-password { font-size: 16px; letter-spacing: 0.5px; color: #164E2E; background: #FAF9F5; padding: 3px 8px; border-radius: 6px; border: 1px solid #EBE8DF; }
            
            /* Action Button */
            .btn-container { text-align: center; margin: 32px 0 24px; }
            .btn { background-color: #1E5E3A; color: #ffffff !important; text-decoration: none; padding: 16px 36px; border-radius: 9999px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 6px 20px rgba(30, 94, 58, 0.25); transition: background-color 0.2s; }
            
            /* Steps List */
            .steps-container { background: #FAF9F5; border-radius: 18px; padding: 20px; border: 1px solid #EBE8DF; margin-top: 24px; }
            .steps-title { font-size: 13px; font-weight: 700; color: #2D3748; margin-bottom: 10px; }
            .step-item { font-size: 13px; line-height: 1.5; color: #4A5568; margin-bottom: 8px; padding-left: 4px; }
            
            .security-note { font-size: 12px; color: #718096; line-height: 1.5; margin-top: 20px; text-align: center; }
            .footer { background-color: #FAF9F5; padding: 24px; text-align: center; font-size: 12px; color: #A0AEC0; border-top: 1px solid #EBE8DF; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <span class="brand-tag">🥑 Official Member Access</span>
              <div class="brand">BabyBites</div>
              <p class="tagline">Nourishing meals & baby-led weaning for happy little ones</p>
            </div>
            <div class="content">
              <div class="greeting">Welcome, ${cleanName}! ✨</div>
              <div class="body-text">
                Your purchase was successful, and your private BabyBites membership is now officially active! We are thrilled to guide you through every stage of your baby's weaning journey with wholesome, pediatrician-backed recipes and weekly meal planners.
              </div>

              <!-- Login Credentials Card -->
              <div class="credentials-card">
                <div class="credentials-title">🔐 Your Exclusive Login Credentials</div>
                
                <div class="cred-row">
                  <span class="cred-label">Login Email</span>
                  <span class="cred-value">${cleanEmail}</span>
                </div>
                
                <div class="cred-row">
                  <span class="cred-label">Temporary Password</span>
                  <span class="cred-value cred-password">${tempPassword}</span>
                </div>
              </div>

              <!-- Call to Action -->
              <div class="btn-container">
                <a href="${appUrl}/auth" class="btn" target="_blank">Sign In to BabyBites Now →</a>
              </div>

              <!-- Quick Start Steps -->
              <div class="steps-container">
                <div class="steps-title">📋 3 Simple Steps to Get Started:</div>
                <div class="step-item"><strong>1.</strong> Click the button above (or open <code>${appUrl}/auth</code>).</div>
                <div class="step-item"><strong>2.</strong> Enter your email and temporary password to log in.</div>
                <div class="step-item"><strong>3.</strong> <em>(Optional)</em> You can keep this password or customize your own anytime inside <strong>Settings &gt; Change Password</strong>.</div>
              </div>

              <p class="security-note">
                Need help? Simply reply to this email or reach out to our parent support team. We're here for you every step of the way!
              </p>
            </div>
            
            <div class="footer">
              BabyBites &bull; Pediatric Nutrition &amp; Homemade Baby Weaning Platform<br>
              This is an automated access dispatch for your verified Hotmart purchase.
            </div>
          </div>
        </body>
      </html>
      `;

      try {
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromEmail,
            to: cleanEmail,
            subject: "🥑 Welcome to BabyBites! Your Member Access is Ready",
            html: emailHtml,
          }),
        });

        const resendData = await resendRes.json();
        if (!resendRes.ok) {
          emailError = resendData?.message || "Resend API error";
          console.error("❌ Resend dispatch failed:", resendData);
        } else {
          emailSent = true;
          console.log(`✅ Welcome email dispatched to ${cleanEmail}. Resend ID: ${resendData.id}`);
        }
      } catch (err: any) {
        emailError = err.message || "Failed to reach Resend API";
        console.error("❌ Resend network error:", err);
      }
    } else {
      console.warn("⚠️ RESEND_API_KEY is not set in Supabase Secrets. Email could not be sent.");
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Account created and credentials processed",
        email: cleanEmail,
        name: cleanName,
        email_sent: emailSent,
        email_error: emailError,
        transaction_id: transactionId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("💥 Hotmart Webhook Error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal webhook server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
