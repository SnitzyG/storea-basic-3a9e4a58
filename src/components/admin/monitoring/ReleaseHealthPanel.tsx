import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ErrorDetail } from '@/hooks/useMonitoringData';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ReleaseHealthPanelProps {
  errors: ErrorDetail[];
}

export const ReleaseHealthPanel = ({ errors }: ReleaseHealthPanelProps) => {
  const releaseStats = useMemo(() => {
    const stats: Record<string, { count: number; users: Set<string> }> = {};

    errors.forEach((error) => {
      const version = error.release_version || 'unknown';
      if (!stats[version]) {
        stats[version] = { count: 0, users: new Set() };
      }
      stats[version].count++;
      if (error.user_affected) {
        stats[version].users.add(error.user_affected);
      }
    });

    return Object.entries(stats)
      .map(([version, data]) => ({
        version,
        errorCount: data.count,
        affectedUsers: data.users.size,
        crashFreeRate: 100 - (data.users.size / Math.max(data.users.size, 100)) * 100,
      }))
      .sort((a, b) => b.errorCount - a.errorCount);
  }, [errors]);

  const getTrendIcon = (rate: number) => {
    if (rate >= 99) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (rate >= 95) return <Minus className="h-4 w-4 text-yellow-500" />;
    return <TrendingDown className="h-4 w-4 text-destructive" />;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {releaseStats.map((release) => (
        <Card key={release.version}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-base">v{release.version}</span>
              {getTrendIcon(release.crashFreeRate)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Errors</span>
              <Badge variant="destructive">{release.errorCount}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Affected Users</span>
              <Badge variant="outline">{release.affectedUsers}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Crash-Free Rate</span>
              <span className="font-bold">{release.crashFreeRate.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>
      ))}
      {releaseStats.length === 0 && (
        <Card className="col-span-full">
          <CardContent className="py-8 text-center text-muted-foreground">
            No release data available
          </CardContent>
        </Card>
      )}
    </div>
  );
};
