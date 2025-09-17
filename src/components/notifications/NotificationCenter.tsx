import React, { useState } from 'react';
import { Bell, Check, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
const typeColors = {
  rfi: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
  tender: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  project: 'bg-green-500/10 text-green-700 border-green-500/20',
  document: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
  message: 'bg-pink-500/10 text-pink-700 border-pink-500/20',
  system: 'bg-gray-500/10 text-gray-700 border-gray-500/20'
};
export const NotificationCenter = () => {
  const [open, setOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications();
  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Navigate to relevant page based on notification type
    if (notification.data?.url) {
      window.location.href = notification.data.url;
    }
  };
  return <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              {unreadCount > 0 && <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                  <Check className="h-3 w-3 mr-1" />
                  Mark all read
                </Button>}
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {loading ? <div className="p-4 text-center text-muted-foreground">
                  Loading notifications...
                </div> : notifications.length === 0 ? <div className="p-6 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No notifications yet</p>
                  <p className="text-xs mt-1">
                    You'll receive updates about your projects here
                  </p>
                </div> : <div className="divide-y">
                  {notifications.map(notification => <div key={notification.id} className={`group p-4 cursor-pointer hover:bg-muted/50 transition-colors ${!notification.read ? 'bg-primary/5' : ''}`} onClick={() => handleNotificationClick(notification)}>
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!notification.read ? 'bg-primary' : 'bg-transparent'}`} />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`text-sm font-medium truncate ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {notification.title}
                            </h4>
                            <Badge className={typeColors[notification.type as keyof typeof typeColors] || typeColors.system} variant="outline">
                              {notification.type}
                            </Badge>
                          </div>
                          
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                            {/* Show only simple text, filter out complex data */}
                            {typeof notification.message === 'string' 
                              ? notification.message 
                              : 'New notification received'
                            }
                          </p>
                          
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at), {
                        addSuffix: true
                      })}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!notification.read && (
                            <Button variant="ghost" size="sm" onClick={e => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }} className="h-6 w-6 p-0" title="Mark as read">
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={e => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }} className="h-6 w-6 p-0 text-destructive hover:text-destructive" title="Delete notification">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>)}
                </div>}
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>;
};