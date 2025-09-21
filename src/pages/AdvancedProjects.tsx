import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, BarChart3, Eye, Archive, Hash, UserPlus, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAdvancedProjects, AdvancedProject } from '@/hooks/useAdvancedProjects';
import { AdvancedProjectWizard } from '@/components/projects-v2/AdvancedProjectWizard';
import { ProjectDetailsDialog } from '@/components/projects-v2/ProjectDetailsDialog';
import { ProjectJoinSection } from '@/components/projects/ProjectJoinSection';
import { ProjectGanttChart } from '@/components/projects/ProjectGanttChart';
import { useAuth } from '@/hooks/useAuth';
const StatusSelector = ({ project, onStatusChange }: { 
  project: AdvancedProject, 
  onStatusChange: (status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled') => void 
}) => {
  const statusOptions = [
    { value: 'planning', label: 'Planning' },
    { value: 'active', label: 'Active' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const statusColors = {
    planning: 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    on_hold: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  return (
    <Select value={project.status} onValueChange={onStatusChange}>
      <SelectTrigger className="w-auto min-w-[120px]">
        <SelectValue>
          <Badge className={statusColors[project.status]}>
            {project.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {statusOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <Badge className={statusColors[option.value]}>
              {option.label.toUpperCase()}
            </Badge>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

const AdvancedProjects = () => {
  const {
    projects,
    loading,
    archiveProject,
    cloneProject,
    deleteProject,
    updateProject
  } = useAdvancedProjects();
  const {
    profile
  } = useAuth();
  const { toast } = useToast();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<AdvancedProject | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [projectToView, setProjectToView] = useState<AdvancedProject | null>(null);
  // CRITICAL: Only architects can create projects
  const isArchitect = profile?.role === 'architect';
  const canCreateProjects = isArchitect;
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    on_hold: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800'
  };
  const copyProjectId = async (projectId: string) => {
    try {
      await navigator.clipboard.writeText(projectId);
      toast({
        title: "Project ID copied",
        description: "Project ID has been copied to clipboard"
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the Project ID manually",
        variant: "destructive"
      });
    }
  };

  const handleProjectAction = async (action: string, project: AdvancedProject) => {
    switch (action) {
      case 'view':
        setProjectToView(project);
        setDetailsDialogOpen(true);
        break;
      case 'archive':
        await archiveProject(project.id);
        break;
    }
  };
  const handleDeleteProject = async (projectId: string) => {
    await deleteProject(projectId);
  };

  const handleStatusChange = async (projectId: string, newStatus: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled') => {
    try {
      await updateProject(projectId, { status: newStatus });
    } catch (error) {
      console.error('Error updating project status:', error);
    }
  };

  const handleUpdateBudget = async (projectId: string, budget: number) => {
    try {
      await updateProject(projectId, { budget });
    } catch (error) {
      console.error('Error updating project budget:', error);
    }
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
        {canCreateProjects && (
          <Button onClick={() => setWizardOpen(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        )}
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
          {/* Projects List View */}
          {projects.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No projects found</h3>
                <p className="text-muted-foreground mb-4">
                  {canCreateProjects ? "Create your first project to get started." : "You haven't been assigned to any projects yet. Contact your architect to be added to a project."}
                </p>
                {canCreateProjects && (
                  <Button onClick={() => setWizardOpen(true)} className="bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Project
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project Reference</TableHead>
                        <TableHead>Project Name</TableHead>
                        <TableHead>Project ID</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Budget</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>Finish Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                  <TableBody>
                    {projects.map((project) => {
                      console.log('Rendering project:', project.name, 'Reference:', project.project_reference_number);
                      return (
                      <TableRow key={project.id}>
                        <TableCell>{project.project_reference_number || '-'}</TableCell>
                        <TableCell className="font-medium">{project.name}</TableCell>
                        <TableCell>
                          {(project as any).project_id ? (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1 text-xs text-primary font-mono bg-primary/10 px-2 py-1 rounded">
                                <Hash className="h-3 w-3" />
                                {(project as any).project_id}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyProjectId((project as any).project_id)}
                                className="h-6 w-6 p-0"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>{project.address || '-'}</TableCell>
                        <TableCell>
                          <StatusSelector 
                            project={project} 
                            onStatusChange={(newStatus) => handleStatusChange(project.id, newStatus)} 
                          />
                        </TableCell>
                        <TableCell>
                          {project.budget ? `$${project.budget.toLocaleString()}` : '-'}
                        </TableCell>
                        <TableCell>
                          {project.estimated_start_date 
                            ? new Date(project.estimated_start_date).toLocaleDateString() 
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          {project.estimated_finish_date 
                            ? new Date(project.estimated_finish_date).toLocaleDateString() 
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleProjectAction('view', project)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Gantt Chart Section */}
          {projects.length > 0 && (
            <ProjectGanttChart projects={projects} />
          )}
        </TabsContent>

        <TabsContent value="join" className="space-y-6">
          <ProjectJoinSection />
        </TabsContent>
      </Tabs>

      {/* Project Wizard - Only accessible to architects */}
      {canCreateProjects && (
        <AdvancedProjectWizard 
          open={wizardOpen} 
          onOpenChange={(open) => {
            setWizardOpen(open);
            if (!open) setSelectedProject(null);
          }} 
          projectToEdit={selectedProject} 
        />
      )}

      {/* Project Details Dialog */}
      <ProjectDetailsDialog 
        project={projectToView} 
        open={detailsDialogOpen} 
        onOpenChange={open => {
          setDetailsDialogOpen(open);
          if (!open) setProjectToView(null);
        }} 
        onDelete={handleDeleteProject}
        onUpdateBudget={handleUpdateBudget}
      />
    </div>;
};
export default AdvancedProjects;