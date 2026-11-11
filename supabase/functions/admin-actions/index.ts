import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

async function findUserByEmail(supabaseAdmin: any, email: string) {
  let page = 1;
  const target = email.toLowerCase().trim();
  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 100 });
    if (error || !data?.users || data.users.length === 0) break;
    const match = data.users.find((u: any) => u.email?.toLowerCase().trim() === target);
    if (match) return match;
    if (data.users.length < 100) break;
    page++;
    if (page > 50) break;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client for privileged operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Create user client for auth verification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is admin (Master Super Admin whitelist or has_role rpc)
    const masterEmails = ['octaviomoiane2007@gmail.com', 'savide242@gmail.com'];
    const userEmail = (user.email || '').toLowerCase().trim();
    const isMaster = masterEmails.includes(userEmail);

    let isAdmin = isMaster;
    if (!isAdmin) {
      const { data: hasRole, error: roleError } = await supabaseAdmin.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });
      isAdmin = !!hasRole;
      if (roleError || !isAdmin) {
        console.log('Admin check failed:', { roleError, isAdmin, userId: user.id });
        return new Response(
          JSON.stringify({ error: 'Admin access required' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const body = await req.json();
    const { action, targetUserId, reason, notification } = body;

    if (!action) {
      return new Response(
        JSON.stringify({ error: 'action is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Admin ${user.id} performing ${action}`);

    let result: any = { success: true };

    switch (action) {
      // 1. ADD / CREATE MOTHER TRIAL ACCOUNT (DAY 20 FREE ACCESS GIFT)
      case 'create_trial_user':
      case 'add_mother': {
        const email = (body.email || '').toString().trim().toLowerCase();
        const motherName = (body.motherName || body.mother_name || body.fullName || body.full_name || 'Loving Mother').toString().trim();
        const babyName = (body.babyName || body.baby_name || '').toString().trim();
        const trialDays = Number(body.trialDays || body.trial_days || 7);
        const customPassword = body.customPassword || body.password;

        if (!email || !email.includes('@')) {
          return new Response(
            JSON.stringify({ error: 'A valid email address is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const tempPassword = customPassword || generateTemporaryPassword();
        const now = new Date();
        const expiresDate = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);
        const expiresAt = expiresDate.toISOString();
        const formattedDate = expiresDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

        let targetId = '';
        let isNew = false;

        // Check if user already exists
        const existing = await findUserByEmail(supabaseAdmin, email);

        if (existing) {
          targetId = existing.id;
          console.log(`Existing user ${email} found (${existing.id}). Upgrading to VIP Trial...`);

          await supabaseAdmin.auth.admin.updateUserById(existing.id, {
            email_confirm: true,
            user_metadata: {
              ...(existing.user_metadata || {}),
              full_name: motherName,
              mother_name: motherName,
              baby_name: babyName || existing.user_metadata?.baby_name,
              verified_buyer: true,
              subscription_status: 'trial',
              subscription_plan: 'trial',
              subscription_plan_name: `VIP Free Trial Gift (${trialDays} Days)`,
              subscription_expires_at: expiresAt,
              is_banned: false,
              banned_reason: null,
              locked_at: null,
              source: 'admin_vip_gift',
            },
          });

          await supabaseAdmin.from('profiles').upsert({
            id: existing.id,
            full_name: motherName,
            mother_name: motherName,
            baby_name: babyName || null,
            is_banned: false,
            banned_reason: null,
            banned_at: null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' });

        } else {
          isNew = true;
          console.log(`Creating new VIP Trial user for ${email}...`);

          const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
              full_name: motherName,
              mother_name: motherName,
              baby_name: babyName || undefined,
              verified_buyer: true,
              subscription_status: 'trial',
              subscription_plan: 'trial',
              subscription_plan_name: `VIP Free Trial Gift (${trialDays} Days)`,
              subscription_expires_at: expiresAt,
              must_change_password: true,
              source: 'admin_vip_gift',
            },
          });

          if (createError) throw createError;
          targetId = createData.user.id;

          await supabaseAdmin.from('profiles').upsert({
            id: targetId,
            full_name: motherName,
            mother_name: motherName,
            baby_name: babyName || null,
            is_banned: false,
            banned_reason: null,
            banned_at: null,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' });
        }

        // Send Beautiful VIP Free Trial Welcome Email via Resend
        const resendApiKey = Deno.env.get('RESEND_API_KEY');
        const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'BabyBites <access@app.babybites.space>';
        const appUrl = Deno.env.get('APP_URL') || 'https://app.babybites.space';
        let emailSent = false;
        let emailError: string | null = null;

        if (resendApiKey) {
          const emailHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Your BabyBites VIP Gift Access</title>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF9F5; margin: 0; padding: 24px; color: #2D3748; }
                .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 28px; border: 1px solid #EBE8DF; overflow: hidden; box-shadow: 0 10px 30px rgba(30, 94, 58, 0.06); }
                .header { background: linear-gradient(135deg, #FAF9F5 0%, #F5F3EC 100%); padding: 36px 24px 28px; text-align: center; border-bottom: 1px solid #EBE8DF; }
                .brand-tag { display: inline-block; padding: 5px 16px; border-radius: 9999px; background: rgba(30, 94, 58, 0.1); color: #1E5E3A; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
                .brand { font-family: Georgia, serif; font-size: 32px; font-weight: bold; color: #1E5E3A; letter-spacing: -0.5px; }
                .tagline { margin: 6px 0 0; font-size: 13px; color: #64748B; }
                .content { padding: 36px 28px; }
                .greeting { font-family: Georgia, serif; font-size: 22px; font-weight: bold; color: #1A202C; margin-bottom: 12px; }
                .body-text { font-size: 15px; line-height: 1.65; color: #4A5568; margin-bottom: 24px; }
                
                .gift-badge { background: linear-gradient(135deg, #EAF5EE 0%, #FAF9F5 100%); border: 1px solid #CCE0D2; border-radius: 16px; padding: 16px 20px; margin-bottom: 24px; }
                .gift-title { font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #1E5E3A; margin-bottom: 4px; }
                .gift-desc { font-size: 13px; color: #2D3748; line-height: 1.5; margin: 0; }
                
                .credentials-card { background: #FAF9F5; border-radius: 20px; padding: 22px; border: 1px solid #EBE8DF; margin: 24px 0; }
                .credentials-title { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #718096; margin-bottom: 14px; }
                .cred-row { background: #ffffff; border-radius: 12px; padding: 12px 16px; margin-bottom: 10px; border: 1px solid #EBE8DF; display: flex; justify-content: space-between; align-items: center; }
                .cred-label { font-size: 12px; color: #718096; font-weight: 600; }
                .cred-value { font-family: Monaco, Menlo, Consolas, monospace; font-size: 14px; color: #1E5E3A; font-weight: bold; word-break: break-all; }
                .cred-password { font-size: 16px; letter-spacing: 0.5px; color: #164E2E; background: #EAF5EE; padding: 4px 10px; border-radius: 6px; border: 1px solid #CCE0D2; }
                
                .btn-container { text-align: center; margin: 32px 0 24px; }
                .btn { background-color: #1E5E3A; color: #ffffff !important; text-decoration: none; padding: 16px 36px; border-radius: 9999px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 6px 20px rgba(30, 94, 58, 0.25); }
                
                .steps-container { background: #FAF9F5; border-radius: 18px; padding: 20px; border: 1px solid #EBE8DF; margin-top: 24px; }
                .steps-title { font-size: 13px; font-weight: 700; color: #2D3748; margin-bottom: 10px; }
                .step-item { font-size: 13px; line-height: 1.5; color: #4A5568; margin-bottom: 8px; padding-left: 4px; }
                
                .footer { background-color: #FAF9F5; padding: 24px; text-align: center; font-size: 12px; color: #A0AEC0; border-top: 1px solid #EBE8DF; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <span class="brand-tag">🥑 VIP Gift Invitation</span>
                  <div class="brand">BabyBites</div>
                  <p class="tagline">Nourishing meals &amp; baby-led weaning for happy little ones</p>
                </div>
                <div class="content">
                  <div class="greeting">Welcome, ${motherName}! ✨</div>
                  <div class="body-text">
                    You have been personally selected and gifted with <strong>${trialDays} Days of 100% Free VIP Access</strong> to the complete BabyBites platform! We are delighted to guide you and your baby through wholesome, pediatrician-backed meals, allergy trackers, and stress-free weekly planners.
                  </div>

                  <div class="gift-badge">
                    <div class="gift-title">🎁 Your Special Gift Details</div>
                    <p class="gift-desc">
                      Unlimited VIP access for <strong>${trialDays} days</strong>, valid through <strong>${formattedDate}</strong>. No payment required.
                    </p>
                  </div>

                  <div class="credentials-card">
                    <div class="credentials-title">🔐 Your Member Login Access</div>
                    
                    <div class="cred-row">
                      <span class="cred-label">Login Email</span>
                      <span class="cred-value">${email}</span>
                    </div>
                    
                    ${
                      isNew
                        ? `<div class="cred-row">
                            <span class="cred-label">Temporary Password</span>
                            <span class="cred-value cred-password">${tempPassword}</span>
                          </div>`
                        : `<div class="cred-row">
                            <span class="cred-label">Password</span>
                            <span class="cred-value">Use your existing account password</span>
                          </div>`
                    }
                  </div>

                  <div class="btn-container">
                    <a href="${appUrl}/auth" class="btn" target="_blank">Open BabyBites &amp; Start Exploring →</a>
                  </div>

                  <div class="steps-container">
                    <div class="steps-title">📋 How to Get Started:</div>
                    <div class="step-item"><strong>1.</strong> Click the button above to go to the BabyBites login screen.</div>
                    <div class="step-item"><strong>2.</strong> Enter your email and ${isNew ? 'the temporary password provided above' : 'your account password'}.</div>
                    <div class="step-item"><strong>3.</strong> Explore over 395+ age-tailored baby recipes, weekly grocery lists, and finger-food tutorials!</div>
                  </div>
                </div>
                
                <div class="footer">
                  BabyBites &bull; Pediatric Nutrition &amp; Homemade Baby Weaning Platform<br>
                  Special VIP Gift Access granted by our team. Welcome to the family!
                </div>
              </div>
            </body>
          </html>
          `;

          try {
            const resendRes = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: fromEmail,
                to: email,
                subject: `🥑 Welcome to BabyBites! Your VIP Gift Access is Ready (${trialDays} Days Free)`,
                html: emailHtml,
              }),
            });

            const resendData = await resendRes.json();
            if (!resendRes.ok) {
              emailError = resendData?.message || 'Resend error';
              console.error('❌ Resend error for VIP Gift:', resendData);
            } else {
              emailSent = true;
              console.log(`✅ VIP Gift email dispatched to ${email}. Resend ID: ${resendData.id}`);
            }
          } catch (err: any) {
            emailError = err.message;
            console.error('❌ Resend network error:', err);
          }
        }

        // Activity log
        await supabaseAdmin.from('activity_logs').insert({
          user_id: user.id,
          action_type: 'trial_user_created',
          action_details: { email, motherName, babyName, trialDays, expiresAt, emailSent, emailError }
        });

        result = {
          success: true,
          message: `Mother account for ${email} created with ${trialDays} days free access! Welcome email ${emailSent ? 'sent successfully' : 'queued'}.`,
          user: {
            id: targetId,
            email,
            tempPassword: isNew ? tempPassword : '(existing password)',
            expiresAt,
            emailSent,
            emailError,
          }
        };
        break;
      }

      // 2. BAN USER / SUSPEND ACCOUNT
      case 'ban_user': {
        if (!targetUserId) {
          return new Response(JSON.stringify({ error: 'targetUserId is required' }), { status: 400, headers: corsHeaders });
        }

        const banReason = reason || 'Banned by admin';

        // Update profile
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({
            is_banned: true,
            banned_at: new Date().toISOString(),
            banned_reason: banReason,
            updated_at: new Date().toISOString(),
          })
          .eq('id', targetUserId);

        if (profileError) throw profileError;

        // Also lock auth user_metadata
        try {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
          if (authUser?.user) {
            await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
              user_metadata: {
                ...(authUser.user.user_metadata || {}),
                is_banned: true,
                banned_reason: banReason,
                subscription_status: banReason.includes('trial') ? 'expired' : 'past_due',
                locked_at: new Date().toISOString(),
              }
            });
          }
        } catch (err) {
          console.warn('Could not update auth user_metadata on ban:', err);
        }

        await supabaseAdmin.from('activity_logs').insert({
          user_id: user.id,
          action_type: 'user_banned',
          action_details: { target_user: targetUserId, reason: banReason }
        });

        result.message = 'User banned and account locked successfully';
        break;
      }

      // 3. UNBAN USER / RESTORE ACCESS
      case 'unban_user': {
        if (!targetUserId) {
          return new Response(JSON.stringify({ error: 'targetUserId is required' }), { status: 400, headers: corsHeaders });
        }

        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({
            is_banned: false,
            banned_at: null,
            banned_reason: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', targetUserId);

        if (profileError) throw profileError;

        try {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
          if (authUser?.user) {
            await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
              user_metadata: {
                ...(authUser.user.user_metadata || {}),
                is_banned: false,
                banned_reason: null,
                locked_at: null,
                subscription_status: 'active',
              }
            });
          }
        } catch (err) {
          console.warn('Could not update auth user_metadata on unban:', err);
        }

        await supabaseAdmin.from('activity_logs').insert({
          user_id: user.id,
          action_type: 'user_unbanned',
          action_details: { target_user: targetUserId }
        });

        result.message = 'User unbanned and access restored successfully';
        break;
      }

      // 4. DELETE USER
      case 'delete_user': {
        if (!targetUserId) {
          return new Response(JSON.stringify({ error: 'targetUserId is required' }), { status: 400, headers: corsHeaders });
        }

        try {
          await supabaseAdmin.from('profiles').delete().eq('id', targetUserId);
        } catch (_) {}

        const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
        if (authDeleteError) throw authDeleteError;

        await supabaseAdmin.from('activity_logs').insert({
          user_id: user.id,
          action_type: 'user_deleted',
          action_details: { target_user: targetUserId }
        });

        result.message = 'User deleted successfully';
        break;
      }

      // 5. PROMOTE ADMIN
      case 'promote_admin': {
        if (!targetUserId) {
          return new Response(JSON.stringify({ error: 'targetUserId is required' }), { status: 400, headers: corsHeaders });
        }

        const { data: existingRole } = await supabaseAdmin
          .from('user_roles')
          .select('id')
          .eq('user_id', targetUserId)
          .eq('role', 'admin')
          .maybeSingle();

        if (existingRole) {
          return new Response(
            JSON.stringify({ error: 'User is already an admin' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error } = await supabaseAdmin
          .from('user_roles')
          .insert({ user_id: targetUserId, role: 'admin' });

        if (error) throw error;

        await supabaseAdmin.from('activity_logs').insert({
          user_id: user.id,
          action_type: 'user_promoted_admin',
          action_details: { target_user: targetUserId }
        });

        result.message = 'User promoted to admin successfully';
        break;
      }

      // 6. DEMOTE ADMIN
      case 'demote_admin': {
        if (targetUserId === user.id) {
          return new Response(
            JSON.stringify({ error: 'Cannot demote yourself' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { error } = await supabaseAdmin
          .from('user_roles')
          .delete()
          .eq('user_id', targetUserId)
          .eq('role', 'admin');

        if (error) throw error;

        await supabaseAdmin.from('activity_logs').insert({
          user_id: user.id,
          action_type: 'user_demoted_admin',
          action_details: { target_user: targetUserId }
        });

        result.message = 'Admin role removed successfully';
        break;
      }

      // 7. SEND NOTIFICATION
      case 'send_notification': {
        if (!notification?.title || !notification?.body) {
          return new Response(
            JSON.stringify({ error: 'notification.title and notification.body are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: subscription } = await supabaseAdmin
          .from('push_subscriptions')
          .select('*')
          .eq('user_id', targetUserId)
          .maybeSingle();

        if (!subscription) {
          return new Response(
            JSON.stringify({ success: true, message: 'Push notification queued for user device.' }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        try {
          const { getVapidKeys, sendWebPushNotification } = await import('../_shared/webpush.ts');
          const vapidKeys = getVapidKeys();
          if (vapidKeys) {
            await sendWebPushNotification(
              subscription,
              {
                title: notification.title,
                body: notification.body,
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-72x72.png',
              },
              vapidKeys.publicKey,
              vapidKeys.privateKey
            );
          }
        } catch (pushErr) {
          console.warn('Push error:', pushErr);
        }

        result.message = 'Notification sent successfully';
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Admin action error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
