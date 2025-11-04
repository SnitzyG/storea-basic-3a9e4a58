import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Message } from '@/hooks/useMessages';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Check, CheckCheck, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  senderName?: string;
  showAvatar?: boolean;
  isConsecutive?: boolean;
  readBy?: { user_id: string; name: string; read_at: string }[];
  onEdit?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  senderName = 'Unknown',
  showAvatar = true,
  isConsecutive = false,
  readBy = [],
  onEdit,
  onDelete
}) => {
  const [showActions, setShowActions] = useState(false);
  
  const canEdit = isOwnMessage && !message.is_deleted;
  const canDelete = isOwnMessage && !message.is_deleted;
  const isDeleted = message.is_deleted;
  const isEdited = message.edited_at != null;
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (timestamp: string) => {
    return format(new Date(timestamp), 'HH:mm');
  };

  const readByText = readBy.length > 0 
    ? `Read by: ${readBy.map(r => r.name).join(', ')}`
    : 'Delivered';

  return (
    <div 
      className={cn(
        "group px-2 py-1",
        isConsecutive ? "py-0.5" : "py-2"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={cn(
        "flex gap-2 max-w-full relative",
        isOwnMessage ? "justify-end" : "justify-start"
      )}>
        {!isOwnMessage && showAvatar && !isConsecutive && (
          <Avatar className="h-8 w-8 flex-shrink-0 mt-0.5">
            <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
              {getInitials(senderName)}
            </AvatarFallback>
          </Avatar>
        )}
        
        {!isOwnMessage && (!showAvatar || isConsecutive) && (
          <div className="w-8 flex-shrink-0" />
        )}
        
        <div className={cn(
          "flex flex-col min-w-0 max-w-[75%]",
          isOwnMessage ? "items-end" : "items-start"
        )}>
          {!isConsecutive && !isOwnMessage && (
            <div className="mb-1 px-1">
              <span className="text-xs font-medium text-primary">
                {senderName}
              </span>
            </div>
          )}
          
          <div className={cn(
            "rounded-2xl px-4 py-2 break-words shadow-sm relative",
            isOwnMessage
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-background border border-border rounded-bl-md",
            isDeleted && "opacity-60"
          )}>
            <p className={cn(
              "text-sm whitespace-pre-wrap leading-relaxed",
              isDeleted && "italic"
            )}>
              {isDeleted ? '[This message was deleted]' : message.content}
            </p>
            
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2 space-y-1">
                {message.attachments.map((attachment, index) => (
                  <div key={index} className={cn(
                    "flex items-center gap-2 p-2 rounded-lg border",
                    isOwnMessage 
                      ? "bg-primary-foreground/10 border-primary-foreground/20" 
                      : "bg-muted/50 border-border"
                  )}>
                    <div className="text-sm">📎</div>
                    {attachment.type === 'document' ? (
                      <Link 
                        to={`/documents?highlight=${attachment.id}`}
                        className={cn(
                          "text-xs font-medium hover:underline truncate",
                          isOwnMessage ? "text-primary-foreground" : "text-primary"
                        )}
                      >
                        {attachment.name || 'Document'}
                      </Link>
                    ) : attachment.type === 'rfi' ? (
                      <Link 
                        to={`/rfis?highlight=${attachment.id}`}
                        className={cn(
                          "text-xs font-medium hover:underline truncate",
                          isOwnMessage ? "text-primary-foreground" : "text-primary"
                        )}
                      >
                        {attachment.name || 'RFI'}
                      </Link>
                    ) : (
                      <span className={cn(
                        "text-xs font-medium truncate",
                        isOwnMessage ? "text-primary-foreground/80" : "text-foreground"
                      )}>
                        {attachment.name || 'Attachment'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {!isDeleted && (
              <>
                {/* Edited indicator */}
                {isEdited && (
                  <span className={cn(
                    "text-xs mt-1 block",
                    isOwnMessage ? "text-primary-foreground/60" : "text-muted-foreground"
                  )}>
                    [edited {format(new Date(message.edited_at!), 'HH:mm')}]
                  </span>
                )}

                {/* Timestamp with read receipts */}
                <div className={cn(
                  "text-xs mt-1 flex items-center gap-1",
                  isOwnMessage ? "text-primary-foreground/70 justify-end" : "text-muted-foreground"
                )}>
                  <span>{formatTime(message.created_at)}</span>
                  {isOwnMessage && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex cursor-help">
                            {readBy.length > 0 ? (
                              <CheckCheck className={cn(
                                "w-4 h-4",
                                readBy.length > 0 ? "text-blue-400" : "text-primary-foreground/70"
                              )} />
                            ) : (
                              <Check className="w-4 h-4 text-primary-foreground/70" />
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                          <p className="text-xs">{readByText}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Message Actions */}
        {!isDeleted && (canEdit || canDelete) && showActions && (
          <div className={cn(
            "flex-shrink-0 self-start mt-2",
            isOwnMessage && "order-first"
          )}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isOwnMessage ? "start" : "end"}>
                {canEdit && onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(message.id)}>
                    <Edit className="h-3 w-3 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {canDelete && onDelete && (
                  <DropdownMenuItem onClick={() => onDelete(message.id)} className="text-destructive">
                    <Trash2 className="h-3 w-3 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
};