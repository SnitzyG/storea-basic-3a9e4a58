import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, Grid, List, Calendar, Plus, BarChart3, TrendingUp, Clock, MapPin, DollarSign, Users, Eye, Edit, Archive, Copy, Hash, UserPlus } from 'lucide-react';
import { useAdvancedProjects, AdvancedProject } from '@/hooks/useAdvancedProjects';
import { AdvancedProjectWizard } from '@/components/projects-v2/AdvancedProjectWizard';
import { ProjectDetailsDialog } from '@/components/projects-v2/ProjectDetailsDialog';
import { ProjectJoinSection } from '@/components/projects/ProjectJoinSection';
import { useAuth } from '@/hooks/useAuth';
const AdvancedProjects = () => {
  const {
    projects,
    loading,
    searchQuery,
    setSearchQuery,
    filters,
    updateFilters,
    getProjectsByStatus,
    getOverdueProjects,
    getProjectHealth,
    archiveProject,
    cloneProject,
    deleteProject
  } = useAdvancedProjects();
  const {
    profile
  } = useAuth();
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'calendar'>('grid');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<AdvancedProject | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [projectToView, setProjectToView] = useState<AdvancedProject | null>(null);
  const isArchitect = profile?.role === 'architect';
  const statusStats = getProjectsByStatus();
  const overdueProjects = getOverdueProjects();
  const statusColors = {
    planning: 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    on_hold: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800'
  };
  const handleProjectAction = async (action: string, project: AdvancedProject) => {
    switch (action) {
      case 'view':
        setProjectToView(project);
        setDetailsDialogOpen(true);
        break;
      case 'edit':
        setSelectedProject(project);
        setWizardOpen(true);
        break;
      case 'archive':
        await archiveProject(project.id);
        break;
      case 'clone':
        await cloneProject(project.id, `${project.name} (Copy)`);
        break;
    }
  };
  const handleDeleteProject = async (projectId: string) => {
    await deleteProject(projectId);
  };
  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-lg">Loading advanced projects...</div>
        </div>
      </div>;
  }
  return <div className="max-w-7xl space-y-6 mx-[25px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Project Management</h1>
          <p className="text-muted-foreground">
            Advanced construction project management and collaboration
          </p>
        </div>
        {isArchitect && <Button onClick={() => setWizardOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            My Projects
          </TabsTrigger>
          <TabsTrigger value="join" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Join Projects
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-6">
          {/* Projects Content */}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        

        

        

        
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-4 items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search projects..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
          
          <Select value={filters.status} onValueChange={value => updateFilters({
              status: value
            })}>
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

          {/* Projects Display */}
          {projects.length === 0 ? <Card>
              <CardContent className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No projects found</h3>
                <p className="text-muted-foreground mb-4">
                  {isArchitect ? "Create your first project to get started." : "You haven't been assigned to any projects yet."}
                </p>
                {isArchitect && <Button onClick={() => setWizardOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Project
                  </Button>}
              </CardContent>
            </Card> : <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
              {projects.map(project => <Card key={project.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {project.address || 'No address specified'}
                        </div>
                        {/* Display Project ID */}
                        {(project as any).project_id && <div className="flex items-center gap-1 text-xs text-primary font-mono bg-primary/10 px-2 py-1 rounded">
                            <Hash className="h-3 w-3" />
                            ID: {(project as any).project_id}
                          </div>}
                      </div>
                      <Badge className={statusColors[project.status]}>
                        {project.status.replace('_', ' ')}
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
                        <Clock className="h-3 w-3" />
                        Health: {getProjectHealth(project)}%
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" onClick={() => handleProjectAction('view', project)}>
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      {isArchitect && <>
                          <Button variant="outline" size="sm" onClick={() => handleProjectAction('edit', project)}>
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleProjectAction('clone', project)}>
                            <Copy className="h-3 w-3 mr-1" />
                            Clone
                          </Button>
                        </>}
                    </div>
                  </CardContent>
                </Card>)}
            </div>}
        </TabsContent>

        <TabsContent value="join" className="space-y-6">
          <ProjectJoinSection />
        </TabsContent>
      </Tabs>

      {/* Project Wizard */}
      <AdvancedProjectWizard open={wizardOpen} onOpenChange={open => {
      setWizardOpen(open);
      if (!open) setSelectedProject(null);
    }} projectToEdit={selectedProject} />

      {/* Project Details Dialog */}
      <ProjectDetailsDialog project={projectToView} open={detailsDialogOpen} onOpenChange={open => {
      setDetailsDialogOpen(open);
      if (!open) setProjectToView(null);
    }} onDelete={handleDeleteProject} />
    </div>;
};
export default AdvancedProjects;