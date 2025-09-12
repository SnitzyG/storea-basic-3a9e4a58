import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { 
  Bell, 
  Settings, 
  Send, 
  MessageSquare, 
  AtSign,
  Megaphone,
  Users,
  Filter,
  Search,
  Volume2,
  VolumeX,
  Mail,
  Smartphone,
  Monitor,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'announcement' | 'mention' | 'activity' | 'system';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  created_by?: string;
  project_id?: string;
  metadata?: any;
}

interface NotificationPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  in_app_notifications: boolean;
  announcement_notifications: boolean;
  mention_notifications: boolean;
  activity_notifications: boolean;
  email_frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

export const EnhancedCommunication = ({ projectId }: { projectId?: string }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_notifications: true,
    push_notifications: true,
    in_app_notifications: true,
    announcement_notifications: true,
    mention_notifications: true,
    activity_notifications: true,
    email_frequency: 'immediate',
    quiet_hours_enabled: false,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00'
  });
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  const { user, profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadNotifications();
    loadPreferences();
    if (projectId) {
      loadTeamMembers();
    }
    setupRealtimeSubscription();
  }, [projectId]);

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (data) {
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const loadTeamMembers = async () => {
    if (!projectId) return;

    try {
      const { data, error } = await supabase
        .from('project_users')
        .select(`
          user_id,
          role,
          profiles:user_id (
            name,
            avatar_url,
            online_status
          )
        `)
        .eq('project_id', projectId);

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error loading team members:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
          
          // Show toast for new notifications
          if (preferences.in_app_notifications) {
            toast({
              title: payload.new.title,
              description: payload.new.message,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendAnnouncement = async () => {
    if (!announcementTitle || !announcementText || !projectId) return;

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-announcement', {
        body: {
          projectId,
          title: announcementTitle,
          message: announcementText,
          targetUsers: selectedUsers.length > 0 ? selectedUsers : undefined
        }
      });

      if (error) throw error;

      toast({
        title: "Announcement sent",
        description: `Sent to ${selectedUsers.length > 0 ? selectedUsers.length : teamMembers.length} team members.`
      });

      setAnnouncementTitle('');
      setAnnouncementText('');
      setSelectedUsers([]);
    } catch (error) {
      console.error('Error sending announcement:', error);
      toast({
        title: "Error sending announcement",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user?.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );

      toast({
        title: "All notifications marked as read",
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const updatePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    const updatedPreferences = { ...preferences, ...newPreferences };
    
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user?.id,
          ...updatedPreferences
        });

      if (error) throw error;

      setPreferences(updatedPreferences);
      toast({
        title: "Preferences updated",
        description: "Your notification preferences have been saved."
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast({
        title: "Error updating preferences",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'announcement':
        return <Megaphone className="h-4 w-4" />;
      case 'mention':
        return <AtSign className="h-4 w-4" />;
      case 'activity':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = searchQuery === '' || 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterType === 'all' || notification.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Enhanced Communication
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount}</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Advanced notification system and team communication tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="notifications" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="announcements">Announcements</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>

            <TabsContent value="notifications" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search notifications..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="announcement">Announcements</SelectItem>
                      <SelectItem value="mention">Mentions</SelectItem>
                      <SelectItem value="activity">Activity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {unreadCount > 0 && (
                  <Button variant="outline" onClick={markAllAsRead}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Mark All Read
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No notifications found</p>
                  </div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        notification.read ? 'bg-background' : 'bg-blue-50 border-blue-200'
                      }`}
                      onClick={() => !notification.read && markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 ${notification.read ? 'text-muted-foreground' : 'text-blue-600'}`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className={`font-medium ${notification.read ? 'text-muted-foreground' : 'text-foreground'}`}>
                              {notification.title}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {notification.type}
                            </Badge>
                          </div>
                          <p className={`text-sm mt-1 ${notification.read ? 'text-muted-foreground' : 'text-foreground'}`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="announcements" className="space-y-4">
              {projectId && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Megaphone className="h-5 w-5" />
                      Send Team Announcement
                    </CardTitle>
                    <CardDescription>
                      Send important updates to your project team
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="announcement-title">Title</Label>
                      <Input
                        id="announcement-title"
                        placeholder="Enter announcement title..."
                        value={announcementTitle}
                        onChange={(e) => setAnnouncementTitle(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="announcement-message">Message</Label>
                      <Textarea
                        id="announcement-message"
                        placeholder="Enter your announcement message..."
                        value={announcementText}
                        onChange={(e) => setAnnouncementText(e.target.value)}
                        rows={4}
                      />
                    </div>

                    <div>
                      <Label>Recipients</Label>
                      <div className="mt-2 space-y-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedUsers([])}
                          className={selectedUsers.length === 0 ? 'border-blue-500 bg-blue-50' : ''}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          All Team Members ({teamMembers.length})
                        </Button>
                        
                        <div className="grid grid-cols-2 gap-2">
                          {teamMembers.map((member) => (
                            <div
                              key={member.user_id}
                              className={`flex items-center gap-2 p-2 border rounded cursor-pointer ${
                                selectedUsers.includes(member.user_id) ? 'border-blue-500 bg-blue-50' : ''
                              }`}
                              onClick={() => {
                                setSelectedUsers(prev =>
                                  prev.includes(member.user_id)
                                    ? prev.filter(id => id !== member.user_id)
                                    : [...prev, member.user_id]
                                );
                              }}
                            >
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs">
                                  {member.profiles?.name?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{member.profiles?.name || 'Unknown'}</span>
                              <Badge variant="outline" className="text-xs ml-auto">
                                {member.role}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={sendAnnouncement}
                      disabled={loading || !announcementTitle || !announcementText}
                      className="w-full"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {loading ? 'Sending...' : 'Send Announcement'}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="preferences" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>
                    Customize how and when you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Notification Channels</h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          <span>Email Notifications</span>
                        </div>
                        <Switch
                          checked={preferences.email_notifications}
                          onCheckedChange={(checked) =>
                            updatePreferences({ email_notifications: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4" />
                          <span>Push Notifications</span>
                        </div>
                        <Switch
                          checked={preferences.push_notifications}
                          onCheckedChange={(checked) =>
                            updatePreferences({ push_notifications: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4" />
                          <span>In-App Notifications</span>
                        </div>
                        <Switch
                          checked={preferences.in_app_notifications}
                          onCheckedChange={(checked) =>
                            updatePreferences({ in_app_notifications: checked })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Notification Types</h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Megaphone className="h-4 w-4" />
                          <span>Announcements</span>
                        </div>
                        <Switch
                          checked={preferences.announcement_notifications}
                          onCheckedChange={(checked) =>
                            updatePreferences({ announcement_notifications: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AtSign className="h-4 w-4" />
                          <span>@Mentions</span>
                        </div>
                        <Switch
                          checked={preferences.mention_notifications}
                          onCheckedChange={(checked) =>
                            updatePreferences({ mention_notifications: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          <span>Activity Updates</span>
                        </div>
                        <Switch
                          checked={preferences.activity_notifications}
                          onCheckedChange={(checked) =>
                            updatePreferences({ activity_notifications: checked })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Email Frequency</h4>
                    <Select
                      value={preferences.email_frequency}
                      onValueChange={(value) =>
                        updatePreferences({ email_frequency: value as any })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="hourly">Hourly Digest</SelectItem>
                        <SelectItem value="daily">Daily Digest</SelectItem>
                        <SelectItem value="weekly">Weekly Digest</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {preferences.quiet_hours_enabled ? (
                          <VolumeX className="h-4 w-4" />
                        ) : (
                          <Volume2 className="h-4 w-4" />
                        )}
                        <span>Quiet Hours</span>
                      </div>
                      <Switch
                        checked={preferences.quiet_hours_enabled}
                        onCheckedChange={(checked) =>
                          updatePreferences({ quiet_hours_enabled: checked })
                        }
                      />
                    </div>

                    {preferences.quiet_hours_enabled && (
                      <div className="grid grid-cols-2 gap-4 ml-6">
                        <div>
                          <Label>Start Time</Label>
                          <Input
                            type="time"
                            value={preferences.quiet_hours_start}
                            onChange={(e) =>
                              updatePreferences({ quiet_hours_start: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <Label>End Time</Label>
                          <Input
                            type="time"
                            value={preferences.quiet_hours_end}
                            onChange={(e) =>
                              updatePreferences({ quiet_hours_end: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};