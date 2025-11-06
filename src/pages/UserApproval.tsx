import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, Mail, User, Building } from 'lucide-react';
import { Navigate } from 'react-router-dom';

interface PendingUser {
  user_id: string;
  name: string;
  email?: string;
  role: string;
  company_id?: string;
  company_name?: string;
  created_at: string;
}

export default function UserApproval() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      fetchPendingUsers();
    }
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (!error && data) {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          user_id,
          name,
          role,
          company_id,
          created_at,
          companies (
            name
          )
        `)
        .eq('approved', false)
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get emails from auth.users (Note: admin API not available in client)
      const pendingWithEmails: PendingUser[] = profilesData?.map(profile => ({
        user_id: profile.user_id,
        name: profile.name,
        email: '', // Email not available from client-side
        role: profile.role,
        company_id: profile.company_id,
        company_name: (profile.companies as any)?.name || '',
        created_at: profile.created_at
      })) || [];

      setPendingUsers(pendingWithEmails);
    } catch (error) {
      console.error('Error fetching pending users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch pending users',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('approve_user', {
        target_user_id: userId
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'User approved successfully'
      });

      fetchPendingUsers();
    } catch (error: any) {
      console.error('Error approving user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve user',
        variant: 'destructive'
      });
    }
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to access this page.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">User Approval</h1>
        <p className="text-muted-foreground">
          Review and approve pending user registrations
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading pending users...</p>
        </div>
      ) : pendingUsers.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
          <h3 className="text-xl font-semibold mb-2">All Caught Up!</h3>
          <p className="text-muted-foreground">
            No pending user approvals at this time.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pendingUsers.map((user) => (
            <Card key={user.user_id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{user.name}</h3>
                      <Badge variant="outline" className="mt-1">
                        {user.role}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid gap-2 text-sm text-muted-foreground">
                    {user.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>{user.email}</span>
                      </div>
                    )}
                    {user.company_name && (
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        <span>{user.company_name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>
                        Registered {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleApprove(user.user_id)}
                    className="gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
