import { useProjectTeam } from '@/hooks/useProjectTeam';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, Circle } from 'lucide-react';

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

interface TeamMemberSelectorProps {
  projectId: string;
  selectedMembers?: string[];
  onSelectionChange?: (selectedUserIds: string[]) => void;
  multiSelect?: boolean;
  showRole?: boolean;
  showOnlineStatus?: boolean;
  excludeCurrentUser?: boolean;
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

export const TeamMemberSelector = ({
  projectId,
  selectedMembers = [],
  onSelectionChange,
  multiSelect = true,
  showRole = true,
  showOnlineStatus = true,
  excludeCurrentUser = false
}: TeamMemberSelectorProps) => {
  const { teamMembers, loading, error } = useProjectTeam(projectId);

  const handleMemberToggle = (userId: string) => {
    if (!onSelectionChange) return;

    if (multiSelect) {
      const newSelection = selectedMembers.includes(userId)
        ? selectedMembers.filter(id => id !== userId)
        : [...selectedMembers, userId];
      onSelectionChange(newSelection);
    } else {
      onSelectionChange([userId]);
    }
  };

  const filteredMembers = teamMembers.filter(member => {
    if (!member.user_profile) return false;
    if (excludeCurrentUser) {
      // TODO: Add current user filtering if needed
    }
    return true;
  });

  if (loading) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <Users className="h-8 w-8 mx-auto mb-2" />
        Loading team members...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4 text-destructive">
        {error}
      </div>
    );
  }

  if (filteredMembers.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <Users className="h-8 w-8 mx-auto mb-2" />
        No team members available
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {filteredMembers.map((member) => {
        if (!member.user_profile) return null;
        
        const isSelected = selectedMembers.includes(member.user_id);
        
        return (
          <div 
            key={member.id} 
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent/50 ${
              isSelected ? 'bg-accent border-primary' : 'bg-card'
            }`}
            onClick={() => handleMemberToggle(member.user_id)}
          >
            {multiSelect && (
              <Checkbox 
                checked={isSelected}
                onChange={() => handleMemberToggle(member.user_id)}
              />
            )}
            
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {member.user_profile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {showOnlineStatus && member.isOnline && (
                <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-construction-success border-2 border-background rounded-full"></div>
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{member.user_profile.name}</span>
                {showRole && (
                  <Badge variant="secondary" className={roleColors[member.role as keyof typeof roleColors]}>
                    {roleLabels[member.role as keyof typeof roleLabels]}
                  </Badge>
                )}
              </div>
              
              {showOnlineStatus && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Circle className={`h-2 w-2 ${member.isOnline ? 'fill-construction-success text-construction-success' : 'fill-muted text-muted'}`} />
                  <span>{member.isOnline ? 'Online' : 'Offline'}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};