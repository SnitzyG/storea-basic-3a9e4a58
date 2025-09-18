import { ChevronDown, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useProjectSelection } from '@/context/ProjectSelectionContext';

export const ProjectSelector = () => {
  const { selectedProject, setSelectedProject, availableProjects, loading } = useProjectSelection();

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg animate-pulse">
        <Building className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading projects...</span>
      </div>
    );
  }

  if (availableProjects.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
        <Building className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">No project added</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-2 max-w-[200px] min-w-[160px] justify-between bg-background hover:bg-accent"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Building className="h-4 w-4 text-primary" />
            <span className="truncate text-sm">
              {selectedProject ? selectedProject.name : 'Select Project'}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="w-[280px] bg-background border shadow-lg z-50"
        sideOffset={8}
      >
        {availableProjects.map((project) => (
          <DropdownMenuItem
            key={project.id}
            onClick={() => setSelectedProject(project)}
            className={`flex flex-col items-start gap-1 p-3 cursor-pointer hover:bg-accent focus:bg-accent ${
              selectedProject?.id === project.id ? 'bg-accent/50' : ''
            }`}
          >
            <div className="font-medium text-sm text-foreground">{project.name}</div>
            {project.address && (
              <div className="text-xs text-muted-foreground truncate w-full">
                {project.address}
              </div>
            )}
            {selectedProject?.id === project.id && (
              <div className="text-xs text-primary font-medium">• Currently Selected</div>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};