import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { MapPin, Calendar, DollarSign, Users, Building, Clock, Trash2, Circle } from 'lucide-react';
import { AdvancedProject } from '@/hooks/useAdvancedProjects';
import { useProjectTeam } from '@/hooks/useProjectTeam';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  const isArchitect = profile?.role === 'architect';
  
  if (!project) return null;

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

        <div className="flex-1 overflow-y-auto space-y-6">
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

          {/* Team Members Section - Merged into Overview */}
          <TeamMembersSection projectId={project.id} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Team Members Section Component
const TeamMembersSection = ({ projectId }: { projectId: string }) => {
  const { teamMembers, loading } = useProjectTeam(projectId);

  const roleColors = {
    architect: 'bg-primary/10 text-primary',
    builder: 'bg-blue-500/10 text-blue-600',
    homeowner: 'bg-purple-500/10 text-purple-600',
    contractor: 'bg-orange-500/10 text-orange-600',
    project_manager: 'bg-green-500/10 text-green-600',
    consultant: 'bg-indigo-500/10 text-indigo-600'
  };

  const roleLabels = {
    architect: 'Architect',
    builder: 'Builder', 
    homeowner: 'Homeowner',
    contractor: 'Contractor',
    project_manager: 'Project Manager',
    consultant: 'Consultant'
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
            <div>Loading team members...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Members ({teamMembers.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {teamMembers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4" />
            <div>No team members yet</div>
          </div>
        ) : (
          <div className="space-y-4">
            {teamMembers.slice(0, 6).map((member) => {
              const isPending = member.id.startsWith('invitation-');
              
              return (
                <div 
                  key={member.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    {!isPending && (
                      <div className={`absolute -bottom-1 -right-1 h-3 w-3 border-2 border-background rounded-full ${
                        member.isOnline ? 'bg-green-500' : 'bg-gray-400'
                      }`}></div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{member.name}</span>
                      <Badge 
                        variant="secondary" 
                        className={roleColors[(member.user_profile?.role || member.role) as keyof typeof roleColors]}
                      >
                        {roleLabels[(member.user_profile?.role || member.role) as keyof typeof roleLabels] || (member.user_profile?.role || member.role)}
                      </Badge>
                      {isPending && (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                          Pending
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                      {!isPending && (
                        <div className="flex items-center gap-1">
                          <Circle className={`h-2 w-2 ${member.isOnline ? 'fill-green-500 text-green-500' : 'fill-gray-400 text-gray-400'}`} />
                          <span>{member.isOnline ? 'Online' : 'Offline'}</span>
                        </div>
                      )}
                      
                      {member.added_at && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {isPending ? 'Invited' : 'Joined'} {new Date(member.added_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {teamMembers.length > 6 && (
              <div className="text-center pt-2">
                <span className="text-sm text-muted-foreground">
                  +{teamMembers.length - 6} more members
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};