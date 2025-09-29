import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Project } from '@/hooks/useProjects';
import { CalendarDays, MapPin, DollarSign, Eye, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
interface ProjectCardProps {
  project: Project;
  onView: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}
const statusColors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  planning: 'default',
  active: 'default',
  on_hold: 'secondary',
  completed: 'outline',
  cancelled: 'destructive'
};
const statusLabels = {
  planning: 'Planning',
  active: 'Active',
  on_hold: 'On Hold',
  completed: 'Completed',
  cancelled: 'Cancelled'
};
export const ProjectCard = ({
  project,
  onView,
  onEdit,
  onDelete
}: ProjectCardProps) => {
  const {
    profile
  } = useAuth();
  const isArchitect = profile?.role === 'architect';
  return <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{project.name}</CardTitle>
            <CardDescription className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {project.address || 'No address specified'}
            </CardDescription>
          </div>
          <Badge variant={statusColors[project.status]}>
            {statusLabels[project.status]}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {project.description && <p className="text-sm text-muted-foreground line-clamp-2">
            {project.description}
          </p>}
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {project.budget && <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              ${project.budget.toLocaleString()}
            </div>}
          <div className="flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            {new Date(project.created_at).toLocaleDateString()}
          </div>
        </div>
        
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => onView(project)}>
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          {isArchitect && <>
              
              <Button variant="outline" size="sm" onClick={() => onDelete(project)}>
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </>}
        </div>
      </CardContent>
    </Card>;
};