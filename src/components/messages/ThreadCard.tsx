import React from 'react';
import { MessageSquare, Users, MoreHorizontal } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MessageThread } from '@/hooks/useMessages';
import { format } from 'date-fns';

interface ThreadCardProps {
  thread: MessageThread;
  unreadCount: number;
  isSelected: boolean;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const ThreadCard: React.FC<ThreadCardProps> = ({
  thread,
  unreadCount,
  isSelected,
  onClick,
  onEdit,
  onDelete
}) => {
  return (
    <Card 
      className={`cursor-pointer transition-colors hover:bg-muted/50 ${
        isSelected ? 'ring-2 ring-primary bg-muted/50' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-medium text-sm truncate pr-2">
                {thread.title}
              </h3>
              
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Badge variant="default" className="text-xs">
                    {unreadCount}
                  </Badge>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onEdit && (
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                      }}>
                        Edit Thread
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete();
                        }}
                        className="text-destructive"
                      >
                        Delete Thread
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{thread.participants.length} participants</span>
              <span>•</span>
              <span>{format(new Date(thread.updated_at), 'MMM dd')}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};