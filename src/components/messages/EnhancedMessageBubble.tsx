import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Message } from '@/hooks/useMessages';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { MoreVertical, Edit2, Trash2, Reply, Check } from 'lucide-react';

interface EnhancedMessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  senderName?: string;
  showAvatar?: boolean;
  isConsecutive?: boolean;
  readBy?: Array<{ user_id: string; name: string; read_at: string }>;
  onEdit?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onReply?: (messageId: string) => void;
}

export const EnhancedMessageBubble: React.FC<EnhancedMessageBubbleProps> = ({
  message,
  isOwnMessage,
  senderName = 'Unknown',
  showAvatar = true,
  isConsecutive = false,
  readBy = [],
  onEdit,
  onDelete,
  onReply
}) => {
  const [showMenu, setShowMenu] = useState(false);

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

  // Check if message can be edited (within 5 minutes)
  const canEdit = isOwnMessage && !message.is_deleted && 
    (new Date().getTime() - new Date(message.created_at).getTime()) < 5 * 60 * 1000;

  return (
    <div 
      className={cn(
        "group px-2 py-1 relative",
        isConsecutive ? "py-0.5" : "py-2"
      )}
      onMouseEnter={() => setShowMenu(true)}
      onMouseLeave={() => setShowMenu(false)}
    >
      <div className={cn(
        "flex gap-2 max-w-full",
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
              : "bg-background border border-border rounded-bl-md"
          )}>
            {message.is_deleted ? (
              <p className="text-sm italic opacity-60">
                [This message was deleted]
              </p>
            ) : (
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {message.content}
              </p>
            )}
            
            {!message.is_deleted && message.attachments && message.attachments.length > 0 && (
              <div className="mt-2 space-y-1">
                {message.attachments.map((attachment: any, index: number) => (
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
            
            {/* WhatsApp-style timestamp with read receipts */}
            <div className={cn(
              "text-xs mt-1 flex items-center gap-1",
              isOwnMessage ? "text-primary-foreground/70 justify-end" : "text-muted-foreground"
            )}>
              <span>{formatTime(message.created_at)}</span>
              {message.edited_at && (
                <span className="italic">(edited)</span>
              )}
              {isOwnMessage && !message.is_deleted && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex">
                        <div className={cn(
                          "w-3 h-3",
                          readBy.length > 0 ? "text-blue-400" : "opacity-70"
                        )}>
                          {readBy.length > 0 ? (
                            <svg viewBox="0 0 16 15" className="fill-current">
                              <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.063-.51zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l3.61 3.463c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"/>
                            </svg>
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                        </div>
                      </div>
                    </TooltipTrigger>
                    {readBy.length > 0 && (
                      <TooltipContent>
                        <div className="text-xs space-y-1">
                          <p className="font-semibold">Read by:</p>
                          {readBy.map(reader => (
                            <div key={reader.user_id}>
                              {reader.name} - {format(new Date(reader.read_at), 'MMM d, HH:mm')}
                            </div>
                          ))}
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        </div>

        {/* Context Menu */}
        {showMenu && !message.is_deleted && (
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
            <DropdownMenuContent align={isOwnMessage ? "end" : "start"}>
              {onReply && (
                <DropdownMenuItem onClick={() => onReply(message.id)}>
                  <Reply className="h-3 w-3 mr-2" />
                  Reply
                </DropdownMenuItem>
              )}
              {canEdit && onEdit && (
                <DropdownMenuItem onClick={() => onEdit(message.id)}>
                  <Edit2 className="h-3 w-3 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {isOwnMessage && onDelete && (
                <DropdownMenuItem 
                  onClick={() => onDelete(message.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-3 w-3 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};