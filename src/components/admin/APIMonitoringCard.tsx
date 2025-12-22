import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Network } from 'lucide-react';
import { useAPIMonitoring } from '@/hooks/useSystemMonitoringHub';
import { Skeleton } from '@/components/ui/skeleton';

export const APIMonitoringCard = () => {
  const { stats, loading } = useAPIMonitoring();

  if (loading) return <Skeleton className="h-96 w-full" />;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
      case 'degraded':
        return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20';
      case 'down':
        return 'bg-destructive/10 text-destructive hover:bg-destructive/20';
      default:
        return '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            API Monitoring
          </div>
          <Badge className={getStatusColor(stats?.status || 'healthy')}>
            {stats?.status || 'healthy'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Requests</p>
            <p className="text-2xl font-bold">{stats?.totalRequests.toLocaleString() || 0}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Avg Response</p>
            <p className="text-2xl font-bold">{stats?.avgResponseTime || 0}ms</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Error Rate</p>
            <p className="text-2xl font-bold text-destructive">{stats?.errorRate.toFixed(2) || 0}%</p>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Top Endpoints</h4>
          {stats?.endpoints.slice(0, 5).map((endpoint) => (
            <div key={endpoint.endpoint} className="flex items-center justify-between text-sm">
              <span className="truncate">{endpoint.endpoint}</span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{endpoint.requestCount}</span>
                <span className="text-xs">{endpoint.avgResponseTime}ms</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
