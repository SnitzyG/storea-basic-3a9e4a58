import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  read: boolean;
  created_at: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchNotifications = async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      // CRITICAL: Get user's current project memberships for access control
      const { data: userProjects, error: projectError } = await supabase
        .from('project_users')
        .select('project_id')
        .eq('user_id', user.id);

      if (projectError) {
        console.error('Error fetching user projects:', projectError);
        throw projectError;
      }

      const userProjectIds = userProjects?.map(p => p.project_id) || [];

      // Only fetch notifications for this specific user
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100); // Increased limit for better pagination

      if (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }

      // CRITICAL: Filter notifications with strict access control
      const validNotifications = [];
      for (const notification of data || []) {
        const notificationData = notification.data as any;
        
        // Check if notification is project-related
        if (notificationData?.project_id) {
          // STRICT CHECK: Only include if user is currently a member of this project
          if (userProjectIds.includes(notificationData.project_id)) {
            // Additional verification: Ensure project still exists and user has access
            const { data: projectAccess } = await supabase
              .from('project_users')
              .select('project_id')
              .eq('project_id', notificationData.project_id)
              .eq('user_id', user.id)
              .maybeSingle();
            
            if (projectAccess) {
              validNotifications.push(notification);
            }
          }
        } else {
          // Only include system notifications and personal notifications
          // Additional check: verify this notification truly belongs to the user
          if (notification.user_id === user.id) {
            validNotifications.push(notification);
          }
        }
      }

      // Sort by most recent first
      const sortedNotifications = validNotifications.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setNotifications(sortedNotifications);
      setUnreadCount(sortedNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user) return;
    
    try {
      // CRITICAL: Only allow marking user's own notifications as read
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', user.id); // Double security check

      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!user) return;
    
    try {
      // CRITICAL: Only allow deletion of user's own notifications
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id); // Double security check

      if (error) {
        console.error('Error deleting notification:', error);
        return;
      }

      const wasUnread = notifications.find(n => n.id === notificationId)?.read === false;
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => {
        return wasUnread ? Math.max(0, prev - 1) : prev;
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const createNotification = async (notification: {
    user_id: string;
    type: string;
    title: string;
    message: string;
    data?: any;
  }) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert([notification]);

      if (error) throw error;
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  // Set up real-time subscription for notifications with strict filtering
  useEffect(() => {
    if (!user) return;

    const channels = [
      // Listen for notification changes - only for current user
      supabase
        .channel('notifications-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`, // CRITICAL: Only user's own notifications
          },
          (payload) => {
            console.log('Notification change for user:', payload);
            // Re-fetch to ensure proper filtering is applied
            fetchNotifications();
          }
        )
        .subscribe(),
      // Listen for project membership changes to refresh notifications
      supabase
        .channel('project-membership-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'project_users',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('User project membership changed:', payload);
            // Re-fetch notifications when user's project access changes
            fetchNotifications();
          }
        )
        .subscribe(),
      
      // Listen for project deletions to refresh notifications
      supabase
        .channel('project-deletions')
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'projects',
          },
          () => {
            fetchNotifications();
          }
        )
        .subscribe()
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [user]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    refetch: fetchNotifications,
  };
};