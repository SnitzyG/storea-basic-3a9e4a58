import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { useUserSessionMonitoring } from '@/hooks/useUserSessionMonitoring';
import { Skeleton } from '@/components/ui/skeleton';

export const UserActivityCard = () => {
  const { stats, loading } = useUserSessionMonitoring();

  if (loading) return <Skeleton className="h-96 w-full" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          User Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Users</p>
            <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Online Now</p>
            <p className="text-2xl font-bold text-primary">{stats?.onlineUsers || 0}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-destructive">{stats?.pendingApprovals || 0}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
