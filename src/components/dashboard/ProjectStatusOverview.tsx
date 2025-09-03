import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useProjects } from '@/hooks/useProjects';
import { useRFIs } from '@/hooks/useRFIs';
import { useTenders } from '@/hooks/useTenders';
import { FolderOpen, TrendingUp, Users, Calendar } from 'lucide-react';

export const ProjectStatusOverview = () => {
  const { projects } = useProjects();
  
  // Calculate overall project statistics
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const completionRate = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;

  const statusCounts = {
    planning: projects.filter(p => p.status === 'planning').length,
    active: activeProjects,
    on_hold: projects.filter(p => p.status === 'on_hold').length,
    completed: completedProjects,
  };

  const statusColors = {
    planning: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
    active: 'bg-green-500/10 text-green-700 border-green-500/20',
    on_hold: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
    completed: 'bg-gray-500/10 text-gray-700 border-gray-500/20',
  };

  const recentProjects = projects
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeProjects}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedProjects}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate.toFixed(1)}%</div>
            <Progress value={completionRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Project Status Distribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(statusCounts).map(([status, count]) => (
            <div key={status} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge className={statusColors[status as keyof typeof statusColors]}>
                  {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {count} project{count !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="w-32 bg-muted rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    status === 'planning' ? 'bg-blue-500' :
                    status === 'active' ? 'bg-green-500' :
                    status === 'on_hold' ? 'bg-yellow-500' :
                    'bg-gray-500'
                  }`}
                  style={{ width: `${totalProjects > 0 ? (count / totalProjects) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {recentProjects.length > 0 ? (
            <div className="space-y-3">
              {recentProjects.map((project) => (
                <div key={project.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-md">
                  <div>
                    <h4 className="font-medium">{project.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {project.address || 'No address specified'}
                    </p>
                  </div>
                  <Badge className={statusColors[project.status as keyof typeof statusColors]}>
                    {project.status.replace('_', ' ')}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No projects found
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};