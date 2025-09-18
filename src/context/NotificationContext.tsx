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
    if (!user) {
      setUnreadCounts({
        messages: 0,
        rfis: 0,
        documents: 0,
        tenders: 0,
      });
      return;
    }

    try {
      // CRITICAL: Get user's current project memberships for strict access control
      const { data: userProjects, error: projectError } = await supabase
        .from('project_users')
        .select('project_id')
        .eq('user_id', user.id);

      if (projectError) {
        console.error('Error fetching user projects for notifications:', projectError);
        return;
      }

      if (!userProjects?.length) {
        setUnreadCounts({
          messages: 0,
          rfis: 0,
          documents: 0,
          tenders: 0,
        });
        return;
      }

      const projectIds = userProjects.map(p => p.project_id);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Parallel queries with strict project-based filtering
      const [messagesResult, rfisResult, documentsResult, tendersResult] = await Promise.all([
        // Count unread messages - only from projects user is member of, exclude own messages
        supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .in('project_id', projectIds)
          .neq('sender_id', user.id)
          .gte('created_at', sevenDaysAgo.toISOString()),
        
        // Count RFIs assigned to user - only from user's projects
        supabase
          .from('rfis')
          .select('*', { count: 'exact', head: true })
          .in('project_id', projectIds)
          .eq('assigned_to', user.id)
          .in('status', ['outstanding', 'overdue']),
        
        // Count recent documents - only from user's projects, exclude own uploads
        supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .in('project_id', projectIds)
          .neq('uploaded_by', user.id)
          .gte('created_at', sevenDaysAgo.toISOString()),
        
        // Count open tenders - only from user's projects
        supabase
          .from('tenders')
          .select('*', { count: 'exact', head: true })
          .in('project_id', projectIds)
          .eq('status', 'open')
      ]);

      // Handle any errors in the parallel queries
      if (messagesResult.error) console.error('Error counting messages:', messagesResult.error);
      if (rfisResult.error) console.error('Error counting RFIs:', rfisResult.error);
      if (documentsResult.error) console.error('Error counting documents:', documentsResult.error);
      if (tendersResult.error) console.error('Error counting tenders:', tendersResult.error);

      setUnreadCounts({
        messages: messagesResult.count || 0,
        rfis: rfisResult.count || 0,
        documents: documentsResult.count || 0,
        tenders: tendersResult.count || 0,
      });
    } catch (error) {
      console.error('Error refreshing notification counts:', error);
      setUnreadCounts({
        messages: 0,
        rfis: 0,
        documents: 0,
        tenders: 0,
      });
    }
  };

  const markAsRead = (type: string, entityId?: string) => {
    // Validate type before updating counts
    const validTypes = ['messages', 'rfis', 'documents', 'tenders'];
    if (!validTypes.includes(type)) {
      console.warn('Invalid notification type:', type);
      return;
    }
    
    // Update local counts optimistically
    setUnreadCounts(prev => ({
      ...prev,
      [type]: Math.max(0, prev[type as keyof typeof prev] - 1),
    }));
  };

  useEffect(() => {
    refreshCounts();
  }, [user]);

  // Set up real-time subscriptions for live updates - with user filtering
  useEffect(() => {
    if (!user) return;

    const channels = [
      // Listen for new messages - only from user's projects
      supabase
        .channel(`messages-notifications-${user.id}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `sender_id=neq.${user.id}` // Only messages not sent by current user
        }, (payload) => {
          // Additional check: verify message is from user's project
          const message = payload.new as any;
          if (message?.project_id) {
            // Verify user is member of this project before counting
            supabase
              .from('project_users')
              .select('project_id')
              .eq('project_id', message.project_id)
              .eq('user_id', user.id)
              .single()
              .then(({ data }) => {
                if (data) refreshCounts();
              });
          }
        })
        .subscribe(),
      
      // Listen for RFI changes - only for user's assigned RFIs
      supabase
        .channel(`rfis-notifications-${user.id}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'rfis'
        }, refreshCounts)
        .subscribe(),
      
      // Listen for document uploads - only from user's projects
      supabase
        .channel(`documents-notifications-${user.id}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'documents',
          filter: `uploaded_by=neq.${user.id}` // Only documents not uploaded by current user
        }, refreshCounts)
        .subscribe(),
      
      // Listen for tender changes - only from user's projects
      supabase
        .channel(`tenders-notifications-${user.id}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'tenders'
        }, refreshCounts)
        .subscribe(),
        
      // Listen for project membership changes to refresh counts
      supabase
        .channel(`project-membership-${user.id}`)
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'project_users',
          filter: `user_id=eq.${user.id}`
        }, refreshCounts)
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