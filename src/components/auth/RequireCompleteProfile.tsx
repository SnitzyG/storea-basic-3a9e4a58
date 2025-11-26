import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { isProfileComplete } from '@/utils/profileUtils';
import { supabase } from '@/integrations/supabase/client';

interface RequireCompleteProfileProps {
  children: ReactNode;
}

export const RequireCompleteProfile = ({ children }: RequireCompleteProfileProps) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminCheckLoading, setAdminCheckLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setAdminCheckLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin'
        });

        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(data === true);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setAdminCheckLoading(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  // While auth/profile/admin status loading, don't flicker
  if (loading || adminCheckLoading) return null;

  if (!user) return <Navigate to="/auth" replace />;

  // Allow the profile setup page itself
  if (location.pathname === '/profile-setup') return <>{children}</>;

  // Allow admin routes without profile completion
  if (location.pathname.startsWith('/admin') && isAdmin) {
    return <>{children}</>;
  }

  // Profile completion is now optional - users can access app without completing profile
  return <>{children}</>;
};
