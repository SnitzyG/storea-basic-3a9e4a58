import { ChevronDown, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useProjectSelection } from '@/context/ProjectSelectionContext';

export const ProjectSelector = () => {
  const { selectedProject, setSelectedProject, availableProjects, loading } = useProjectSelection();

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
        <Building className="h-4 w-4" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (availableProjects.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
        <Building className="h-4 w-4" />
        <span className="text-sm">No project added</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 max-w-[200px]">
          <Building className="h-4 w-4" />
          <span className="truncate">
            {selectedProject ? selectedProject.name : 'Select Project'}
          </span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[250px]">
        {availableProjects.map((project) => (
          <DropdownMenuItem
            key={project.id}
            onClick={() => setSelectedProject(project)}
            className="flex flex-col items-start gap-1 p-3"
          >
            <div className="font-medium text-sm">{project.name}</div>
            {project.address && (
              <div className="text-xs text-muted-foreground truncate w-full">
                {project.address}
              </div>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};