import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface NotificationContextType {
  unreadCounts: {
    messages: number;
    rfis: number;
    documents: number;
    tenders: number;
  };
  markAsRead: (type: string, entityId?: string) => void;
  refreshCounts: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [unreadCounts, setUnreadCounts] = useState({
    messages: 0,
    rfis: 0,
    documents: 0,
    tenders: 0,
  });

  const refreshCounts = async () => {
    if (!user) return;

    try {
      // Get user's projects
      const { data: userProjects } = await supabase
        .from('project_users')
        .select('project_id')
        .eq('user_id', user.id);

      if (!userProjects?.length) return;

      const projectIds = userProjects.map(p => p.project_id);

      // Count unread messages (messages from last 7 days that user hasn't viewed)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count: messageCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('project_id', projectIds)
        .neq('sender_id', user.id)
        .gte('created_at', sevenDaysAgo.toISOString());

      // Count open RFIs assigned to user
      const { count: rfiCount } = await supabase
        .from('rfis')
        .select('*', { count: 'exact', head: true })
        .in('project_id', projectIds)
        .eq('assigned_to', user.id)
        .in('status', ['outstanding', 'overdue']);

      // Count recent documents (last 7 days, not uploaded by user)
      const { count: documentCount } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .in('project_id', projectIds)
        .neq('uploaded_by', user.id)
        .gte('created_at', sevenDaysAgo.toISOString());

      // Count open tenders in user's projects
      const { count: tenderCount } = await supabase
        .from('tenders')
        .select('*', { count: 'exact', head: true })
        .in('project_id', projectIds)
        .eq('status', 'open');

      setUnreadCounts({
        messages: messageCount || 0,
        rfis: rfiCount || 0,
        documents: documentCount || 0,
        tenders: tenderCount || 0,
      });
    } catch (error) {
      console.error('Error refreshing notification counts:', error);
    }
  };

  const markAsRead = (type: string, entityId?: string) => {
    // Update local counts optimistically
    setUnreadCounts(prev => ({
      ...prev,
      [type]: Math.max(0, prev[type as keyof typeof prev] - 1),
    }));
  };

  useEffect(() => {
    refreshCounts();
  }, [user]);

  // Set up real-time subscriptions for live updates
  useEffect(() => {
    if (!user) return;

    const channels = [
      supabase
        .channel('messages-notifications')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, refreshCounts)
        .subscribe(),
      
      supabase
        .channel('rfis-notifications')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rfis' }, refreshCounts)
        .subscribe(),
      
      supabase
        .channel('documents-notifications')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'documents' }, refreshCounts)
        .subscribe(),
      
      supabase
        .channel('tenders-notifications')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tenders' }, refreshCounts)
        .subscribe(),
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [user]);

  const value = {
    unreadCounts,
    markAsRead,
    refreshCounts,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};