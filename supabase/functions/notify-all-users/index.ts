import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  sendWebPushNotification, 
  getVapidKeys, 
  type PushSubscription, 
  type NotificationPayload 
} from "../_shared/webpush.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestPayload {
  title: string;
  body: string;
  channel?: 'push' | 'email' | 'both';
  emailSubject?: string;
  icon?: string;
  action_label?: string;
  action_url?: string;
  segment?: 'all' | 'active' | 'inactive';
  targetUserId?: string;
}

const MASTER_SUPER_ADMINS = [
  'octaviomoiane2007@gmail.com',
  'savide242@gmail.com',
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔔 notify-all-users v3.0 - Multichannel (Push & Resend Email)');
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is master admin or has admin role
    const userEmail = (user.email || '').toLowerCase().trim();
    const isMaster = MASTER_SUPER_ADMINS.includes(userEmail);

    if (!isMaster) {
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (roleError || !roleData) {
        throw new Error('Unauthorized - admin role required');
      }
    }

    console.log('✅ Admin verified:', user.id);

    const payload: RequestPayload = await req.json();
    const channel = payload.channel || 'push';
    console.log('📝 Notification payload:', { 
      title: payload.title, 
      channel, 
      segment: payload.segment || 'all' 
    });

    let pushSuccess = 0;
    let pushFailed = 0;
    let emailSuccess = 0;
    let emailFailed = 0;

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'BabyBites <access@app.babybites.space>';

    // ==========================================
    // 1. PUSH NOTIFICATION DELIVERY
    // ==========================================
    if (channel === 'push' || channel === 'both') {
      const vapidKeys = getVapidKeys();
      if (vapidKeys) {
        let query = supabase
          .from('push_subscriptions')
          .select('id, user_id, endpoint, p256dh, auth');

        if (payload.targetUserId) {
          query = query.eq('user_id', payload.targetUserId);
        }

        if (payload.segment === 'active') {
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          const { data: activeSessions } = await supabase
            .from('user_sessions')
            .select('user_id')
            .gte('last_active', sevenDaysAgo);
          const activeUserIds = activeSessions?.map(s => s.user_id) || [];
          if (activeUserIds.length > 0) {
            query = query.in('user_id', activeUserIds);
          }
        } else if (payload.segment === 'inactive') {
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          const { data: activeSessions } = await supabase
            .from('user_sessions')
            .select('user_id')
            .gte('last_active', sevenDaysAgo);
          const activeUserIds = activeSessions?.map(s => s.user_id) || [];
          if (activeUserIds.length > 0) {
            query = query.not('user_id', 'in', `(${activeUserIds.join(',')})`);
          }
        }

        const { data: subscriptions } = await query;

        if (subscriptions && subscriptions.length > 0) {
          const expiredIds: string[] = [];
          const notification: NotificationPayload = {
            title: payload.title,
            body: payload.body,
            icon: payload.icon || 'https://app.babybites.space/icon-192.png',
            badge: 'https://app.babybites.space/icon-192.png',
            tag: `admin-${Date.now()}`,
            data: {
              url: payload.action_url || '/',
              timestamp: Date.now(),
            },
            actions: payload.action_label ? [
              { action: 'open', title: payload.action_label }
            ] : [],
          };

          for (const sub of subscriptions) {
            if (!sub.p256dh || !sub.auth) {
              pushFailed++;
              continue;
            }

            const pushSub: PushSubscription = {
              id: sub.id,
              user_id: sub.user_id,
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            };

            const result = await sendWebPushNotification(
              pushSub,
              notification,
              vapidKeys.publicKey,
              vapidKeys.privateKey
            );

            if (result.success) {
              pushSuccess++;
            } else {
              pushFailed++;
              if (result.expired) {
                expiredIds.push(sub.id);
              }
            }
          }

          if (expiredIds.length > 0) {
            await supabase.from('push_subscriptions').delete().in('id', expiredIds);
          }
        }
      } else {
        console.warn('VAPID keys not configured, skipping push');
      }
    }

    // ==========================================
    // 2. EMAIL (RESEND) BROADCAST DELIVERY
    // ==========================================
    if ((channel === 'email' || channel === 'both') && resendApiKey) {
      const emailSubject = payload.emailSubject || payload.title || 'Important update from BabyBites';
      const emailActionUrl = payload.action_url?.startsWith('http') 
        ? payload.action_url 
        : `https://app.babybites.space${payload.action_url || ''}`;

      const generateHtml = (recipientName: string) => {
        // If the admin already included an opening greeting or full custom message, do not force "Dear ..."
        const rawBody = (payload.body || '').trim();
        const hasGreeting = /^(dear|hello|hi|hey|olá|ola|oi|welcome|bom dia|boa tarde|prezada|querida)/i.test(rawBody);
        const greetingPrefix = hasGreeting ? '' : (recipientName ? `Dear ${recipientName},<br><br>` : '');

        return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF9F5; margin: 0; padding: 24px; color: #2D3748; }
            .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 24px; border: 1px solid #EBE8DF; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.03); }
            .header { background-color: #FAF9F5; padding: 28px 24px; text-align: center; border-bottom: 1px solid #EBE8DF; }
            .logo { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; }
            .content { padding: 32px 28px; line-height: 1.6; }
            .title { font-size: 20px; font-weight: bold; color: #1E5E3A; margin: 0 0 16px 0; }
            .body-text { font-size: 15px; color: #4A5568; margin-bottom: 24px; white-space: pre-line; }
            .btn { display: inline-block; background-color: #1E5E3A; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 9999px; font-weight: bold; font-size: 14px; text-align: center; }
            .footer { padding: 20px 24px; background-color: #FAF9F5; text-align: center; font-size: 11px; color: #718096; border-top: 1px solid #EBE8DF; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="https://app.babybites.space/logo.png" alt="BabyBites" class="logo" />
              <div style="margin-top: 8px; font-size: 16px; font-weight: bold; color: #1E5E3A;">BabyBites</div>
            </div>
            <div class="content">
              <h2 class="title">${payload.title}</h2>
              <div class="body-text">${greetingPrefix}${rawBody}</div>
              <div style="text-align: center; margin-top: 28px;">
                <a href="${emailActionUrl}" class="btn">${payload.action_label || 'Open BabyBites'}</a>
              </div>
            </div>
            <div class="footer">
              BabyBites &bull; Gentle, Pediatric Weaning &amp; Nutrition Companion<br>
              You received this message because you are a registered member of BabyBites.
            </div>
          </div>
        </body>
      </html>
      `;
      };

      let targetEmails: Array<{ email: string; name: string }> = [];

      if (payload.targetUserId) {
        const { data: targetUser } = await supabase.auth.admin.getUserById(payload.targetUserId);
        if (targetUser?.user?.email) {
          const { data: profile } = await supabase.from('profiles').select('mother_name, full_name').eq('id', payload.targetUserId).maybeSingle();
          targetEmails.push({
            email: targetUser.user.email,
            name: profile?.mother_name || profile?.full_name || 'Mom'
          });
        }
      } else {
        // Broadcast to all registered users
        const { data: usersData } = await supabase.auth.admin.listUsers({ perPage: 100 });
        if (usersData?.users) {
          const { data: profiles } = await supabase.from('profiles').select('id, mother_name, full_name');
          const profileMap = new Map(profiles?.map(p => [p.id, p.mother_name || p.full_name]) || []);

          targetEmails = usersData.users
            .filter((u: any) => u.email && u.email.includes('@'))
            .map((u: any) => ({
              email: u.email,
              name: profileMap.get(u.id) || 'Mom'
            }));
        }
      }

      console.log(`✉️ Dispatching emails to ${targetEmails.length} recipients...`);

      for (const recipient of targetEmails) {
        try {
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: fromEmail,
              to: recipient.email,
              subject: emailSubject,
              html: generateHtml(recipient.name),
            }),
          });

          if (res.ok) {
            emailSuccess++;
          } else {
            emailFailed++;
            const errData = await res.json();
            console.warn(`Resend failed for ${recipient.email}:`, errData);
          }
        } catch (mailErr) {
          emailFailed++;
          console.warn(`Resend network error for ${recipient.email}:`, mailErr);
        }
      }
    }

    // Log admin notification
    await supabase.from('admin_notifications').insert({
      created_by: user.id,
      title: payload.title,
      body: payload.body,
      icon: payload.icon,
      action_label: payload.action_label,
      action_url: payload.action_url,
      successful_count: pushSuccess + emailSuccess,
      failed_count: pushFailed + emailFailed,
    });

    console.log(`📊 Completed broadcast. Push: ${pushSuccess} ok / ${pushFailed} err. Email: ${emailSuccess} ok / ${emailFailed} err.`);

    return new Response(
      JSON.stringify({
        message: 'Notification dispatch completed',
        channel,
        push: { successful: pushSuccess, failed: pushFailed },
        email: { successful: emailSuccess, failed: emailFailed },
        successful: pushSuccess + emailSuccess,
        failed: pushFailed + emailFailed,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});