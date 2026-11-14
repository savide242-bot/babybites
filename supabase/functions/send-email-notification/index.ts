import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailPayload {
  to: string;
  subject: string;
  title?: string;
  message?: string;
  babyName?: string;
  template?: "welcome" | "meal_reminder" | "community_reply" | "milestone";
  actionUrl?: string;
  actionText?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured in Supabase Secrets" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Strict Security Authentication Check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Allow service role key directly or verify authenticated user JWT
    const isServiceRole = authHeader.includes(serviceRoleKey);
    if (!isServiceRole) {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: authErr } = await userClient.auth.getUser();
      if (authErr || !user) {
        return new Response(
          JSON.stringify({ error: "Unauthorized access: valid session required" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "BabyBites <access@app.babybites.space>";
    const body: EmailPayload = await req.json();

    const {
      to,
      subject,
      title = "Hello from BabyBites!",
      message = "Here is an update on your baby's feeding journey.",
      babyName = "your baby",
      actionUrl = "https://app.babybites.space",
      actionText = "Open BabyBites",
    } = body;

    // Validate email address
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!to || !emailRegex.test(to.trim())) {
      return new Response(
        JSON.stringify({ error: "Valid recipient email ('to') is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!subject || subject.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Email subject is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Botanical HTML email template
    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF9F5; margin: 0; padding: 24px; color: #2D3748; }
          .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 24px; border: 1px solid #EBE8DF; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.03); }
          .header { background-color: #FAF9F5; padding: 32px 24px; text-align: center; border-bottom: 1px solid #EBE8DF; }
          .logo { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; }
          .brand { font-family: Georgia, serif; font-size: 24px; font-weight: bold; color: #1E5E3A; margin-top: 8px; }
          .content { padding: 32px 24px; }
          .title { font-family: Georgia, serif; font-size: 20px; font-weight: bold; color: #1A202C; margin-bottom: 12px; }
          .body-text { font-size: 15px; line-height: 1.6; color: #4A5568; margin-bottom: 24px; }
          .highlight-card { background: #EAF5EE; border-radius: 16px; padding: 16px; border: 1px solid #CCE0D2; color: #1E5E3A; font-size: 14px; margin-bottom: 24px; }
          .btn-container { text-align: center; margin: 32px 0 16px; }
          .btn { background-color: #1E5E3A; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 9999px; font-weight: 600; font-size: 14px; display: inline-block; }
          .footer { background-color: #FAF9F5; padding: 20px 24px; text-align: center; font-size: 12px; color: #A0AEC0; border-top: 1px solid #EBE8DF; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="brand">BabyBites</div>
            <p style="margin: 4px 0 0; font-size: 12px; color: #718096;">Nourishing meals for growing babies</p>
          </div>
          <div class="content">
            <div class="title">${title}</div>
            <div class="body-text">${message}</div>
            
            <div class="highlight-card">
              🌱 <strong>Personalized for ${babyName}:</strong> Every bite counts toward healthy eating habits!
            </div>

            <div class="btn-container">
              <a href="${actionUrl}" class="btn">${actionText}</a>
            </div>
          </div>
          <div class="footer">
            BabyBites &bull; Pediatric nutrition and wholesome homemade baby food.<br>
            You are receiving this because you signed up for BabyBites.
          </div>
        </div>
      </body>
    </html>
    `;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to.trim().toLowerCase()],
        subject: subject.trim(),
        html: html,
      }),
    });

    const data = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend API error:", data);
      return new Response(
        JSON.stringify({ error: data.message || "Failed to dispatch email" }),
        { status: resendResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: data.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("send-email-notification error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
