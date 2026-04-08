import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from 'react-router-dom';

const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  let browser = 'Unknown';
  let os = 'Unknown';
  
  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edge')) browser = 'Edge';
  
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'Mac';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  
  return `${browser} on ${os}`;
};

// Debounce activity log writes
let lastLoggedRoute = '';
let lastLogTime = 0;
const LOG_DEBOUNCE_MS = 5000;

export const useSessionTracking = () => {
  const location = useLocation();

  // Log activity event to activity_logs (for admin visibility)
  const logActivity = useCallback(async (actionType: string, details?: Record<string, any>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action_type: actionType,
        action_details: details || {},
      });
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    const trackSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const deviceInfo = getDeviceInfo();
      const now = new Date().toISOString();

      try {
        // Auto-detect timezone
        const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        supabase.from('profiles').update({ timezone: detectedTimezone }).eq('id', user.id).then(() => {});

        // Upsert session
        await supabase
          .from('user_sessions')
          .upsert(
            { user_id: user.id, last_login: now, last_active: now, total_sessions: 1, device_info: deviceInfo },
            { onConflict: 'user_id' }
          );

        // Bump total_sessions
        const { data: existing } = await supabase
          .from('user_sessions')
          .select('total_sessions')
          .eq('user_id', user.id)
          .maybeSingle();

        if (existing && existing.total_sessions > 0) {
          await supabase
            .from('user_sessions')
            .update({ total_sessions: existing.total_sessions + 1 })
            .eq('user_id', user.id);
        }

        // Log session start
        logActivity('session_start', { device: deviceInfo, route: location.pathname });
      } catch (error) {
        console.error('Error tracking session:', error);
      }
    };

    trackSession();

    // Update last_active every 2 minutes
    const activityInterval = setInterval(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('user_sessions')
          .update({ last_active: new Date().toISOString() })
          .eq('user_id', user.id);
      }
    }, 2 * 60 * 1000);

    return () => clearInterval(activityInterval);
  }, []);

  // Log page views on route change (debounced)
  useEffect(() => {
    const now = Date.now();
    if (location.pathname === lastLoggedRoute && now - lastLogTime < LOG_DEBOUNCE_MS) return;
    lastLoggedRoute = location.pathname;
    lastLogTime = now;

    const updateActivity = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      await supabase.from('user_sessions').update({ last_active: new Date().toISOString() }).eq('user_id', user.id);
      
      // Log page view for admin analytics
      logActivity('page_view', { path: location.pathname });
    };

    updateActivity();
  }, [location.pathname, logActivity]);

  return { logActivity };
};
