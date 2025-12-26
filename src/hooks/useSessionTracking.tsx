import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from 'react-router-dom';

// Get device info
const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  let browser = 'Unknown';
  let os = 'Unknown';
  
  // Detect browser
  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edge')) browser = 'Edge';
  
  // Detect OS
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'Mac';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  
  return `${browser} on ${os}`;
};

export const useSessionTracking = () => {
  const location = useLocation();

  useEffect(() => {
    const trackSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const deviceInfo = getDeviceInfo();

      try {
        // Auto-detect and update user's timezone
        const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        // Update timezone in profiles (silently, non-blocking)
        supabase
          .from('profiles')
          .update({ timezone: detectedTimezone })
          .eq('id', user.id)
          .then(({ error }) => {
            if (error) {
              console.warn('Could not update timezone:', error);
            } else {
              console.log('🌍 Timezone updated to:', detectedTimezone);
            }
          });

        // Check if session record exists
        const { data: existingSession } = await supabase
          .from('user_sessions')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (existingSession) {
          // Update existing session
          await supabase
            .from('user_sessions')
            .update({
              last_login: new Date().toISOString(),
              last_active: new Date().toISOString(),
              total_sessions: existingSession.total_sessions + 1,
              device_info: deviceInfo,
            })
            .eq('user_id', user.id);
        } else {
          // Create new session record (also on SIGNUP)
          await supabase
            .from('user_sessions')
            .insert({
              user_id: user.id,
              last_login: new Date().toISOString(),
              last_active: new Date().toISOString(),
              total_sessions: 1,
              device_info: deviceInfo,
            });
        }
      } catch (error) {
        console.error('Error tracking session:', error);
      }
    };

    // Track on mount
    trackSession();

    // Update last_active every 2 minutes (more frequent)
    const activityInterval = setInterval(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('user_sessions')
          .update({ last_active: new Date().toISOString() })
          .eq('user_id', user.id);
      }
    }, 2 * 60 * 1000); // 2 minutes

    return () => clearInterval(activityInterval);
  }, []);

  // Update last_active on every route change
  useEffect(() => {
    const updateActivity = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('user_sessions')
          .update({ last_active: new Date().toISOString() })
          .eq('user_id', user.id);
      }
    };

    updateActivity();
  }, [location.pathname]);
};
