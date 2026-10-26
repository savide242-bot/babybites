import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const MASTER_SUPER_ADMINS = [
  'octaviomoiane2007@gmail.com',
  'savide242@gmail.com',
];

export const useAdminRole = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkAdminRole = async () => {
      try {
        // Securely verify token directly with Supabase Auth Server (cannot be forged by localStorage editing)
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          if (isMounted) {
            setIsAdmin(false);
            setIsLoading(false);
          }
          return;
        }

        // Master Super Admin account whitelist check
        const userEmail = (user.email || '').toLowerCase().trim();
        if (MASTER_SUPER_ADMINS.includes(userEmail)) {
          if (isMounted) {
            setIsAdmin(true);
            setIsLoading(false);
          }
          return;
        }

        // Database role verification check
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (error) throw error;
        
        if (isMounted) {
          setIsAdmin(!!data);
        }
      } catch (error) {
        console.error('Security check failed for admin verification:', error);
        if (isMounted) {
          setIsAdmin(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkAdminRole();

    return () => {
      isMounted = false;
    };
  }, []);

  return { isAdmin, isLoading };
};
