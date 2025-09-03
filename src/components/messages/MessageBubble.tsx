import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Message } from '@/hooks/useMessages';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  senderName?: string;
  showAvatar?: boolean;
  isConsecutive?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  senderName = 'Unknown',
  showAvatar = true,
  isConsecutive = false
}) => {
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

  return (
    <div className={cn(
      "flex gap-3 mb-4",
      isOwnMessage ? "justify-end" : "justify-start"
    )}>
      {!isOwnMessage && showAvatar && !isConsecutive && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="text-xs">
            {getInitials(senderName)}
          </AvatarFallback>
        </Avatar>
      )}
      
      {!isOwnMessage && (!showAvatar || isConsecutive) && (
        <div className="w-8 flex-shrink-0" />
      )}
      
      <div className={cn(
        "flex flex-col max-w-[70%]",
        isOwnMessage ? "items-end" : "items-start"
      )}>
        {!isConsecutive && !isOwnMessage && (
          <div className="text-xs text-muted-foreground mb-1 px-3">
            {senderName}
          </div>
        )}
        
        <div className={cn(
          "px-3 py-2 rounded-lg break-words",
          isOwnMessage
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted rounded-bl-sm"
        )}>
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.attachments.map((attachment, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  📎 {attachment.name || 'Attachment'}
                </Badge>
              ))}
            </div>
          )}
        </div>
        
        <div className="text-xs text-muted-foreground mt-1 px-1">
          {formatTime(message.created_at)}
        </div>
      </div>
      
      {isOwnMessage && showAvatar && !isConsecutive && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="text-xs">
            {getInitials(senderName)}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};