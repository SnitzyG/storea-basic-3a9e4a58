import React, { useState } from 'react';
import { MessageCircle, Users, Clock, Edit, X, Archive, MoreVertical, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';

interface ThreadCardProps {
  thread: {
    id: string;
    title: string;
    participants: string[];
    updated_at: string;
    status?: string;
  };
  unreadCount: number;
  isSelected: boolean;
  isDirect?: boolean;
  onClick: () => void;
  onEdit?: (title: string) => void;
  onClose?: () => void;
  onDelete?: () => void;
}

export const ThreadCard: React.FC<ThreadCardProps> = ({
  thread,
  unreadCount,
  isSelected,
  isDirect = false,
  onClick,
  onEdit,
  onClose,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(thread.title);

  const handleSaveEdit = () => {
    if (onEdit && editTitle.trim() !== thread.title) {
      onEdit(editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(thread.title);
    setIsEditing(false);
  };

  const isClosed = thread.status === 'closed';

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-sm group ${
        isSelected ? 'ring-2 ring-primary/20 bg-primary/5' : ''
      } ${isClosed ? 'opacity-60' : ''}`}
      onClick={!isEditing ? onClick : undefined}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {isDirect ? (
                <MessageCircle className="h-4 w-4 text-primary" />
              ) : (
                <Users className="h-4 w-4 text-secondary" />
              )}
              <Badge variant={isDirect ? "default" : "secondary"} className="text-xs">
                {isDirect ? "Direct" : "Group"}
              </Badge>
              {isClosed && (
                <Badge variant="outline" className="text-xs">
                  <Archive className="h-3 w-3 mr-1" />
                  Closed
                </Badge>
              )}
            </div>
            
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                  autoFocus
                />
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={handleSaveEdit}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <h4 className="font-medium text-sm truncate mb-1 text-foreground">
                {thread.title}
              </h4>
            )}
            
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {thread.participants.length}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(thread.updated_at), { addSuffix: true })}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 w-5 p-0 text-xs flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
            
            {!isEditing && (onEdit || onClose || onDelete) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background border shadow-md">
                  {onEdit && (
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditing(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                  )}
                  {onClose && !isClosed && (
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                      }}
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Close Thread
                    </DropdownMenuItem>
                  )}
                  {onClose && isClosed && (
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        // Reopen logic could be added here
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Reopen
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
                      <X className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};