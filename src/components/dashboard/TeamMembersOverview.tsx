import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useTeamSync } from '@/hooks/useTeamSync';
import { useProjects } from '@/hooks/useProjects';
import { Users, UserPlus, Clock, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const TeamMembersOverview = () => {
  const { projects } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    projects.length > 0 ? projects[0].id : null
  );
  
  const { teamMembers, loading } = useTeamSync(selectedProjectId || '');

  if (!selectedProjectId && projects.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No projects available</p>
        </CardContent>
      </Card>
    );
  }

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        
        {projects.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
            {projects.slice(0, 3).map((project) => (
              <Button
                key={project.id}
                variant={selectedProjectId === project.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedProjectId(project.id)}
                className="whitespace-nowrap text-xs"
              >
                {project.name}
              </Button>
            ))}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4 overflow-y-auto max-h-80">
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[120px]" />
                  <Skeleton className="h-3 w-[80px]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && teamMembers.length === 0 && (
          <div className="text-center py-6">
            <UserPlus className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No team members yet</p>
            <p className="text-sm text-muted-foreground">
              Invite team members to start collaborating
            </p>
          </div>
        )}

        {!loading && teamMembers.length > 0 && (
          <div className="space-y-3">
            {teamMembers.slice(0, 6).map((member) => (
              <div key={member.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.user_profile?.avatar_url} alt={member.user_profile?.name || 'Team member'} />
                    <AvatarFallback className="text-xs">
                      {(member.user_profile?.name || 'User')
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)
                      }
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {member.user_profile?.name || 'Team Member'}
                      </p>
                      {member.isOnline && (
                        <div className="h-2 w-2 bg-green-500 rounded-full" title="Online" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-auto">
                        <Shield className="h-3 w-3 mr-1" />
                        {member.role}
                      </Badge>
                      
                      {member.lastActive && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {formatDistanceToNow(new Date(member.lastActive))} ago
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {teamMembers.length > 6 && (
              <div className="pt-2 text-center">
                <Button variant="ghost" size="sm" className="text-xs">
                  View all {teamMembers.length} members
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};