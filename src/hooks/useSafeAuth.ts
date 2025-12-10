import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface SafeAuthState {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
}

/**
 * A safe auth hook for public pages that won't throw if auth isn't ready.
 * Returns null/false values while loading instead of blocking render.
 */
export const useSafeAuth = (): SafeAuthState => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Check admin status in background - don't block render
          setTimeout(async () => {
            try {
              const { data } = await supabase.rpc('has_role', {
                _user_id: session.user.id,
                _role: 'admin'
              });
              if (mounted) setIsAdmin(Boolean(data));
            } catch {
              // Silently fail - admin check is not critical
            }
          }, 0);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Auth init error:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Set up listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (mounted) {
          setUser(session?.user ?? null);
          if (!session?.user) {
            setIsAdmin(false);
          }
        }
      }
    );

    initAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { user, isLoading, isAdmin };
};
