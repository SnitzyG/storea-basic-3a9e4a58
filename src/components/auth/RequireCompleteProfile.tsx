import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { isProfileComplete } from '@/utils/profileUtils';
import { supabase } from '@/integrations/supabase/client';

interface RequireCompleteProfileProps {
  children: ReactNode;
}

export const RequireCompleteProfile = ({ children }: RequireCompleteProfileProps) => {
  const { user, loading } = useAuth();

  // While auth loading, don't flicker
  if (loading) return null;

  if (!user) return <Navigate to="/auth" replace />;

  return <>{children}</>;
};
