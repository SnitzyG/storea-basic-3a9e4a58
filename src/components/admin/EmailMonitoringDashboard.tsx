import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Mail, 
  RefreshCw,
  Users,
  Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface EmailStats {
  total_pending: number;
  expired_invitations: number;
  recent_successes: number;
  recent_failures: number;
}

interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
  invited_by: string;
  project_id: string;
  projects?: {
    name: string;
  };
  inviter_profile?: {
    name?: string;
    full_name?: string;
  };
}

export function EmailMonitoringDashboard() {
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEmailStats = async () => {
    try {
      setError(null);
      
      // Get basic stats
      const { data: pending, error: pendingError } = await supabase
        .from('invitations')
        .select('id, expires_at')
        .gt('expires_at', new Date().toISOString());

      if (pendingError) throw pendingError;

      const { data: expired, error: expiredError } = await supabase
        .from('invitations')
        .select('id')
        .lt('expires_at', new Date().toISOString());

      if (expiredError) throw expiredError;

      // Get recent activity (last 24 hours)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      const { data: recentInvitations, error: recentError } = await supabase
        .from('invitations')
        .select('id')
        .gte('created_at', yesterday);

      if (recentError) throw recentError;

      setStats({
        total_pending: pending?.length || 0,
        expired_invitations: expired?.length || 0,
        recent_successes: 0, // Would need activity log to track this
        recent_failures: 0   // Would need error log to track this
      });

      // Fetch detailed pending invitations
      const { data: detailedPending, error: detailedError } = await supabase
        .from('invitations')
        .select(`
          id,
          email,
          role,
          created_at,
          expires_at,
          inviter_id,
          project_id,
          projects:project_id (name)
        `)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      if (detailedError) throw detailedError;

      // Get inviter profiles separately
      const inviterIds = detailedPending?.map(inv => inv.inviter_id) || [];
      const { data: inviterProfiles } = await supabase
        .from('profiles')
        .select('user_id, name, full_name')
        .in('user_id', inviterIds);

      // Combine the data
      const enrichedInvitations = (detailedPending || []).map(invitation => ({
        ...invitation,
        invited_by: invitation.inviter_id, // For compatibility
        inviter_profile: inviterProfiles?.find(profile => profile.user_id === invitation.inviter_id)
      }));

      setPendingInvitations(enrichedInvitations);
    } catch (err: any) {
      console.error('Error fetching email stats:', err);
      setError(err.message);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchEmailStats();
    setRefreshing(false);
  };

  const cleanupExpired = async () => {
    try {
      const { error } = await supabase.rpc('cleanup_expired_invitations');
      if (error) throw error;
      
      await refreshData();
    } catch (err: any) {
      console.error('Error cleaning up expired invitations:', err);
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchEmailStats().finally(() => setLoading(false));
  }, []);

  const getStatusBadge = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const hoursUntilExpiry = (expires.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilExpiry < 24) {
      return <Badge variant="destructive" className="gap-1"><Clock className="h-3 w-3" />Expires Soon</Badge>;
    } else if (hoursUntilExpiry < 72) {
      return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Expires in {Math.floor(hoursUntilExpiry / 24)}d</Badge>;
    } else {
      return <Badge variant="outline" className="gap-1"><CheckCircle className="h-3 w-3" />Active</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          Loading email monitoring data...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email System Monitoring</h2>
          <p className="text-muted-foreground">Monitor team invitation emails and system health</p>
        </div>
        <Button onClick={refreshData} disabled={refreshing} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Invitations</p>
                <p className="text-2xl font-bold">{stats?.total_pending || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expired</p>
                <p className="text-2xl font-bold">{stats?.expired_invitations || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recent Success</p>
                <p className="text-2xl font-bold">{stats?.recent_successes || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recent Failures</p>
                <p className="text-2xl font-bold">{stats?.recent_failures || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email Configuration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Email Service Status
          </CardTitle>
          <CardDescription>Current configuration and health status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Resend Domain Verification Required:</strong> To send emails to all recipients, please verify your domain at{' '}
                <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  resend.com/domains
                </a>. Currently, emails can only be sent to verified addresses.
              </AlertDescription>
            </Alert>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">Configuration</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Email service is configured with retry mechanism and enhanced error handling.
                </p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">Rate Limiting</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Automatic retry with exponential backoff. Rate limit detection enabled.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Pending Invitations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recent Pending Invitations
            </CardTitle>
            <CardDescription>Latest team invitations awaiting acceptance</CardDescription>
          </div>
          {stats?.expired_invitations && stats.expired_invitations > 0 && (
            <Button onClick={cleanupExpired} variant="outline" size="sm">
              Clean Up Expired
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {pendingInvitations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No pending invitations</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingInvitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{invitation.email}</p>
                      <Badge variant="outline" className="capitalize">{invitation.role}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Project: {invitation.projects?.name || 'Unknown'} • 
                      Invited by: {invitation.inviter_profile?.name || invitation.inviter_profile?.full_name || 'Unknown'} • 
                      {formatDistanceToNow(new Date(invitation.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(invitation.expires_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}