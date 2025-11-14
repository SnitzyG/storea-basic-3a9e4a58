import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Database, Zap, AlertCircle, ExternalLink } from 'lucide-react';
import { SystemHealth } from '@/hooks/useSystemHealth';
import { formatDistanceToNow } from 'date-fns';

interface SystemHealthWidgetProps {
  health: SystemHealth;
}

export const SystemHealthWidget = ({ health }: SystemHealthWidgetProps) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
        return <Badge className="bg-green-500">Healthy</Badge>;
      case 'degraded':
        return <Badge className="bg-yellow-500">Degraded</Badge>;
      case 'down':
      case 'disconnected':
        return <Badge variant="destructive">Down</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const projectId = 'inibugusrzfihldvegrb';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          System Health
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Database Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Database</span>
            </div>
            {getStatusBadge(health.database.status)}
          </div>
          <div className="text-xs text-muted-foreground">
            Response: {health.database.responseTime}ms
          </div>
          <div className="text-xs text-muted-foreground">
            Last check: {formatDistanceToNow(health.database.lastCheck, { addSuffix: true })}
          </div>
        </div>

        {/* API Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">API Services</span>
            </div>
            {getStatusBadge(health.api.status)}
          </div>
          <div className="text-xs text-muted-foreground">
            Uptime: {health.api.uptime}%
          </div>
        </div>

        {/* Real-time Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Real-time</span>
            </div>
            {getStatusBadge(health.realtime.status)}
          </div>
          <div className="text-xs text-muted-foreground">
            Active subscriptions: {health.realtime.activeSubscriptions}
          </div>
        </div>

        {/* Error Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Errors (24h)</span>
            </div>
            <Badge variant={health.errors.last24h > 10 ? 'destructive' : 'outline'}>
              {health.errors.last24h}
            </Badge>
          </div>
        </div>

        {/* Recent Errors */}
        {health.errors.recentErrors.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Recent Issues</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {health.errors.recentErrors.slice(0, 3).map((error, index) => (
                <div key={index} className="p-2 rounded-lg bg-destructive/10 border border-destructive/20">
                  <div className="text-xs font-medium text-destructive">{error.severity}</div>
                  <p className="text-xs text-muted-foreground truncate">{error.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="space-y-2 pt-2 border-t">
          <h4 className="text-sm font-semibold">System Logs</h4>
          <div className="space-y-1">
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs justify-start"
              onClick={() => window.open(`https://supabase.com/dashboard/project/${projectId}/logs/postgres-logs`, '_blank')}
            >
              Database Logs
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs justify-start"
              onClick={() => window.open(`https://supabase.com/dashboard/project/${projectId}/functions`, '_blank')}
            >
              Edge Function Logs
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs justify-start"
              onClick={() => window.open(`https://supabase.com/dashboard/project/${projectId}/logs/auth-logs`, '_blank')}
            >
              Auth Logs
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
