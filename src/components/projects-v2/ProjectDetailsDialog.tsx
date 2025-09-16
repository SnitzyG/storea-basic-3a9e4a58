import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  MapPin, 
  Calendar, 
  DollarSign, 
  Users, 
  Building, 
  Clock,
  Trash2,
  Plus,
  UserMinus,
  Settings
} from 'lucide-react';
import { AdvancedProject } from '@/hooks/useAdvancedProjects';
import { ProjectTeamManagement } from './ProjectTeamManagement';
import { useAuth } from '@/hooks/useAuth';

interface ProjectDetailsDialogProps {
  project: AdvancedProject | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (projectId: string) => void;
}

export const ProjectDetailsDialog = ({
  project,
  open,
  onOpenChange,
  onDelete
}: ProjectDetailsDialogProps) => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const isArchitect = profile?.role === 'architect';

  if (!project) return null;

  const statusColors = {
    planning: 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    on_hold: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  const handleDeleteProject = () => {
    if (onDelete) {
      onDelete(project.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">{project.name}</DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={statusColors[project.status]}>
                  {project.status.replace('_', ' ')}
                </Badge>
                {project.project_type && (
                  <Badge variant="outline">
                    {project.project_type.replace('_', ' ')}
                  </Badge>
                )}
                {project.priority && (
                  <Badge variant={project.priority === 'high' ? 'destructive' : 'secondary'}>
                    {project.priority} priority
                  </Badge>
                )}
              </div>
            </div>
            {isArchitect && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Project
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Project</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{project.name}"? This action cannot be undone and will remove all project data, documents, messages, and team assignments.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDeleteProject}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Project
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="flex-shrink-0">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="team">Team Members</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Project Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {project.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">Address</div>
                          <div className="text-sm text-muted-foreground">{project.address}</div>
                        </div>
                      </div>
                    )}
                    
                    {project.description && (
                      <div>
                        <div className="text-sm font-medium mb-1">Description</div>
                        <div className="text-sm text-muted-foreground">{project.description}</div>
                      </div>
                    )}

                    {project.square_footage && (
                      <div>
                        <div className="text-sm font-medium">Square Footage</div>
                        <div className="text-sm text-muted-foreground">{project.square_footage.toLocaleString()} sq ft</div>
                      </div>
                    )}

                    {project.number_of_floors && (
                      <div>
                        <div className="text-sm font-medium">Number of Floors</div>
                        <div className="text-sm text-muted-foreground">{project.number_of_floors}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {project.estimated_start_date && (
                      <div>
                        <div className="text-sm font-medium">Start Date</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(project.estimated_start_date).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                    
                    {project.estimated_finish_date && (
                      <div>
                        <div className="text-sm font-medium">Finish Date</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(project.estimated_finish_date).toLocaleDateString()}
                        </div>
                      </div>
                    )}

                    {project.completion_percentage !== undefined && (
                      <div>
                        <div className="text-sm font-medium">Progress</div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-secondary rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all" 
                              style={{ width: `${project.completion_percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">{project.completion_percentage}%</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Budget */}
                {project.budget && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Budget
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">${project.budget.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Total project budget</div>
                    </CardContent>
                  </Card>
                )}

                {/* Homeowner Information */}
                {(project.homeowner_name || project.homeowner_email || project.homeowner_phone) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Homeowner Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {project.homeowner_name && (
                        <div>
                          <div className="text-sm font-medium">Name</div>
                          <div className="text-sm text-muted-foreground">{project.homeowner_name}</div>
                        </div>
                      )}
                      {project.homeowner_email && (
                        <div>
                          <div className="text-sm font-medium">Email</div>
                          <div className="text-sm text-muted-foreground">{project.homeowner_email}</div>
                        </div>
                      )}
                      {project.homeowner_phone && (
                        <div>
                          <div className="text-sm font-medium">Phone</div>
                          <div className="text-sm text-muted-foreground">{project.homeowner_phone}</div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="team">
              <ProjectTeamManagement projectId={project.id} projectName={project.name} />
            </TabsContent>

            <TabsContent value="timeline" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4" />
                    <div>Timeline management coming soon</div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="budget" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Budget Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-4" />
                    <div>Budget tracking coming soon</div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};