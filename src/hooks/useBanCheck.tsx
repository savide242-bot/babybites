import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export const useBanCheck = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const checkBanStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_banned, banned_reason')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error checking ban status:', error);
        return;
      }

      if (profile?.is_banned) {
        // Sign out the user
        await supabase.auth.signOut();
        
        toast({
          title: '🚫 Conta Suspensa',
          description: profile.banned_reason || 'A sua conta foi suspensa. Contacte o suporte para mais informações.',
          variant: 'destructive',
          duration: 10000,
        });

        navigate('/auth', { replace: true });
      }
    };

    checkBanStatus();

    // Also check on auth state change
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        checkBanStatus();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [toast, navigate]);
};
