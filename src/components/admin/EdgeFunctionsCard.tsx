import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap } from 'lucide-react';
import { useEdgeFunctionsMonitoring } from '@/hooks/useSystemMonitoringHub';
import { Skeleton } from '@/components/ui/skeleton';

export const EdgeFunctionsCard = () => {
  const { stats, loading } = useEdgeFunctionsMonitoring();

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
            <Zap className="h-5 w-5" />
            Edge Functions
          </div>
          <Badge className={getStatusColor(stats?.status || 'healthy')}>
            {stats?.status || 'healthy'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Executions</p>
            <p className="text-2xl font-bold">{stats?.totalExecutions || 0}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Error Rate</p>
            <p className="text-2xl font-bold">{stats?.overallErrorRate.toFixed(1) || 0}%</p>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Top Functions</h4>
          {stats?.functions.slice(0, 5).map((func) => (
            <div key={func.name} className="flex items-center justify-between text-sm">
              <span className="truncate">{func.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{func.executionCount}</span>
                {func.errorRate > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {func.errorRate.toFixed(1)}%
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
