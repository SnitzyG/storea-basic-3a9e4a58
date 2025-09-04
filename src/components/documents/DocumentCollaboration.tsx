import React, { useState, useEffect } from 'react';
import { Users, UserCheck, Clock, Wifi } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CollaboratorStatus {
  user_id: string;
  user_name: string;
  is_online: boolean;
  last_activity: string;
  current_action?: 'viewing' | 'editing' | 'commenting';
  cursor_position?: { x: number; y: number };
}

interface DocumentCollaborationProps {
  documentId: string;
  collaborators: CollaboratorStatus[];
  currentUserId: string;
}

export const DocumentCollaboration: React.FC<DocumentCollaborationProps> = ({
  documentId,
  collaborators,
  currentUserId
}) => {
  const [realTimeCollaborators, setRealTimeCollaborators] = useState<CollaboratorStatus[]>(collaborators);

  useEffect(() => {
    // Set up real-time collaboration updates
    // In a real implementation, this would connect to WebSocket or Supabase realtime
    const interval = setInterval(() => {
      // Simulate real-time updates
      setRealTimeCollaborators(prev => 
        prev.map(collab => ({
          ...collab,
          is_online: Math.random() > 0.3, // Random online status for demo
          last_activity: Math.random() > 0.5 ? new Date().toISOString() : collab.last_activity
        }))
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getActionIcon = (action?: CollaboratorStatus['current_action']) => {
    switch (action) {
      case 'editing':
        return '✏️';
      case 'commenting':
        return '💬';
      case 'viewing':
        return '👀';
      default:
        return '👤';
    }
  };

  const getActionColor = (action?: CollaboratorStatus['current_action']) => {
    switch (action) {
      case 'editing':
        return 'bg-blue-500';
      case 'commenting':
        return 'bg-green-500';
      case 'viewing':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const onlineCollaborators = realTimeCollaborators.filter(c => c.is_online && c.user_id !== currentUserId);
  const recentCollaborators = realTimeCollaborators.filter(c => !c.is_online);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Collaborators
          <Badge variant="outline" className="ml-auto">
            {onlineCollaborators.length} online
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {onlineCollaborators.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Wifi className="h-4 w-4 text-green-500" />
              Currently Active
            </div>
            
            <div className="space-y-2">
              {onlineCollaborators.map((collaborator) => (
                <TooltipProvider key={collaborator.user_id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                        <div className="relative">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {collaborator.user_name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background ${getActionColor(collaborator.current_action)}`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">
                              {collaborator.user_name}
                            </span>
                            <span className="text-sm">
                              {getActionIcon(collaborator.current_action)}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {collaborator.current_action || 'active'}
                          </div>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{collaborator.user_name} is {collaborator.current_action || 'viewing'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        )}

        {recentCollaborators.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Recent Activity
            </div>
            
            <div className="space-y-2">
              {recentCollaborators.slice(0, 3).map((collaborator) => (
                <div key={collaborator.user_id} className="flex items-center gap-3 p-2 rounded-lg opacity-60">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {collaborator.user_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {collaborator.user_name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Last seen: {new Date(collaborator.last_activity).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {onlineCollaborators.length === 0 && recentCollaborators.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-8 w-8 mx-auto mb-2" />
            <p>No collaborators yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};