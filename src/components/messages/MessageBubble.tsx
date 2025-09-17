import React from 'react';
import { Link } from 'react-router-dom';
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
      "group hover:bg-muted/30 px-3 py-1 rounded transition-colors",
      isConsecutive ? "py-0.5" : "py-2"
    )}>
      <div className={cn(
        "flex gap-3",
        isOwnMessage ? "justify-end" : "justify-start"
      )}>
        {!isOwnMessage && showAvatar && !isConsecutive && (
          <Avatar className="h-9 w-9 flex-shrink-0 mt-0.5">
            <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
              {getInitials(senderName)}
            </AvatarFallback>
          </Avatar>
        )}
        
        {!isOwnMessage && (!showAvatar || isConsecutive) && (
          <div className="w-9 flex-shrink-0" />
        )}
        
        <div className={cn(
          "flex flex-col min-w-0",
          isOwnMessage ? "items-end max-w-[70%]" : "items-start flex-1"
        )}>
          {!isConsecutive && (
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-sm font-semibold text-foreground">
                {isOwnMessage ? 'You' : senderName}
              </span>
              <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                {formatTime(message.created_at)}
              </span>
            </div>
          )}
          
          <div className={cn(
            "rounded-lg break-words max-w-full",
            isOwnMessage
              ? "bg-primary text-primary-foreground px-3 py-2"
              : "text-foreground"
          )}>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {message.content}
            </p>
            
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2 space-y-1">
                {message.attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 rounded border bg-background/50">
                    <div className="text-sm">📎</div>
                    {attachment.type === 'document' ? (
                      <Link 
                        to={`/documents?highlight=${attachment.id}`}
                        className="text-xs font-medium text-primary hover:underline truncate"
                      >
                        {attachment.name || 'Document'}
                      </Link>
                    ) : attachment.type === 'rfi' ? (
                      <Link 
                        to={`/rfis?highlight=${attachment.id}`}
                        className="text-xs font-medium text-primary hover:underline truncate"
                      >
                        {attachment.name || 'RFI'}
                      </Link>
                    ) : (
                      <span className="text-xs font-medium truncate">
                        {attachment.name || 'Attachment'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {isConsecutive && (
            <div className="text-xs text-muted-foreground mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {formatTime(message.created_at)}
            </div>
          )}
        </div>
        
        {isOwnMessage && showAvatar && !isConsecutive && (
          <Avatar className="h-9 w-9 flex-shrink-0 mt-0.5">
            <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
              {getInitials(senderName)}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
};