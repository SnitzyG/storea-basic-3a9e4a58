import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getSystemMetrics, getAdminAlerts, getAuditLogs, resolveAlert } from '@/api/admin';
import { Activity, Users, AlertCircle, TrendingUp, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const { toast } = useToast();
  const [activeUsersCount, setActiveUsersCount] = useState(0);

  // Fetch system metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['system-metrics'],
    queryFn: getSystemMetrics,
  });

  // Fetch active users count
  useEffect(() => {
    const fetchActiveUsers = async () => {
      const { count } = await (supabase as any)
        .from('user_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      setActiveUsersCount(count || 0);
    };
    fetchActiveUsers();

    const channel = supabase
      .channel('user-sessions-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_sessions' }, () => {
        fetchActiveUsers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Fetch alerts
  const { data: alerts, isLoading: alertsLoading, refetch: refetchAlerts } = useQuery({
    queryKey: ['admin-alerts'],
    queryFn: getAdminAlerts,
  });

  // Fetch recent audit logs
  const { data: auditLogs, isLoading: logsLoading } = useQuery({
    queryKey: ['audit-logs-recent'],
    queryFn: () => getAuditLogs(),
  });

  // Real-time subscription for alerts
  useEffect(() => {
    const channel = supabase
      .channel('admin-alerts-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_alerts' }, () => {
        refetchAlerts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetchAlerts]);

  const handleResolveAlert = async (alertId: string) => {
    try {
      await resolveAlert(alertId);
      toast({
        title: 'Alert Resolved',
        description: 'Alert has been marked as resolved.',
      });
      refetchAlerts();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to resolve alert',
        variant: 'destructive',
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'warning': return 'default';
      default: return 'secondary';
    }
  };

  const criticalAlerts = alerts?.filter(a => !a.resolved_at) || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">System overview and monitoring</p>
        </div>

        {/* Metric Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-green-500">Healthy</div>
                  <p className="text-xs text-muted-foreground">All systems operational</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Uptime</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{metrics?.uptime?.value || 0}%</div>
                  <p className="text-xs text-muted-foreground">Last 30 days</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeUsersCount}</div>
              <p className="text-xs text-muted-foreground">Currently online</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error Rate (24h)</CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{metrics?.error_rate_24h?.value || 0}%</div>
                  <p className="text-xs text-muted-foreground">System errors</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Critical Alerts Section */}
        {criticalAlerts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Critical Alerts ({criticalAlerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alertsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : (
                <div className="space-y-3">
                  {criticalAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                      <AlertCircle className={`h-5 w-5 mt-0.5 ${alert.severity === 'critical' ? 'text-destructive' : 'text-yellow-500'}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                          <span className="font-medium">{alert.title}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(alert.created_at), 'PPpp')}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleResolveAlert(alert.id)}
                      >
                        Resolve
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : auditLogs && auditLogs.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-5 gap-4 pb-2 border-b text-sm font-medium text-muted-foreground">
                  <div>Timestamp</div>
                  <div>Action</div>
                  <div>Resource</div>
                  <div>Status</div>
                  <div>Details</div>
                </div>
                {auditLogs.slice(0, 10).map((log) => (
                  <div key={log.id} className="grid grid-cols-5 gap-4 py-2 text-sm items-center">
                    <div className="text-muted-foreground">
                      {format(new Date(log.created_at), 'MMM d, HH:mm')}
                    </div>
                    <div className="font-medium">{log.action}</div>
                    <div className="text-muted-foreground">{log.resource_type || '-'}</div>
                    <div>
                      <Badge variant={log.status === 'success' ? 'secondary' : 'destructive'}>
                        {log.status}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground truncate">
                      {log.resource_name || log.error_message || '-'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No recent activity</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
