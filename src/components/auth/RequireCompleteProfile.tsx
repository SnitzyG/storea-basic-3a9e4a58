import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { isProfileComplete } from '@/utils/profileUtils';

interface RequireCompleteProfileProps {
  children: ReactNode;
}

export const RequireCompleteProfile = ({ children }: RequireCompleteProfileProps) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // While auth/profile loading, don't flicker
  if (loading) return null;

  if (!user) return <Navigate to="/auth" replace />;

  // Allow the profile setup page itself
  if (location.pathname === '/profile-setup') return <>{children}</>;

  // If incomplete, force users to profile setup first
  if (!isProfileComplete(profile)) {
    return <Navigate to="/profile-setup" replace />;
  }

  return <>{children}</>;
};
