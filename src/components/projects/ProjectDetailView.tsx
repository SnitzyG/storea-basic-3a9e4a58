import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProjectTeam, TeamMember } from '@/hooks/useProjectTeam';
import { AddUserDialog } from './AddUserDialog';
import { ProjectTeamList } from './ProjectTeamList';
import { 
  Users, 
  UserPlus, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Building, 
  Clock,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  address?: string;
  description?: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  budget?: number;
  created_at: string;
}

interface ProjectDetailViewProps {
  project: Project;
}

const statusColors = {
  planning: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  on_hold: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800'
};

const statusLabels = {
  planning: 'Planning',
  active: 'Active',
  on_hold: 'On Hold',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

export const ProjectDetailView = ({ project }: ProjectDetailViewProps) => {
  const [addUserOpen, setAddUserOpen] = useState(false);
  const { teamMembers, loading: teamLoading, refreshTeam } = useProjectTeam(project.id);

  const handleUserAdded = () => {
    refreshTeam();
  };

  // Group team members by role for display
  const groupedMembers = teamMembers.reduce((acc, member) => {
    const role = member.role;
    if (!acc[role]) {
      acc[role] = [];
    }
    acc[role].push(member);
    return acc;
  }, {} as Record<string, TeamMember[]>);

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-6">
      {/* Project Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {project.address || 'No address specified'}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Created {new Date(project.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
        <Badge className={statusColors[project.status]}>
          {statusLabels[project.status]}
        </Badge>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold text-foreground">
                  {teamLoading ? 'Loading...' : 
                   teamMembers.length === 0 ? 'No members added' : 
                   `${teamMembers.length} Team Members`}
                </div>
                <div className="text-sm text-muted-foreground">
                  {teamMembers.length === 0 ? 'Add team members to get started' : 'All stakeholders engaged'}
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setAddUserOpen(true)}
                className="ml-auto"
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="font-semibold text-foreground">On Track</div>
                <div className="text-sm text-muted-foreground">Project progressing well</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-foreground">Recent Activity</div>
                <div className="text-sm text-muted-foreground">Updated 2 hours ago</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members Grid - Only show when there are members */}
      {teamMembers.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Members ({teamMembers.length})
                </CardTitle>
              </div>
              <Button variant="outline" size="sm" onClick={() => setAddUserOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(groupedMembers).map(([role, members]) => (
                <div key={role} className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    {role.replace('_', ' ')} ({members.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.user_profile?.avatar_url} />
                          <AvatarFallback>
                            {member.user_profile?.name
                              .split(' ')
                              .map(n => n[0])
                              .join('')
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate">{member.user_profile?.name}</p>
                            {member.isOnline && (
                              <div className="h-2 w-2 bg-green-500 rounded-full flex-shrink-0"></div>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            Role: {member.role}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Since {new Date(member.joined_at || '').toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs for detailed views */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="team">
            Team & Contacts ({teamMembers.length})
          </TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="rfis">RFIs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.budget && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">${project.budget.toLocaleString()}</span>
                  </div>
                )}
                {project.description && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Description</p>
                    <p className="text-sm text-muted-foreground">{project.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{teamMembers.length}</div>
                    <div className="text-sm text-muted-foreground">Team Members</div>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">
                      {new Date().getDate() - new Date(project.created_at).getDate()}
                    </div>
                    <div className="text-sm text-muted-foreground">Days Active</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="team">
          <ProjectTeamList 
            projectId={project.id} 
            isEditing={true}
            onUserAdd={() => setAddUserOpen(true)}
          />
        </TabsContent>
        
        <TabsContent value="documents">
          <Card>
            <CardContent className="p-6 text-center">
              <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Documents</h3>
              <p className="text-muted-foreground">Document management coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="rfis">
          <Card>
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">RFIs</h3>
              <p className="text-muted-foreground">RFI management coming soon</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AddUserDialog
        open={addUserOpen}
        onOpenChange={setAddUserOpen}
        projectId={project.id}
        onUserAdded={handleUserAdded}
      />
    </div>
  );
};