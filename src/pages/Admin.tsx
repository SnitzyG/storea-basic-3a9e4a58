import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { UserApprovalDashboard } from '@/components/admin/UserApprovalDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';

export default function Admin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin',
        });

        if (error) throw error;
        setIsAdmin(data);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card className="shadow-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Shield className="h-6 w-6 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent" />
            <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Admin Dashboard
            </span>
          </CardTitle>
          <CardDescription>Manage user approvals and system settings</CardDescription>
        </CardHeader>
      </Card>

      <UserApprovalDashboard />
    </div>
  );
}
