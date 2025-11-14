import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle } from 'lucide-react';
import { useSecurityMonitoring } from '@/hooks/useSecurityMonitoring';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

export const SecurityOverviewCard = () => {
  const { stats, loading } = useSecurityMonitoring();

  if (loading) return <Skeleton className="h-96 w-full" />;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'secure':
        return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
      case 'warning':
        return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20';
      case 'critical':
        return 'bg-destructive/10 text-destructive hover:bg-destructive/20';
      default:
        return '';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-destructive';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Overview
          </div>
          <Badge className={getStatusColor(stats?.status || 'secure')}>
            {stats?.status || 'secure'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Security Score</span>
            <span className={`font-bold text-2xl ${getScoreColor(stats?.securityScore || 100)}`}>
              {stats?.securityScore || 100}/100
            </span>
          </div>
          <Progress value={stats?.securityScore || 100} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Failed Logins (24h)</p>
            <p className="text-2xl font-bold text-destructive">{stats?.failedLoginAttempts24h || 0}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">RLS Violations</p>
            <p className="text-2xl font-bold text-destructive">{stats?.rlsViolations || 0}</p>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Recent Security Events
          </h4>
          {stats?.recentSecurityEvents.slice(0, 3).map((event: any) => (
            <div key={event.id} className="text-sm text-muted-foreground">
              {event.action} - {event.entity_type}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
