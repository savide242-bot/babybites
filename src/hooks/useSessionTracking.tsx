import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSessionTracking = () => {
  useEffect(() => {
    const trackSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      try {
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
            })
            .eq('user_id', user.id);
        } else {
          // Create new session record
          await supabase
            .from('user_sessions')
            .insert({
              user_id: user.id,
              last_login: new Date().toISOString(),
              last_active: new Date().toISOString(),
              total_sessions: 1,
            });
        }
      } catch (error) {
        console.error('Error tracking session:', error);
      }
    };

    // Track on mount
    trackSession();

    // Update last_active every 5 minutes
    const activityInterval = setInterval(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('user_sessions')
          .update({ last_active: new Date().toISOString() })
          .eq('user_id', user.id);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(activityInterval);
  }, []);
};
