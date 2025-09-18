import React, { useState, useEffect } from 'react';
import { Users, UserPlus, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useProjectTeam } from '@/hooks/useProjectTeam';
import { useAuth } from '@/hooks/useAuth';

interface TeamMemberSelectorProps {
  projectId: string;
  selectedMembers: Set<string>;
  onSelectionChange: (selectedMembers: Set<string>) => void;
  disabled?: boolean;
  showSelectAll?: boolean;
  title?: string;
  description?: string;
}

export const TeamMemberSelector: React.FC<TeamMemberSelectorProps> = ({
  projectId,
  selectedMembers,
  onSelectionChange,
  disabled = false,
  showSelectAll = true,
  title = "Share with team members",
  description = "Select team members to share this document with"
}) => {
  const { teamMembers } = useProjectTeam(projectId);
  const { profile } = useAuth();

  // Filter out current user from team members
  const availableMembers = teamMembers.filter(member => 
    member.user_id !== profile?.user_id
  );

  const handleToggleMember = (memberId: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    onSelectionChange(newSelected);
  };

  const handleSelectAll = () => {
    const allMemberIds = new Set(availableMembers.map(member => member.user_id));
    onSelectionChange(allMemberIds);
  };

  const handleSelectNone = () => {
    onSelectionChange(new Set());
  };

  if (availableMembers.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-center text-muted-foreground">
          <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No team members available to share with</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">{title}</h4>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {showSelectAll && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectNone}
              disabled={disabled || selectedMembers.size === 0}
            >
              None
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={disabled || selectedMembers.size === availableMembers.length}
            >
              <Users className="h-4 w-4 mr-2" />
              All
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
        {availableMembers.map((member) => {
          const isSelected = selectedMembers.has(member.user_id);
          
          return (
            <Card 
              key={member.user_id} 
              className={`p-3 cursor-pointer transition-colors ${
                isSelected ? 'bg-muted/50 border-primary/20' : 'hover:bg-muted/30'
              }`}
              onClick={() => !disabled && handleToggleMember(member.user_id)}
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => !disabled && handleToggleMember(member.user_id)}
                  disabled={disabled}
                />
                <div className="flex items-center gap-2 flex-1">
                  <span className="font-medium">
                    {member.user_profile?.name || member.name || 'Unknown'}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {member.role}
                  </Badge>
                  {isSelected && (
                    <Badge variant="secondary" className="text-xs">
                      Selected
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {selectedMembers.size > 0 && (
        <Card>
          <CardContent className="p-3">
            <div className="text-sm text-muted-foreground">
              <strong>{selectedMembers.size}</strong> team member{selectedMembers.size !== 1 ? 's' : ''} selected
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};