import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, TrendingUp } from 'lucide-react';
import { useDatabaseMonitoring } from '@/hooks/useDatabaseMonitoring';
import { Skeleton } from '@/components/ui/skeleton';

export const DatabasePerformanceCard = () => {
  const { stats, loading } = useDatabaseMonitoring();

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
            <Database className="h-5 w-5" />
            Database Performance
          </div>
          <Badge className={getStatusColor(stats?.status || 'healthy')}>
            {stats?.status || 'healthy'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Avg Response</p>
            <p className="text-2xl font-bold">{stats?.avgQueryResponseTime || 0}ms</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Slow Queries</p>
            <p className="text-2xl font-bold text-destructive">{stats?.slowQueries || 0}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Active Conn.</p>
            <p className="text-2xl font-bold">{stats?.activeConnections || 0}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Error Rate</p>
            <p className="text-2xl font-bold">{stats?.errorRate || 0}%</p>
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>Performance is {stats?.status === 'healthy' ? 'optimal' : 'degraded'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
