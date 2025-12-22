import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCalendarMonitoring } from '@/hooks/useSystemMonitoringHub';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

export const CalendarOverviewCard = () => {
  const navigate = useNavigate();
  const { stats, loading } = useCalendarMonitoring();

  if (loading) return <Skeleton className="h-96 w-full" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Calendar Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Today</p>
            <p className="text-2xl font-bold">{stats?.eventsToday || 0}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">This Week</p>
            <p className="text-2xl font-bold">{stats?.eventsThisWeek || 0}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Overdue</p>
            <p className="text-2xl font-bold text-destructive">{stats?.overdueEvents || 0}</p>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Upcoming Events</h4>
          {stats?.upcomingEvents.slice(0, 3).map((event: any) => (
            <div key={event.id} className="flex items-start gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="truncate">{event.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(event.start_datetime), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>

        <Button onClick={() => navigate('/calendar')} className="w-full" variant="outline">
          View Calendar
        </Button>
      </CardContent>
    </Card>
  );
};
