import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Users, 
  Plus, 
  UserMinus, 
  Mail, 
  Clock, 
  CheckCircle,
  Circle
} from 'lucide-react';
import { useProjectTeam } from '@/hooks/useProjectTeam';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ProjectInviteLink } from './ProjectInviteLink';

interface ProjectTeamManagementProps {
  projectId: string;
  projectName: string;
}

export const ProjectTeamManagement = ({ projectId, projectName }: ProjectTeamManagementProps) => {
  const { teamMembers, loading, addMember, removeMember } = useProjectTeam(projectId);
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('contractor');
  const [isInviting, setIsInviting] = useState(false);

  const isArchitect = profile?.role === 'architect';

  // Memoized role configurations to prevent re-renders
  const roleColors = useMemo(() => ({
    architect: 'bg-primary/10 text-primary',
    builder: 'bg-blue-500/10 text-blue-600',
    homeowner: 'bg-purple-500/10 text-purple-600',
    contractor: 'bg-orange-500/10 text-orange-600',
    project_manager: 'bg-green-500/10 text-green-600',
    consultant: 'bg-indigo-500/10 text-indigo-600'
  }), []);

  const roleLabels = useMemo(() => ({
    architect: 'Architect',
    builder: 'Builder', 
    homeowner: 'Homeowner',
    contractor: 'Contractor',
    project_manager: 'Project Manager',
    consultant: 'Consultant'
  }), []);

  const handleAddMember = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    const email = newMemberEmail.trim();
    
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter an email address to invite a team member.",
        variant: "destructive"
      });
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }

    setIsInviting(true);
    try {
      console.log('Attempting to add member:', { email, role: newMemberRole, projectName });
      const success = await addMember(email, newMemberRole, projectName);
      
      if (success) {
        console.log('Successfully added member');
        setNewMemberEmail('');
        setNewMemberRole('contractor');
        
        // Show success feedback
        toast({
          title: "Invitation sent!",
          description: `Successfully sent invitation to ${email}`,
        });
      } else {
        console.log('Failed to add member');
      }
    } catch (error) {
      console.error('Error in handleAddMember:', error);
      toast({
        title: "Error sending invitation",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    try {
      console.log('Removing member:', { memberId, memberName });
      const success = await removeMember(memberId);
      if (success) {
        toast({
          title: "Member removed",
          description: `${memberName} has been removed from the project.`,
        });
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: "Error removing member",
        description: `Failed to remove ${memberName} from the project.`,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
        <div>Loading team members...</div>
        <div className="text-sm text-muted-foreground mt-2">Fetching team data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team Members List */}
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
              {teamMembers.map((member) => {
                const isPending = member.id.startsWith('invitation-');
                
                return (
                  <div 
                    key={member.id} // Use stable ID to prevent React key issues
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
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
                          
                          {isPending && member.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              <span>{member.email}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {isArchitect && member.user_id !== profile?.user_id && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove {member.name} from this project? 
                              {isPending 
                                ? ' This will cancel their pending invitation.'
                                : ' They will lose access to all project documents and conversations.'
                              }
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleRemoveMember(member.id, member.name)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {isPending ? 'Cancel Invitation' : 'Remove Member'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};