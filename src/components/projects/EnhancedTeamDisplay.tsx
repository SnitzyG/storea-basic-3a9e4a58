import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Calendar, 
  Mail, 
  MessageCircle, 
  MoreVertical,
  UserCheck,
  UserX,
  Shield
} from 'lucide-react';
import { useProjectTeam } from '@/hooks/useProjectTeam';
import { formatDistanceToNow, format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface EnhancedTeamDisplayProps {
  projectId: string;
  isEditing?: boolean;
  onRemoveMember?: (memberId: string) => void;
  className?: string;
}

export const EnhancedTeamDisplay: React.FC<EnhancedTeamDisplayProps> = ({
  projectId,
  isEditing = false,
  onRemoveMember,
  className
}) => {
  const { teamMembers, loading, removeMember } = useProjectTeam(projectId);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    const colors = {
      architect: 'bg-purple-100 text-purple-800',
      contractor: 'bg-blue-100 text-blue-800',
      homeowner: 'bg-green-100 text-green-800',
      subcontractor: 'bg-orange-100 text-orange-800',
      consultant: 'bg-cyan-100 text-cyan-800',
      project_manager: 'bg-indigo-100 text-indigo-800'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      architect: 'Architect',
      contractor: 'Contractor', 
      homeowner: 'Homeowner',
      subcontractor: 'Subcontractor',
      consultant: 'Consultant',
      project_manager: 'Project Manager'
    };
    return labels[role as keyof typeof labels] || role;
  };

  const getOnlineStatus = (lastSeen?: string, onlineStatus?: boolean) => {
    if (onlineStatus) return 'Online';
    if (!lastSeen) return 'Unknown';
    
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffInHours = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'Recently active';
    if (diffInHours < 24) return 'Today';
    return formatDistanceToNow(lastSeenDate, { addSuffix: true });
  };

  const handleRemoveMember = async (memberId: string) => {
    if (onRemoveMember) {
      onRemoveMember(memberId);
    } else {
      await removeMember(memberId);
    }
  };

  const handleContactMember = (memberEmail: string) => {
    // Navigate to messages page with the member
    window.location.href = `/messages?contact=${encodeURIComponent(memberEmail)}`;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-sm text-muted-foreground">Loading team members...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const groupedMembers = teamMembers.reduce((acc, member) => {
    const role = member.role || 'other';
    if (!acc[role]) acc[role] = [];
    acc[role].push(member);
    return acc;
  }, {} as Record<string, typeof teamMembers>);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Members ({teamMembers.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(groupedMembers).map(([role, members], roleIndex) => (
          <div key={role}>
            {roleIndex > 0 && <Separator className="my-4" />}
            
            <div className="mb-3">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {getRoleLabel(role)} ({members.length})
              </h4>
            </div>
            
            <div className="space-y-3">
              {members.map((member) => (
                <div 
                  key={member.id} 
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1">
                    {/* Avatar and Status */}
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={member.avatar_url} />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {getInitials(member.name || member.email || 'U')}
                        </AvatarFallback>
                      </Avatar>
                      {/* Online status dot */}
                      <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background ${
                        member.online_status ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                    </div>
                    
                    {/* Member Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-medium text-sm truncate">
                          {member.name || member.email}
                        </h5>
                        <Badge className={getRoleColor(member.role)}>
                          {getRoleLabel(member.role)}
                        </Badge>
                      </div>
                      
                      {member.email && member.name && (
                        <p className="text-xs text-muted-foreground truncate mb-1">
                          {member.email}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <UserCheck className="h-3 w-3" />
                          {getOnlineStatus(member.last_seen, member.online_status)}
                        </span>
                        
                        {(member as any).joined_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Joined {format(new Date((member as any).joined_at), 'dd/MM/yyyy')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleContactMember(member.email)}
                      className="text-xs"
                    >
                      <MessageCircle className="h-3 w-3 mr-1" />
                      Contact
                    </Button>
                    
                    {isEditing && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => handleContactMember(member.email)}
                            className="flex items-center gap-2"
                          >
                            <Mail className="h-4 w-4" />
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleRemoveMember(member.id)}
                            className="flex items-center gap-2 text-red-600"
                          >
                            <UserX className="h-4 w-4" />
                            Remove from Project
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {teamMembers.length === 0 && (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No team members</h3>
            <p className="text-muted-foreground">
              Team members will appear here once they join the project.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};