import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTasksMonitoring } from '@/hooks/useSystemMonitoringHub';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

export const TasksOverviewCard = () => {
  const navigate = useNavigate();
  const { stats, loading } = useTasksMonitoring();

  if (loading) return <Skeleton className="h-96 w-full" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5" />
          Tasks Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Completion Rate</span>
            <span className="font-medium">{stats?.completionRate.toFixed(1)}%</span>
          </div>
          <Progress value={stats?.completionRate || 0} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{stats?.totalTasks || 0}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-primary">{stats?.pendingTasks || 0}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Overdue</p>
            <p className="text-2xl font-bold text-destructive">{stats?.overdueTasks || 0}</p>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">By Priority</h4>
          {stats?.tasksByPriority.map((item) => (
            <div key={item.priority} className="flex justify-between text-sm">
              <span className="capitalize">{item.priority}</span>
              <span className="font-medium">{item.count}</span>
            </div>
          ))}
        </div>

        <Button onClick={() => navigate('/todos')} className="w-full" variant="outline">
          View All Tasks
        </Button>
      </CardContent>
    </Card>
  );
};
