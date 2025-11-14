import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorDetail } from '@/hooks/useMonitoringData';
import { Users, AlertCircle, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface UserAnalyticsPanelProps {
  errors: ErrorDetail[];
  affectedUsers: number;
  crashFreeRate: number;
}

export const UserAnalyticsPanel = ({ errors, affectedUsers, crashFreeRate }: UserAnalyticsPanelProps) => {
  const userErrorCounts = errors.reduce((acc, error) => {
    if (!error.user_affected) return acc;
    acc[error.user_affected] = (acc[error.user_affected] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topAffectedUsers = Object.entries(userErrorCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Impact Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <div className="text-sm text-muted-foreground">Affected Users</div>
              <div className="text-2xl font-bold">{affectedUsers}</div>
            </div>
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <div className="text-sm text-muted-foreground">Crash-Free Rate</div>
              <div className="text-2xl font-bold">{crashFreeRate}%</div>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <div className="text-sm text-muted-foreground">Total Error Events</div>
              <div className="text-2xl font-bold">{errors.length}</div>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Most Affected Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topAffectedUsers.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No user data available
              </div>
            ) : (
              topAffectedUsers.map(([userId, count]) => (
                <div key={userId} className="flex items-center justify-between p-2 rounded bg-muted/30">
                  <span className="text-sm font-mono truncate">{userId.slice(0, 8)}...</span>
                  <Badge variant="destructive">{count} errors</Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
