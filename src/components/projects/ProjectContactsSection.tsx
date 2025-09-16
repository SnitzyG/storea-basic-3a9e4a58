import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useProjectTeam, TeamMember } from '@/hooks/useProjectTeam';
import { Users, UserPlus, MessageSquare, X } from 'lucide-react';
import { cn } from '@/lib/utils';


interface ProjectContactsSectionProps {
  projectId: string;
  isEditing?: boolean;
  onUserRemove?: (userId: string) => void;
  onUserAdd?: () => void;
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

export const ProjectContactsSection = ({ 
  projectId, 
  isEditing = false, 
  onUserRemove, 
  onUserAdd 
}: ProjectContactsSectionProps) => {
  const { teamMembers, loading, error } = useProjectTeam(projectId);
  const navigate = useNavigate();
  const [removeUserId, setRemoveUserId] = useState<string | null>(null);

  const handleContactUser = (user: TeamMember) => {
    // Store user and project IDs in session storage for messages
    sessionStorage.setItem('selectedUserId', user.user_id);
    sessionStorage.setItem('selectedProjectId', projectId);
    navigate('/messages');
  };

  const handleRemoveUser = async (userId: string) => {
    if (onUserRemove) {
      await onUserRemove(userId);
      setRemoveUserId(null);
    }
  };

  // Group users by role for better organization
  const usersByRole = teamMembers.reduce((acc, user) => {
    const role = user.role || 'other';
    if (!acc[role]) acc[role] = [];
    acc[role].push(user);
    return acc;
  }, {} as Record<string, TeamMember[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">Loading team members...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-destructive">Error loading team members: {error}</div>
      </div>
    );
  }

  if (teamMembers.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No team members yet</h3>
        <p className="text-muted-foreground mb-4">
          Start building your project team by adding members.
        </p>
        {isEditing && onUserAdd && (
          <Button onClick={onUserAdd} size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Add First Member
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Member Button */}
      {isEditing && onUserAdd && (
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Team Members ({teamMembers.length})</h3>
          <Button onClick={onUserAdd} size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        </div>
      )}

      {/* Team Members by Role */}
      {Object.entries(usersByRole).map(([role, users]) => (
        <div key={role} className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {role.charAt(0).toUpperCase() + role.slice(1)}s ({users.length})
          </h4>
          
          <div className="space-y-2">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar_url} alt={user.name} />
                    <AvatarFallback>
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user.name}
                      </p>
                      {user.isOnline && (
                        <div className="flex items-center space-x-1">
                          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                          <span className="text-xs text-muted-foreground">Online</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "text-xs",
                          roleColors[user.role as keyof typeof roleColors] || "bg-gray-100 text-gray-800"
                        )}
                      >
                        {roleLabels[user.role as keyof typeof roleLabels] || user.role}
                      </Badge>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    {user.user_profile?.phone && (
                      <p className="text-xs text-muted-foreground mt-1">
                        📞 {user.user_profile.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Contact Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleContactUser(user)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Contact via platform
                  </Button>

                  {/* Remove Button (only in editing mode and for non-architects) */}
                  {isEditing && onUserRemove && user.role !== 'architect' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRemoveUserId(user.user_id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={!!removeUserId} onOpenChange={() => setRemoveUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this team member from the project? 
              They will lose access to all project data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeUserId && handleRemoveUser(removeUserId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};