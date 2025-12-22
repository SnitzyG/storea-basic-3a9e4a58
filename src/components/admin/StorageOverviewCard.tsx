import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HardDrive } from 'lucide-react';
import { useStorageMonitoring } from '@/hooks/useSystemMonitoringHub';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

export const StorageOverviewCard = () => {
  const { stats, loading } = useStorageMonitoring();

  if (loading) return <Skeleton className="h-96 w-full" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          Storage Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Storage Used</span>
            <span>{stats?.totalStorageUsedMB.toFixed(2)} MB / {stats?.storageQuotaMB} MB</span>
          </div>
          <Progress value={stats?.percentageUsed || 0} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {stats?.buckets.slice(0, 4).map((bucket) => (
            <div key={bucket.name} className="text-sm">
              <p className="font-medium">{bucket.name}</p>
              <p className="text-muted-foreground">{bucket.file_count} files</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
