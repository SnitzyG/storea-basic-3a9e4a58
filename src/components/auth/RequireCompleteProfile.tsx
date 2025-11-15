import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface RequireCompleteProfileProps {
  children: ReactNode;
}

export const RequireCompleteProfile = ({ children }: RequireCompleteProfileProps) => {
  const { user, loading } = useAuth();

  // While auth is loading, don't show anything
  if (loading) return null;

  // If not authenticated, redirect to auth page
  if (!user) return <Navigate to="/auth" replace />;

  // User is authenticated, allow access to app
  return <>{children}</>;
};
