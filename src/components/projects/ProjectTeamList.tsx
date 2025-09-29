import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useProjectTeam } from '@/hooks/useProjectTeam';
import { Users, Plus, Trash2, MessageCircle, Clock, Circle } from 'lucide-react';

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  joined_at?: string;
  user_profile: {
    name: string;
    role: string;
    avatar_url?: string;
    phone?: string;
  } | null;
  lastActive?: string;
  isOnline?: boolean;
}

interface ProjectTeamListProps {
  projectId: string;
  isEditing?: boolean;
  onUserAdd?: () => void;
  showAddButton?: boolean;
  showRemoveButton?: boolean;
  showContactButton?: boolean;
}

const roleColors = {
  architect: 'bg-primary/10 text-primary',
  builder: 'bg-construction-success/10 text-construction-success',
  homeowner: 'bg-purple-500/10 text-purple-600',
  contractor: 'bg-construction-warning/10 text-construction-warning'
};

const roleLabels = {
  architect: 'Architect',
  builder: 'Builder', 
  homeowner: 'Homeowner',
  contractor: 'Contractor'
};

export const ProjectTeamList = ({ 
  projectId, 
  isEditing = false,
  onUserAdd,
  showAddButton = true,
  showRemoveButton = true,
  showContactButton = true
}: ProjectTeamListProps) => {
  const { teamMembers, loading, error, removeMember } = useProjectTeam(projectId);
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleContactUser = (userId: string, userName: string) => {
    // Store the target user for direct messaging
    sessionStorage.setItem('targetUserId', userId);
    sessionStorage.setItem('targetUserName', userName);
    sessionStorage.setItem('currentProjectId', projectId);
    
    // Navigate to messages tab
    navigate('/messages');
  };

  const handleRemoveUser = async (userId: string) => {
    const success = await removeMember(userId);
    if (success) {
      toast({
        title: "Team member removed",
        description: "The team member has been removed from the project."
      });
    } else {
      toast({
        title: "Error removing member",
        description: "Failed to remove team member. Please try again.",
        variant: "destructive"
      });
    }
  };

  const groupedUsers = teamMembers.reduce((acc, user) => {
    const role = user.user_profile?.role || user.role;
    if (!acc[role]) {
      acc[role] = [];
    }
    acc[role].push(user);
    return acc;
  }, {} as Record<string, TeamMember[]>);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Project Team
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            Loading team members...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Project Team
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-destructive">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Project Team ({teamMembers.length})
          </CardTitle>
          {isEditing && showAddButton && profile?.role === 'lead_consultant' && (
            <Button size="sm" variant="outline" onClick={onUserAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(groupedUsers).map(([role, users], index) => (
          <div key={role}>
            {index > 0 && <Separator className="my-4" />}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge className={roleColors[role as keyof typeof roleColors]}>
                  {roleLabels[role as keyof typeof roleLabels]}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  ({users.length})
                </span>
              </div>
              
              <div className="space-y-2">
                 {users.map((user) => {
                   if (!user.user_profile) return null;
                   
                   return (
                     <div key={user.id} className="group relative p-4 rounded-lg border bg-card hover:bg-accent/30 transition-colors">
                       <div className="flex items-start justify-between">
                         <div className="flex items-start gap-3 flex-1">
                           <div className="relative">
                             <Avatar className="h-12 w-12">
                               <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                 {user.user_profile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                               </AvatarFallback>
                             </Avatar>
                             {user.isOnline && (
                               <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-construction-success border-2 border-background rounded-full"></div>
                             )}
                           </div>
                           
                           <div className="flex-1 space-y-2">
                             <div className="flex items-center gap-2">
                               <h4 className="font-medium text-foreground">{user.user_profile.name}</h4>
                                <Badge variant="secondary" className={roleColors[user.user_profile?.role as keyof typeof roleColors] || roleColors[user.role as keyof typeof roleColors]}>
                                  {roleLabels[user.user_profile?.role as keyof typeof roleLabels] || roleLabels[user.role as keyof typeof roleLabels]}
                                </Badge>
                             </div>
                             
                             <div className="space-y-1">
                               {showContactButton && (
                                 <div className="flex items-center gap-4 text-sm">
                                   <Button
                                     variant="link"
                                     size="sm"
                                     className="h-auto p-0 text-sm text-primary hover:text-primary/80 font-medium"
                                     onClick={() => handleContactUser(user.user_id, user.user_profile!.name)}
                                   >
                                     <MessageCircle className="h-3 w-3 mr-1" />
                                     Contact via platform
                                   </Button>
                                   {user.user_profile.phone && (
                                     <div className="flex items-center gap-1 text-muted-foreground">
                                       <span className="text-xs">{user.user_profile.phone}</span>
                                     </div>
                                   )}
                                 </div>
                               )}
                               
                               <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                 {user.joined_at && (
                                   <div className="flex items-center gap-1">
                                     <Clock className="h-3 w-3" />
                                     <span>Joined {new Date(user.joined_at).toLocaleDateString()}</span>
                                   </div>
                                 )}
                                 <div className="flex items-center gap-1">
                                   <Circle className={`h-2 w-2 ${user.isOnline ? 'fill-construction-success text-construction-success' : 'fill-muted text-muted'}`} />
                                   <span>{user.isOnline ? 'Online' : 'Offline'}</span>
                                 </div>
                               </div>
                             </div>
                           </div>
                         </div>
                         
                         {isEditing && showRemoveButton && profile?.role === 'lead_consultant' && (user.user_profile?.role || user.role) !== 'lead_consultant' && (
                           <Button
                             size="sm"
                             variant="ghost"
                             onClick={() => handleRemoveUser(user.user_id)}
                             className="text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                           >
                             <Trash2 className="h-4 w-4" />
                           </Button>
                         )}
                       </div>
                     </div>
                   );
                 }).filter(Boolean)}
              </div>
            </div>
          </div>
        ))}
        
        {teamMembers.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            No team members assigned yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
};