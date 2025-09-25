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
import { useAuth } from '@/hooks/useAuth';

const ArchitecturalStageSelector = ({
  project,
  onStageChange
}: {
  project: AdvancedProject;
  onStageChange: (stage: string) => void;
}) => {
  const stageOptions = [
    { value: 'Concept', label: 'Concept' },
    { value: 'Schematic Design', label: 'Schematic Design' },
    { value: 'Design Development', label: 'Design Development' },
    { value: 'Tender', label: 'Tender' },
    { value: 'Construction Documentation', label: 'Construction Documentation' },
    { value: 'Contract Admin', label: 'Contract Admin' },
    { value: 'Site Services', label: 'Site Services' }
  ];

  const stageColors = {
    'Concept': 'bg-purple-100 text-purple-800',
    'Schematic Design': 'bg-blue-100 text-blue-800',
    'Design Development': 'bg-indigo-100 text-indigo-800',
    'Tender': 'bg-orange-100 text-orange-800',
    'Construction Documentation': 'bg-green-100 text-green-800',
    'Contract Admin': 'bg-yellow-100 text-yellow-800',
    'Site Services': 'bg-gray-100 text-gray-800'
  };

  return (
    <Select value={project.architectural_stage || 'Concept'} onValueChange={onStageChange}>
      <SelectTrigger className="w-auto min-w-[140px]">
        <SelectValue>
          <Badge className={stageColors[project.architectural_stage as keyof typeof stageColors] || stageColors['Concept']}>
            {(project.architectural_stage || 'Concept').toUpperCase()}
          </Badge>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {stageOptions.map(option => (
          <SelectItem key={option.value} value={option.value}>
            <Badge className={stageColors[option.value as keyof typeof stageColors]}>
              {option.label.toUpperCase()}
            </Badge>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

const StatusSelector = ({
  project,
  onStatusChange
}: {
  project: AdvancedProject;
  onStatusChange: (status: 'active' | 'on_hold' | 'completed' | 'cancelled') => void;
}) => {
  const statusOptions = [{
    value: 'active',
    label: 'Active'
  }, {
    value: 'on_hold',
    label: 'On Hold'
  }, {
    value: 'completed',
    label: 'Completed'
  }, {
    value: 'cancelled',
    label: 'Cancelled'
  }];

  const statusColors = {
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
        {statusOptions.map(option => (
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
  const { profile } = useAuth();
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

  const handleStatusChange = async (projectId: string, newStatus: 'active' | 'on_hold' | 'completed' | 'cancelled') => {
    try {
      await updateProject(projectId, {
        status: newStatus
      });
    } catch (error) {
      console.error('Error updating project status:', error);
    }
  };

  const handleArchitecturalStageChange = async (projectId: string, newStage: string) => {
    try {
      await updateProject(projectId, {
        architectural_stage: newStage
      });
    } catch (error) {
      console.error('Error updating architectural stage:', error);
    }
  };

  const handleUpdateBudget = async (projectId: string, budget: number) => {
    try {
      await updateProject(projectId, {
        budget
      });
    } catch (error) {
      console.error('Error updating project budget:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-lg">Loading advanced projects...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mx-[25px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div></div>
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
            <div className="space-y-4">
              <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-card/50">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-gradient-to-r from-muted/50 to-muted/30 border-b-2 border-primary/10">
                      <TableRow>
                        <TableHead className="text-foreground/80 font-semibold text-sm h-12 px-4">Project Reference</TableHead>
                        <TableHead className="text-foreground/80 font-semibold text-sm h-12 px-4">Project Name</TableHead>
                        <TableHead className="text-foreground/80 font-semibold text-sm h-12 px-4">Project ID</TableHead>
                        <TableHead className="text-foreground/80 font-semibold text-sm h-12 px-4">Address</TableHead>
                        <TableHead className="text-foreground/80 font-semibold text-sm h-12 px-4">Status</TableHead>
                        {isArchitect && (
                          <TableHead className="text-foreground/80 font-semibold text-sm h-12 px-4">Architectural Stage</TableHead>
                        )}
                        <TableHead className="text-foreground/80 font-semibold text-sm h-12 px-4">Budget</TableHead>
                        <TableHead className="text-foreground/80 font-semibold text-sm h-12 px-4">Start Date</TableHead>
                        <TableHead className="text-foreground/80 font-semibold text-sm h-12 px-4">Finish Date</TableHead>
                        <TableHead className="text-foreground/80 font-semibold text-sm h-12 px-4 w-[50px] text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projects.map(project => {
                        console.log('Rendering project:', project.name, 'Reference:', project.project_reference_number);
                        return (
                          <TableRow key={project.id} className="hover:bg-muted/30 transition-all duration-200 cursor-pointer border-b border-muted/20">
                            <TableCell className="text-sm px-4 py-3 text-foreground/90">
                              <span className="font-mono text-xs text-muted-foreground">{project.project_reference_number || '-'}</span>
                            </TableCell>
                            <TableCell className="text-sm px-4 py-3 text-foreground/90">
                              <div className="space-y-1">
                                <p className="font-medium text-sm leading-none text-foreground">{project.name}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm px-4 py-3 text-foreground/90">
                              {(project as any).project_id ? (
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1 text-xs text-primary font-mono bg-primary/10 px-2 py-1 rounded border border-primary/20">
                                    <Hash className="h-3 w-3" />
                                    {(project as any).project_id}
                                  </div>
                                  <Button variant="ghost" size="sm" onClick={() => copyProjectId((project as any).project_id)} className="h-6 w-6 p-0">
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <span className="font-mono text-xs text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-sm px-4 py-3 text-foreground/90">
                              <span className="text-xs text-muted-foreground">{project.address || '-'}</span>
                            </TableCell>
                            <TableCell className="text-sm px-4 py-3 text-foreground/90">
                              <StatusSelector project={project} onStatusChange={newStatus => handleStatusChange(project.id, newStatus)} />
                            </TableCell>
                            {isArchitect && (
                              <TableCell className="text-sm px-4 py-3 text-foreground/90">
                                <ArchitecturalStageSelector 
                                  project={project} 
                                  onStageChange={newStage => handleArchitecturalStageChange(project.id, newStage)} 
                                />
                              </TableCell>
                            )}
                            <TableCell className="text-sm px-4 py-3 text-foreground/90">
                              <span className="text-xs text-muted-foreground">
                                {project.budget ? `$${project.budget.toLocaleString()}` : '-'}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm px-4 py-3 text-foreground/90">
                              <span className="text-xs text-muted-foreground">
                                {project.estimated_start_date ? new Date(project.estimated_start_date).toLocaleDateString() : '-'}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm px-4 py-3 text-foreground/90">
                              <span className="text-xs text-muted-foreground">
                                {project.estimated_finish_date ? new Date(project.estimated_finish_date).toLocaleDateString() : '-'}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm px-4 py-3 text-foreground/90 w-[50px] text-center">
                              <div className="flex gap-1 justify-center">
                                <Button variant="outline" size="sm" onClick={() => handleProjectAction('view', project)}>
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
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
          onOpenChange={open => {
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
    </div>
  );
};

export default AdvancedProjects;