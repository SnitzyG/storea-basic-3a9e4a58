import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '@/hooks/useProjects';
import { Skeleton } from '@/components/ui/skeleton';

interface ProjectsOverviewCardProps {
  stats: {
    total: number;
    active: number;
    onTrack: number;
    atRisk: number;
    delayed: number;
    completed: number;
    healthScore: number;
  } | null;
}

export const ProjectsOverviewCard = ({ stats }: ProjectsOverviewCardProps) => {
  const navigate = useNavigate();
  const { projects, loading } = useProjects();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'on_hold': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  if (!stats) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Projects Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Projects Overview</CardTitle>
          <Badge variant={stats.healthScore >= 80 ? 'default' : 'destructive'}>
            {stats.healthScore >= 80 ? (
              <TrendingUp className="h-3 w-3 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1" />
            )}
            {stats.healthScore}% Health
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.onTrack}</div>
            <div className="text-xs text-muted-foreground">On Track</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.atRisk}</div>
            <div className="text-xs text-muted-foreground">At Risk</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.delayed}</div>
            <div className="text-xs text-muted-foreground">Delayed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
        </div>

        {/* Top Projects List */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Active Projects</h4>
          {loading ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <div className="space-y-2">
              {projects.slice(0, 5).map(project => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors"
                  onClick={() => navigate('/projects')}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`} />
                      <span className="font-medium truncate">{project.name}</span>
                    </div>
                    <Progress value={50} className="h-1 mt-2" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground ml-2" />
                </div>
              ))}
              
              {projects.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No active projects
                </div>
              )}
            </div>
          )}
        </div>

        <Button 
          variant="outline" 
          className="w-full" 
          onClick={() => navigate('/projects')}
        >
          View All Projects
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
};
