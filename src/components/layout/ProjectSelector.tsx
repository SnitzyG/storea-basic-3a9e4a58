import { ChevronDown, Building, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { useProjectSelection } from '@/context/ProjectSelectionContext';
import { useAuth } from '@/hooks/useAuth';

export const ProjectSelector = () => {
  const { 
    selectedProject, 
    setSelectedProject, 
    availableProjects, 
    selectedTender,
    setSelectedTender,
    availableTenders,
    loading,
    selectionType 
  } = useProjectSelection();
  const { profile } = useAuth();
  
  const isArchitect = profile?.role === 'architect';
  const isBuilder = profile?.role === 'builder';

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg animate-pulse">
        <Building className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading projects...</span>
      </div>
    );
  }

  if (availableProjects.length === 0 && availableTenders.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
        <Building className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">No project added</span>
      </div>
    );
  }

  // Determine display name based on selection and role
  const getDisplayName = () => {
    if (selectionType === 'tender' && selectedTender) {
      // For architects, show project name (tender is linked to project)
      if (isArchitect) {
        const linkedProject = availableProjects.find(p => p.id === selectedTender.project_id);
        return linkedProject?.name || selectedTender.title;
      }
      // For builders, show tender title directly
      return selectedTender.title;
    }
    return selectedProject?.name || 'Select Project';
  };

  const getDisplayIcon = () => {
    if (selectionType === 'tender' && selectedTender) {
      return <FileText className="h-4 w-4 text-primary" />;
    }
    return <Building className="h-4 w-4 text-primary" />;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="flex items-center gap-2 max-w-[200px] min-w-[160px] justify-between bg-background hover:bg-accent"
        >
          <div className="flex items-center gap-2 min-w-0">
            {getDisplayIcon()}
            <span className="truncate text-sm">
              {getDisplayName()}
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
        {availableProjects.length > 0 && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1.5">
              Projects
            </DropdownMenuLabel>
            {availableProjects.map((project) => (
              <DropdownMenuItem
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className={`flex items-center gap-2 p-3 cursor-pointer hover:bg-accent focus:bg-accent ${
                  selectionType === 'project' && selectedProject?.id === project.id ? 'bg-accent/50' : ''
                }`}
              >
                <Building className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex flex-col items-start gap-1 min-w-0 flex-1">
                  <div className="font-medium text-sm text-foreground truncate w-full">{project.name}</div>
                  {project.address && (
                    <div className="text-xs text-muted-foreground truncate w-full">
                      {project.address}
                    </div>
                  )}
                  {selectionType === 'project' && selectedProject?.id === project.id && (
                    <div className="text-xs text-primary font-medium">• Currently Selected</div>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}
        
        {availableTenders.length > 0 && availableProjects.length > 0 && (
          <DropdownMenuSeparator />
        )}
        
        {availableTenders.length > 0 && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1.5">
              Tenders
            </DropdownMenuLabel>
            {availableTenders.map((tender) => {
              // For architects, show project name
              const displayName = isArchitect 
                ? availableProjects.find(p => p.id === tender.project_id)?.name || tender.title
                : tender.title;
              
              return (
                <DropdownMenuItem
                  key={tender.id}
                  onClick={() => setSelectedTender(tender)}
                  className={`flex items-center gap-2 p-3 cursor-pointer hover:bg-accent focus:bg-accent ${
                    selectionType === 'tender' && selectedTender?.id === tender.id ? 'bg-accent/50' : ''
                  }`}
                >
                  <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex flex-col items-start gap-1 min-w-0 flex-1">
                    <div className="font-medium text-sm text-foreground truncate w-full">{displayName}</div>
                    <div className="text-xs text-muted-foreground">
                      Status: {tender.status}
                    </div>
                    {selectionType === 'tender' && selectedTender?.id === tender.id && (
                      <div className="text-xs text-primary font-medium">• Currently Selected</div>
                    )}
                  </div>
                </DropdownMenuItem>
              );
            })}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};