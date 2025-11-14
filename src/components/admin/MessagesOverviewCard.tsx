import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMessagesMonitoring } from '@/hooks/useMessagesMonitoring';
import { Skeleton } from '@/components/ui/skeleton';

export const MessagesOverviewCard = () => {
  const navigate = useNavigate();
  const { stats, loading } = useMessagesMonitoring();

  if (loading) return <Skeleton className="h-96 w-full" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Messages Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Last 24h</p>
            <p className="text-2xl font-bold">{stats?.messagesSent24h || 0}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Active Threads</p>
            <p className="text-2xl font-bold">{stats?.activeThreads || 0}</p>
          </div>
        </div>
        <Button onClick={() => navigate('/messages')} className="w-full" variant="outline">
          View Messages
        </Button>
      </CardContent>
    </Card>
  );
};
