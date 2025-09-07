import React from 'react';
import { AlertCircle, Paperclip, Clock, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

interface InquiryMessageProps {
  message: {
    id: string;
    content: string;
    attachments?: any[];
    created_at: string;
    sender_id: string;
    inquiry_status?: 'pending' | 'answered' | 'resolved';
  };
  senderName: string;
  isOwnMessage: boolean;
}

export const InquiryMessage: React.FC<InquiryMessageProps> = ({
  message,
  senderName,
  isOwnMessage
}) => {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'answered': return 'bg-blue-500';
      case 'resolved': return 'bg-green-500';
      default: return 'bg-orange-500';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'answered': return 'Answered';
      case 'resolved': return 'Resolved';
      default: return 'Pending Response';
    }
  };

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
      <Card className={`max-w-md ${isOwnMessage ? 'bg-primary/5 border-primary/20' : 'bg-muted/50'}`}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              Formal Inquiry
            </CardTitle>
            <Badge 
              variant="secondary" 
              className={`${getStatusColor(message.inquiry_status)} text-white`}
            >
              {getStatusText(message.inquiry_status)}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-xs">
                {senderName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span>{senderName}</span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-foreground whitespace-pre-wrap mb-3">
            {message.content}
          </p>
          
          {message.attachments && message.attachments.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Attachments:</p>
              {message.attachments.map((attachment, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded text-xs">
                  <Paperclip className="h-3 w-3" />
                  <span>{attachment.name || `Attachment ${index + 1}`}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};