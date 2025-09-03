import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Users, Mail, Phone, Plus, Trash2 } from 'lucide-react';

interface ProjectUser {
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
}

interface ProjectContactsSectionProps {
  projectId: string;
  isEditing?: boolean;
  onUserRemove?: (userId: string) => void;
  onUserAdd?: () => void;
}

const roleColors = {
  architect: 'bg-blue-100 text-blue-800',
  builder: 'bg-green-100 text-green-800',
  homeowner: 'bg-purple-100 text-purple-800',
  contractor: 'bg-orange-100 text-orange-800'
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
  const [projectUsers, setProjectUsers] = useState<ProjectUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchProjectUsers = async () => {
      setLoading(true);
      try {
        // First, get project users
        const { data: projectUsersData, error: projectUsersError } = await supabase
          .from('project_users')
          .select('id, user_id, role, joined_at')
          .eq('project_id', projectId);

        if (projectUsersError) {
          console.error('Error fetching project users:', projectUsersError);
          throw projectUsersError;
        }

        if (!projectUsersData || projectUsersData.length === 0) {
          setProjectUsers([]);
          return;
        }

        // Then, get user profiles for these users
        const userIds = projectUsersData.map(user => user.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, name, role, avatar_url, phone')
          .in('user_id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          throw profilesError;
        }

        // Combine the data
        const transformedUsers: ProjectUser[] = projectUsersData.map(user => {
          const profile = profilesData?.find(p => p.user_id === user.user_id);
          return {
            id: user.id,
            user_id: user.user_id,
            role: user.role,
            joined_at: user.joined_at,
            user_profile: profile ? {
              name: profile.name,
              role: profile.role,
              avatar_url: profile.avatar_url || undefined,
              phone: profile.phone || undefined
            } : null
          };
        }).filter(user => user.user_profile !== null);

        console.log('Fetched project users:', transformedUsers);
        setProjectUsers(transformedUsers);
      } catch (error: any) {
        console.error('Error in fetchProjectUsers:', error);
        toast({
          title: "Error fetching team members",
          description: "Failed to load project team. Please try again.",
          variant: "destructive"
        });
        setProjectUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectUsers();
  }, [projectId, toast]);

  const groupedUsers = projectUsers.reduce((acc, user) => {
    const role = user.role;
    if (!acc[role]) {
      acc[role] = [];
    }
    acc[role].push(user);
    return acc;
  }, {} as Record<string, ProjectUser[]>);

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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Project Team ({projectUsers.length})
          </CardTitle>
          {isEditing && profile?.role === 'architect' && (
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
                    <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {user.user_profile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="space-y-1">
                          <div className="font-medium">{user.user_profile.name}</div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              <span>Contact via platform</span>
                            </div>
                            {user.user_profile.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                <span>{user.user_profile.phone}</span>
                              </div>
                            )}
                          </div>
                          {user.joined_at && (
                            <div className="text-xs text-muted-foreground">
                              Joined {new Date(user.joined_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {isEditing && profile?.role === 'architect' && user.role !== 'architect' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onUserRemove?.(user.user_id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  );
                }).filter(Boolean)}
              </div>
            </div>
          </div>
        ))}
        
        {projectUsers.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            No team members assigned yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
};