import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export default function AdminIndex() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      if (authLoading) return;
      if (!user) {
        setIsAdmin(false);
        setChecking(false);
        return;
      }
      try {
        const { data } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
        setIsAdmin(Boolean(data));
      } catch (e) {
        console.error('Admin check failed', e);
        setIsAdmin(false);
      } finally {
        setChecking(false);
      }
    };
    check();
  }, [user, authLoading]);

  if (authLoading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (user && isAdmin) return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/admin/login" replace />;
}
