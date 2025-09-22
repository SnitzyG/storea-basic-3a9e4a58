import React, { useState } from 'react';
import { UserCircle, Users2, MoreHorizontal, Edit3, Archive, Trash2, Pin, PinOff, ArchiveRestore } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface ThreadCardProps {
  thread: {
    id: string;
    title: string;
    participants: string[];
    updated_at: string;
    status?: string;
    is_pinned?: boolean;
    is_archived?: boolean;
  };
  unreadCount: number;
  isSelected: boolean;
  isDirect?: boolean;
  onClick: () => void;
  onEdit?: (title: string) => void;
  onClose?: () => void;
  onDelete?: () => void;
  onPin?: () => void;
  onUnpin?: () => void;
  onArchive?: () => void;
  onUnarchive?: () => void;
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
  onPin,
  onUnpin,
  onArchive,
  onUnarchive,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(thread.title);

  // Update editTitle when thread title changes
  React.useEffect(() => {
    setEditTitle(thread.title);
  }, [thread.title]);

  const handleSave = () => {
    if (onEdit && editTitle.trim() !== thread.title) {
      onEdit(editTitle.trim());
    }
    setIsEditing(false);
  };

  return (
    <div 
      className={cn(
        "px-2 py-1 rounded-md cursor-pointer group transition-all duration-150",
        "hover:bg-accent/50 active:bg-accent/70",
        isSelected ? "bg-primary text-primary-foreground" : "text-foreground",
        thread.is_archived && "opacity-60 bg-muted/50"
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        {/* Thread Type Indicator */}
        <div className="flex-shrink-0 flex items-center gap-1">
          {thread.is_pinned && (
            <Pin className={cn(
              "h-3 w-3",
              isSelected ? "text-primary-foreground" : "text-primary"
            )} />
          )}
          {isDirect ? (
            <UserCircle className={cn(
              "h-4 w-4",
              isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
            )} />
          ) : (
            <div className={cn(
              "w-4 h-4 rounded flex items-center justify-center text-xs font-semibold",
              isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              #
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-2 py-1">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="h-7 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSave();
                  } else if (e.key === 'Escape') {
                    setIsEditing(false);
                    setEditTitle(thread.title);
                  }
                }}
                autoFocus
              />
              <div className="flex gap-1">
                <Button size="sm" className="h-6 text-xs px-2" onClick={handleSave}>Save</Button>
                <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={() => {
                  setIsEditing(false);
                  setEditTitle(thread.title);
                }}>Cancel</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <span className={cn(
                    "text-sm font-medium block leading-tight",
                    isSelected ? "text-primary-foreground" : "text-foreground"
                  )}>
                    {thread.title}
                  </span>
                </div>
                
                <div className="flex items-center gap-1 flex-shrink-0">
                  {unreadCount > 0 && (
                    <div className={cn(
                      "h-5 w-5 rounded-full flex items-center justify-center text-xs font-medium",
                      isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary text-primary-foreground"
                    )}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </div>
                  )}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity",
                          isSelected ? "hover:bg-primary-foreground/20 text-primary-foreground" : "hover:bg-accent"
                        )}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        setIsEditing(true);
                      }}>
                        <Edit3 className="h-3 w-3 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      
                      {!thread.is_pinned ? (
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          onPin?.();
                        }}>
                          <Pin className="h-3 w-3 mr-2" />
                          Pin Conversation
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          onUnpin?.();
                        }}>
                          <PinOff className="h-3 w-3 mr-2" />
                          Unpin Conversation
                        </DropdownMenuItem>
                      )}
                      
                      {!thread.is_archived ? (
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          onArchive?.();
                        }}>
                          <Archive className="h-3 w-3 mr-2" />
                          Archive
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          onUnarchive?.();
                        }}>
                          <ArchiveRestore className="h-3 w-3 mr-2" />
                          Unarchive
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete?.();
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-3 w-3 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              <div className={cn(
                "text-xs mt-1 flex items-center gap-1",
                isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
              )}>
                <span>{thread.participants.length} members</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(thread.updated_at), { addSuffix: true })}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};