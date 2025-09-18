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
    if (!user) return;

    try {
      // Get user's projects first for filtering
      const { data: userProjects, error: projectError } = await supabase
        .from('project_users')
        .select('project_id')
        .eq('user_id', user.id);

      if (projectError) throw projectError;

      const userProjectIds = userProjects?.map(p => p.project_id) || [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Filter notifications to only show relevant ones
      const validNotifications = [];
      for (const notification of data || []) {
        const notificationData = notification.data as any;
        
        // Check if notification is project-related
        if (notificationData?.project_id) {
          // Only include if user is a member of this project
          if (userProjectIds.includes(notificationData.project_id)) {
            // Verify project still exists
            const { data: projectExists } = await supabase
              .from('projects')
              .select('id')
              .eq('id', notificationData.project_id)
              .single();
            
            if (projectExists) {
              validNotifications.push(notification);
            }
          }
        } else {
          // Include system notifications and non-project notifications
          validNotifications.push(notification);
        }
      }

      setNotifications(validNotifications);
      setUnreadCount(validNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
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
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => {
        const wasUnread = notifications.find(n => n.id === notificationId)?.read === false;
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

  // Set up real-time subscription for notifications
  useEffect(() => {
    if (!user) return;

    const channels = [
      // Listen for notification changes
      supabase
        .channel('notifications-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
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