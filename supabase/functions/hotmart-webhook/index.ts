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

// Detects whether the plan is Annual ($49.99) or Monthly ($5.00)
function detectPlanDetails(body: any): {
  planType: "annual" | "monthly";
  planName: string;
  priceFormatted: string;
  daysDuration: number;
} {
  const rawPrice = Number(
    body.data?.purchase?.price?.value ||
    body.data?.purchase?.original_offer_price?.value ||
    body.purchase?.price ||
    body.price ||
    0
  );

  const rawPlanName = (
    body.data?.subscription?.plan?.name ||
    body.data?.product?.name ||
    body.subscription?.plan ||
    body.prod_name ||
    ""
  ).toLowerCase();

  // If price is close to 49.99 (or over $25) or name has annual/year
  if (
    rawPrice >= 25 ||
    rawPlanName.includes("annual") ||
    rawPlanName.includes("anual") ||
    rawPlanName.includes("year")
  ) {
    return {
      planType: "annual",
      planName: "Annual VIP Membership ($49.99/year)",
      priceFormatted: "$49.99/year",
      daysDuration: 368, // 365 days + 3-day grace period for payment renewals
    };
  }

  // Default to Monthly plan ($5.00/month)
  return {
    planType: "monthly",
    planName: "Monthly Membership ($5.00/month)",
    priceFormatted: "$5.00/month",
    daysDuration: 32, // 30 days + 2-day grace period for card renewal processing
  };
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
      const rawText = await req.text();
      try {
        body = JSON.parse(rawText);
      } catch {
        const params = new URLSearchParams(rawText);
        body = Object.fromEntries(params.entries());
      }
    }

    console.log("📥 Hotmart Webhook Received:", JSON.stringify(body, null, 2));

    // 2. Hottok verification
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

    // 6. Handle Cancellation / Failed Renewal / Refund Events (Access Cut)
    const isCancellationOrOverdue =
      event.includes("REFUND") ||
      event.includes("CHARGEBACK") ||
      event.includes("CANCEL") ||
      event.includes("DELAYED") ||
      event.includes("OVERDUE") ||
      purchaseStatus.includes("REFUND") ||
      purchaseStatus.includes("CHARGEBACK") ||
      purchaseStatus.includes("DELAYED") ||
      purchaseStatus.includes("OVERDUE") ||
      purchaseStatus.includes("CANCELED") ||
      purchaseStatus.includes("CANCELLED");

    if (isCancellationOrOverdue) {
      console.log(`🔒 Cutting access for ${cleanEmail} due to event: ${event || purchaseStatus}`);

      const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = userList?.users?.find(
        (u) => u.email?.toLowerCase() === cleanEmail
      );

      if (existingUser) {
        // Lock subscription status in auth user_metadata
        await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          user_metadata: {
            ...(existingUser.user_metadata || {}),
            subscription_status: "past_due",
            subscription_lock_reason: event || purchaseStatus || "payment_renewal_failed",
            locked_at: new Date().toISOString(),
          },
        });

        // Update profile ban status
        await supabaseAdmin.from("profiles").update({
          is_banned: true,
          banned_reason: "subscription_past_due",
          updated_at: new Date().toISOString(),
        }).eq("id", existingUser.id);

        console.log(`✅ Access suspended for ${cleanEmail}. Account is now locked pending payment.`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Subscription suspended and access locked",
          email: cleanEmail,
          status: "past_due",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Active Purchase / Renewal Event: Determine Plan ($49.99 Annual vs $5.00 Monthly)
    const planInfo = detectPlanDetails(body);
    const now = new Date();
    const expiresDate = new Date(now.getTime() + planInfo.daysDuration * 24 * 60 * 60 * 1000);
    const expiresAt = expiresDate.toISOString();

    console.log(`🌟 Activating ${planInfo.planType.toUpperCase()} plan for ${cleanEmail}. Expires at: ${expiresAt}`);

    // 8. Generate temporary password for initial purchase
    const tempPassword = generateTemporaryPassword();
    let targetUserId = "";
    let isNewUser = false;

    // Check if user already exists
    const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = userList?.users?.find(
      (u) => u.email?.toLowerCase() === cleanEmail
    );

    if (existingUser) {
      targetUserId = existingUser.id;
      console.log(`Existing user found (${existingUser.id}). Renewing / activating subscription...`);

      // Update user with renewed active subscription
      await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        email_confirm: true,
        user_metadata: {
          ...(existingUser.user_metadata || {}),
          full_name: cleanName,
          mother_name: cleanName,
          verified_buyer: true,
          subscription_status: "active",
          subscription_plan: planInfo.planType,
          subscription_plan_name: planInfo.planName,
          subscription_price: planInfo.priceFormatted,
          subscription_expires_at: expiresAt,
          hotmart_transaction: transactionId,
          source: "hotmart",
          locked_at: null,
          subscription_lock_reason: null,
        },
      });

      // Lift any ban / suspension on profile
      await supabaseAdmin.from("profiles").upsert(
        {
          id: existingUser.id,
          full_name: cleanName,
          mother_name: cleanName,
          is_banned: false,
          banned_reason: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    } else {
      isNewUser = true;
      console.log(`Creating new user account for: ${cleanEmail}...`);

      const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: cleanName,
          mother_name: cleanName,
          verified_buyer: true,
          subscription_status: "active",
          subscription_plan: planInfo.planType,
          subscription_plan_name: planInfo.planName,
          subscription_price: planInfo.priceFormatted,
          subscription_expires_at: expiresAt,
          must_change_password: true,
          source: "hotmart",
          hotmart_transaction: transactionId,
        },
      });

      if (createError) {
        throw createError;
      }
      targetUserId = createData.user.id;

      // Create profile record
      await supabaseAdmin.from("profiles").upsert(
        {
          id: targetUserId,
          full_name: cleanName,
          mother_name: cleanName,
          is_banned: false,
          banned_reason: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    }

    // 9. Send Welcome / Renewal Confirmation Email via Resend
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
            .brand-tag { display: inline-block; padding: 4px 14px; border-radius: 9999px; background: rgba(30, 94, 58, 0.1); color: #1E5E3A; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
            .brand { font-family: Georgia, serif; font-size: 32px; font-weight: bold; color: #1E5E3A; letter-spacing: -0.5px; }
            .tagline { margin: 6px 0 0; font-size: 13px; color: #64748B; }
            .content { padding: 36px 28px; }
            .greeting { font-family: Georgia, serif; font-size: 22px; font-weight: bold; color: #1A202C; margin-bottom: 12px; }
            .body-text { font-size: 15px; line-height: 1.65; color: #4A5568; margin-bottom: 24px; }
            
            /* Plan Badge Card */
            .plan-badge { background: #FAF9F5; border: 1px solid #EBE8DF; border-radius: 14px; padding: 12px 18px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
            .plan-label { font-size: 12px; color: #718096; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
            .plan-value { font-size: 14px; color: #1E5E3A; font-weight: 800; }

            /* Credentials Card */
            .credentials-card { background: #EAF5EE; border-radius: 20px; padding: 22px; border: 1px solid #CCE0D2; margin: 24px 0; }
            .credentials-title { font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #1E5E3A; margin-bottom: 14px; }
            .cred-row { background: #ffffff; border-radius: 12px; padding: 12px 16px; margin-bottom: 10px; border: 1px solid #D6E8DC; display: flex; justify-content: space-between; align-items: center; }
            .cred-label { font-size: 12px; color: #718096; font-weight: 600; }
            .cred-value { font-family: Monaco, Menlo, Consolas, monospace; font-size: 14px; color: #1E5E3A; font-weight: bold; word-break: break-all; }
            .cred-password { font-size: 16px; letter-spacing: 0.5px; color: #164E2E; background: #FAF9F5; padding: 3px 8px; border-radius: 6px; border: 1px solid #EBE8DF; }
            
            /* Action Button */
            .btn-container { text-align: center; margin: 32px 0 24px; }
            .btn { background-color: #1E5E3A; color: #ffffff !important; text-decoration: none; padding: 16px 36px; border-radius: 9999px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 6px 20px rgba(30, 94, 58, 0.25); }
            
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
              <p class="tagline">Nourishing meals &amp; baby-led weaning for happy little ones</p>
            </div>
            <div class="content">
              <div class="greeting">Welcome, ${cleanName}! ✨</div>
              <div class="body-text">
                Your purchase was successful, and your <strong>BabyBites ${planInfo.planType.toUpperCase()} membership</strong> is now active! We are thrilled to guide you through every stage of your baby's weaning journey with wholesome, pediatrician-backed recipes and weekly meal planners.
              </div>

              <!-- Plan Details -->
              <div class="plan-badge">
                <span class="plan-label">Enrolled Plan:</span>
                <span class="plan-value">${planInfo.planName}</span>
              </div>

              <!-- Login Credentials Card -->
              <div class="credentials-card">
                <div class="credentials-title">🔐 Your Login Credentials</div>
                
                <div class="cred-row">
                  <span class="cred-label">Login Email</span>
                  <span class="cred-value">${cleanEmail}</span>
                </div>
                
                ${
                  isNewUser
                    ? `<div class="cred-row">
                        <span class="cred-label">Temporary Password</span>
                        <span class="cred-value cred-password">${tempPassword}</span>
                      </div>`
                    : `<div class="cred-row">
                        <span class="cred-label">Password</span>
                        <span class="cred-value">Your existing account password</span>
                      </div>`
                }
              </div>

              <!-- Call to Action -->
              <div class="btn-container">
                <a href="${appUrl}/auth" class="btn" target="_blank">Sign In to BabyBites Now →</a>
              </div>

              <!-- Quick Start Steps -->
              <div class="steps-container">
                <div class="steps-title">📋 How to Access Your Account:</div>
                <div class="step-item"><strong>1.</strong> Click the button above to open the login page.</div>
                <div class="step-item"><strong>2.</strong> Sign in with your email and ${isNewUser ? "temporary password" : "password"}.</div>
                <div class="step-item"><strong>3.</strong> <em>(Optional)</em> You can customize your password anytime in <strong>Settings &gt; Change Password</strong>.</div>
              </div>

              <p class="security-note">
                Need help? Simply reply to this email or reach out to our parent support team. We're here for you every step of the way!
              </p>
            </div>
            
            <div class="footer">
              BabyBites &bull; Pediatric Nutrition &amp; Homemade Baby Weaning Platform<br>
              This is an automated access dispatch for your verified Hotmart purchase (${transactionId}).
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
            subject: `🥑 Welcome to BabyBites! Your ${planInfo.planType === "annual" ? "Annual" : "Monthly"} Access is Ready`,
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
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Account active with subscription tracking",
        email: cleanEmail,
        name: cleanName,
        plan: planInfo.planType,
        plan_name: planInfo.planName,
        expires_at: expiresAt,
        email_sent: emailSent,
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
