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
      "group px-2 py-1",
      isConsecutive ? "py-0.5" : "py-2"
    )}>
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
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {message.content}
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
            
            {/* WhatsApp-style timestamp */}
            <div className={cn(
              "text-xs mt-1 flex items-center gap-1",
              isOwnMessage ? "text-primary-foreground/70 justify-end" : "text-muted-foreground"
            )}>
              <span>{formatTime(message.created_at)}</span>
              {isOwnMessage && (
                <div className="flex">
                  <div className="w-3 h-3 opacity-70">
                    <svg viewBox="0 0 16 15" className="fill-current">
                      <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.063-.51zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l3.61 3.463c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"/>
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};