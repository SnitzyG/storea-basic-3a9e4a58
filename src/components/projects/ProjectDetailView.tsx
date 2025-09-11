import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { AddTeamMemberDialog } from './AddTeamMemberDialog';
import { useProjectTeam } from '@/hooks/useProjectTeam';
import { Project } from '@/hooks/useProjects';
import { Users, UserPlus, Calendar, DollarSign, MapPin, FileText, Trash2, Mail } from 'lucide-react';
import { format } from 'date-fns';

interface ProjectDetailViewProps {
  project: Project;
}

const roleColors: Record<string, string> = {
  architect: 'bg-blue-100 text-blue-800',
  builder: 'bg-orange-100 text-orange-800',
  contractor: 'bg-green-100 text-green-800',
  client: 'bg-purple-100 text-purple-800',
  consultant: 'bg-indigo-100 text-indigo-800',
  project_manager: 'bg-red-100 text-red-800'
};

const roleLabels: Record<string, string> = {
  architect: 'Architect',
  builder: 'Builder',
  contractor: 'Contractor',
  client: 'Client',
  consultant: 'Consultant',
  project_manager: 'Project Manager'
};

export function ProjectDetailView({ project }: ProjectDetailViewProps) {
  const { teamMembers, loading, count, addMember, removeMember } = useProjectTeam(project.id);
  const [addMemberOpen, setAddMemberOpen] = useState(false);

  const getInitials = (name: string, email: string) => {
    if (name && name !== 'Unknown') {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.split('@')[0].slice(0, 2).toUpperCase();
  };

  // Group members by role
  const groupedMembers = teamMembers.reduce((acc, member) => {
    const role = member.role;
    if (!acc[role]) {
      acc[role] = [];
    }
    acc[role].push(member);
    return acc;
  }, {} as Record<string, typeof teamMembers>);

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
        {project.description && (
          <p className="text-muted-foreground">{project.description}</p>
        )}
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold text-foreground">
                  {loading ? (
                    <Skeleton className="h-5 w-20" />
                  ) : count === 0 ? (
                    'No Members'
                  ) : (
                    `${count} Team Member${count > 1 ? 's' : ''}`
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {count > 0 ? 'Active team collaborating' : 'Add team members'}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={() => setAddMemberOpen(true)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="font-semibold text-foreground capitalize">{project.status}</div>
                <div className="text-sm text-muted-foreground">Current status</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {project.budget && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <DollarSign className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">
                    ${project.budget.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Budget</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {project.address && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <MapPin className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">Location</div>
                  <div className="text-sm text-muted-foreground">{project.address}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Team Members Section */}
      {(count > 0 || loading) && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members
              {!loading && <Badge variant="secondary">{count}</Badge>}
            </CardTitle>
            <Button onClick={() => setAddMemberOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                          <Skeleton className="h-3 w-28" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedMembers).map(([role, members]) => (
                  <div key={role}>
                    <h3 className="text-lg font-semibold mb-3 capitalize">
                      {roleLabels[role] || role} ({members.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {members.map((member) => (
                        <Card key={member.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start space-x-3">
                              <Avatar>
                                <AvatarImage src={member.avatar_url} />
                                <AvatarFallback>
                                  {getInitials(member.name, member.email)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{member.name}</div>
                                <Badge 
                                  className={`text-xs ${roleColors[member.role] || 'bg-gray-100 text-gray-800'}`}
                                >
                                  {roleLabels[member.role] || member.role}
                                </Badge>
                                <div className="text-sm text-muted-foreground truncate mt-1">
                                  {member.email}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Member since {format(new Date(member.added_at), 'MMM d, yyyy')}
                                </div>
                                <div className="flex gap-2 mt-3">
                                  <Button size="sm" variant="outline">
                                    <Mail className="h-3 w-3 mr-1" />
                                    Contact
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => removeMember(member.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && count === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No team members yet</h3>
            <p className="text-muted-foreground mb-4">
              Add your first team member to start collaborating on this project.
            </p>
            <Button onClick={() => setAddMemberOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Your First Team Member
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add Member Dialog */}
      <AddTeamMemberDialog
        projectId={project.id}
        projectName={project.name}
        open={addMemberOpen}
        onOpenChange={setAddMemberOpen}
        onMemberAdded={addMember}
      />
    </div>
  );
}