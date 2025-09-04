import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Clock, User } from 'lucide-react';
import { useMessages } from '@/hooks/useMessages';
import { useNotificationContext } from '@/context/NotificationContext';
import { format } from 'date-fns';

export const OpenMessages = () => {
  const { threads, messages, loading } = useMessages();
  const { unreadCounts } = useNotificationContext();

  // Show recent threads (last 5)
  const recentThreads = threads.slice(0, 5);

  if (loading) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Open Messages
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Open Messages 
          {unreadCounts.messages > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCounts.messages}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto space-y-4">
        {recentThreads.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center mt-8">No action required</div>
        ) : (
          recentThreads.map((thread) => {
            const lastMessage = messages
              .filter(m => m.thread_id === thread.id)
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

            return (
              <div key={thread.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{thread.title}</p>
                    {lastMessage && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {lastMessage.content}
                      </p>
                    )}
                  </div>
                  {unreadCounts.messages > 0 && (
                    <Badge variant="destructive" className="text-xs ml-2">
                      New
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {thread.participants?.length || 0} participants
                  </div>
                  {lastMessage && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(lastMessage.created_at), 'MMM d, h:mm a')}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        
        {threads.length > 5 && (
          <Button variant="outline" size="sm" className="w-full mt-4">
            View All ({threads.length - 5} more)
          </Button>
        )}
      </CardContent>
    </Card>
  );
};