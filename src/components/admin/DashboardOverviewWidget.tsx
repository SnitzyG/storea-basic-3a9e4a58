// @ts-nocheck
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Users, Activity, AlertTriangle, TrendingUp, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SystemHealth {
  active_users: number;
  total_users: number;
  total_projects: number;
  active_projects: number;
  pending_approvals: number;
  critical_alerts: number;
  total_rfis: number;
  open_rfis: number;
  total_tenders: number;
  open_tenders: number;
  total_documents: number;
  messages_24h: number;
}

export function DashboardOverviewWidget() {
  const navigate = useNavigate();
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [uptime] = useState(99.9);

  const fetchHealth = async () => {
    try {
      const { data, error } = await supabase.rpc('get_system_health');
      if (error) throw error;
      
      // Handle the response - it comes as an array with one row
      const healthData = Array.isArray(data) && data.length > 0 ? data[0] : data;
      setHealth(healthData as unknown as SystemHealth);
    } catch (error) {
      console.error('Error fetching system health:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();

    const interval = setInterval(fetchHealth, 30 * 1000);

    const channel = supabase
      .channel('health-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchHealth)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, fetchHealth)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_alerts' }, fetchHealth)
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading || !health) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-muted rounded" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const getUptimeColor = () => {
    if (uptime >= 99.5) return 'text-green-500';
    if (uptime >= 95) return 'text-yellow-500';
    return 'text-destructive';
  };

  const stats = [
    {
      label: 'Total Users',
      value: health.total_users,
      icon: Users,
      color: 'text-blue-500',
      action: () => navigate('/admin/users'),
    },
    {
      label: 'Online Now',
      value: health.active_users,
      icon: Activity,
      color: 'text-green-500',
      highlight: health.active_users > 0,
      action: () => navigate('/admin/users'),
    },
    {
      label: 'System Uptime',
      value: `${uptime}%`,
      icon: TrendingUp,
      color: getUptimeColor(),
      highlight: uptime >= 99.5,
    },
    {
      label: 'Critical Alerts',
      value: health.critical_alerts,
      icon: AlertTriangle,
      color: health.critical_alerts > 0 ? 'text-destructive' : 'text-muted-foreground',
      highlight: health.critical_alerts > 0,
      action: () => navigate('/admin/alerts'),
    },
  ];

  return (
    <Card className="shadow-sm border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">System Overview</CardTitle>
          <Badge 
            variant={health.critical_alerts > 0 ? 'destructive' : 'secondary'}
            className="text-xs"
          >
            {health.critical_alerts > 0 ? 'Issues Detected' : 'All Systems Normal'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className={`rounded-lg border border-border bg-card p-4 transition-all ${
                  stat.action ? 'cursor-pointer hover:shadow-md hover:border-primary/50' : ''
                }`}
                onClick={stat.action}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                  {stat.highlight && (
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center justify-between">
                    {stat.label}
                    {stat.action && <ChevronRight className="h-3 w-3" />}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Active Projects</p>
            <p className="text-lg font-semibold text-foreground">
              {health.active_projects}/{health.total_projects}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Open RFIs</p>
            <p className="text-lg font-semibold text-foreground">
              {health.open_rfis}/{health.total_rfis}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Pending Approvals</p>
            <p className="text-lg font-semibold text-foreground">{health.pending_approvals}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Messages (24h)</p>
            <p className="text-lg font-semibold text-foreground">{health.messages_24h}</p>
          </div>
        </div>

        {health.pending_approvals > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <Button 
              onClick={() => navigate('/admin/approvals')}
              variant="outline"
              className="w-full gap-2"
            >
              <Users className="h-4 w-4" />
              Review {health.pending_approvals} Pending Approval{health.pending_approvals !== 1 ? 's' : ''}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
