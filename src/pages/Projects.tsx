import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog';
import { ProjectDetailsDialog } from '@/components/projects/ProjectDetailsDialog';
import { ProjectDetailView } from '@/components/projects/ProjectDetailView';
import { useProjects, Project } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { Search, Grid, List, Plus, Filter } from 'lucide-react';
const Projects = () => {
  const {
    projects,
    loading,
    deleteProject
  } = useProjects();
  const {
    profile
  } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [detailsMode, setDetailsMode] = useState<'view' | 'edit'>('view');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [showDetailView, setShowDetailView] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    project: Project | null;
  }>({
    open: false,
    project: null
  });
  const isArchitect = profile?.role === 'architect';

  // Filter projects based on search and status
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) || project.address?.toLowerCase().includes(searchQuery.toLowerCase()) || project.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const handleView = (project: Project) => {
    setSelectedProject(project);
    setShowDetailView(true);
  };
  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setDetailsMode('edit');
    setDetailsOpen(true);
  };
  const handleDelete = (project: Project) => {
    setDeleteDialog({
      open: true,
      project
    });
  };
  const confirmDelete = async () => {
    if (deleteDialog.project) {
      await deleteProject(deleteDialog.project.id);
      setDeleteDialog({
        open: false,
        project: null
      });
    }
  };
  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-lg">Loading projects...</div>
        </div>
      </div>;
  }

  // Show detailed project view
  if (showDetailView && selectedProject) {
    return (
      <div className="relative">
        <Button 
          variant="outline" 
          onClick={() => setShowDetailView(false)}
          className="mb-4"
        >
          ← Back to Projects
        </Button>
        <ProjectDetailView project={selectedProject} />
      </div>
    );
  }
  return <div className="max-w-7xl space-y-6 mx-[25px]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Projects</h1>
            <p className="text-muted-foreground">
              Manage your construction projects and track their progress
            </p>
          </div>
          {isArchitect && <CreateProjectDialog>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </CreateProjectDialog>}
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-1 gap-4 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search projects..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('grid')}>
              <Grid className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}>
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Projects Grid/List */}
        {filteredProjects.length === 0 ? <div className="text-center py-12">
            {projects.length === 0 ? <div className="space-y-4">
                <h3 className="text-lg font-medium">No projects yet</h3>
                <p className="text-muted-foreground">
                  {isArchitect ? "Create your first project to get started with project management." : "You haven't been assigned to any projects yet."}
                </p>
                {isArchitect && <CreateProjectDialog>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Project
                    </Button>
                  </CreateProjectDialog>}
              </div> : <div className="space-y-4">
                <h3 className="text-lg font-medium">No projects match your search</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search terms or filters to find what you're looking for.
                </p>
              </div>}
          </div> : <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {filteredProjects.map(project => <ProjectCard key={project.id} project={project} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} />)}
          </div>}

        {/* Project Details Dialog */}
        <ProjectDetailsDialog project={selectedProject} open={detailsOpen} onOpenChange={setDetailsOpen} mode={detailsMode} onModeChange={setDetailsMode} />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialog.open} onOpenChange={open => setDeleteDialog({
      open,
      project: null
    })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Project</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deleteDialog.project?.name}"? This action cannot be undone and will remove all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete Project
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>;
};
export default Projects;