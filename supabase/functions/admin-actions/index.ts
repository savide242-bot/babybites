import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ActionRequest {
  action: 'ban_user' | 'unban_user' | 'delete_user' | 'promote_admin' | 'demote_admin' | 'send_notification';
  targetUserId: string;
  reason?: string;
  notification?: {
    title: string;
    body: string;
  };
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

    // Verify user is admin using has_role function
    const { data: isAdmin, error: roleError } = await supabaseAdmin.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (roleError || !isAdmin) {
      console.log('Admin check failed:', { roleError, isAdmin, userId: user.id });
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, targetUserId, reason, notification } = await req.json() as ActionRequest;

    if (!action || !targetUserId) {
      return new Response(
        JSON.stringify({ error: 'action and targetUserId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Admin ${user.id} performing ${action} on user ${targetUserId}`);

    let result: any = { success: true };

    switch (action) {
      case 'ban_user': {
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({
            is_banned: true,
            banned_at: new Date().toISOString(),
            banned_reason: reason || 'Banned by admin'
          })
          .eq('id', targetUserId);

        if (error) throw error;

        // Log action
        await supabaseAdmin.from('activity_logs').insert({
          user_id: user.id,
          action_type: 'user_banned',
          action_details: { target_user: targetUserId, reason }
        });

        result.message = 'User banned successfully';
        break;
      }

      case 'unban_user': {
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({
            is_banned: false,
            banned_at: null,
            banned_reason: null
          })
          .eq('id', targetUserId);

        if (error) throw error;

        await supabaseAdmin.from('activity_logs').insert({
          user_id: user.id,
          action_type: 'user_unbanned',
          action_details: { target_user: targetUserId }
        });

        result.message = 'User unbanned successfully';
        break;
      }

      case 'delete_user': {
        // First delete from profiles (cascade should handle related data)
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .delete()
          .eq('id', targetUserId);

        if (profileError) {
          console.error('Profile delete error:', profileError);
        }

        // Delete from auth.users using admin API
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

      case 'promote_admin': {
        // Check if already admin
        const { data: existingRole } = await supabaseAdmin
          .from('user_roles')
          .select('id')
          .eq('user_id', targetUserId)
          .eq('role', 'admin')
          .single();

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

      case 'demote_admin': {
        // Prevent self-demotion
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

      case 'send_notification': {
        if (!notification?.title || !notification?.body) {
          return new Response(
            JSON.stringify({ error: 'notification.title and notification.body are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get user's push subscription
        const { data: subscription, error: subError } = await supabaseAdmin
          .from('push_subscriptions')
          .select('*')
          .eq('user_id', targetUserId)
          .single();

        if (subError || !subscription) {
          return new Response(
            JSON.stringify({ error: 'User has no push subscription' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Import webpush utilities
        const { getVapidKeys, sendWebPushNotification } = await import('../_shared/webpush.ts');
        const vapidKeys = getVapidKeys();
        
        if (!vapidKeys) {
          throw new Error('VAPID keys not configured');
        }

        const pushResult = await sendWebPushNotification(
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

        if (!pushResult.success) {
          return new Response(
            JSON.stringify({ error: 'Failed to send notification', details: pushResult.error }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        await supabaseAdmin.from('activity_logs').insert({
          user_id: user.id,
          action_type: 'notification_sent_individual',
          action_details: { target_user: targetUserId, title: notification.title }
        });

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
