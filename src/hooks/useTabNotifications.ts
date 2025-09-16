import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface TabNotificationCounts {
  messages: number;
  documents: number;
  rfis: number;
  tenders: number;
  projects: number;
}

export const useTabNotifications = () => {
  const [counts, setCounts] = useState<TabNotificationCounts>({
    messages: 0,
    documents: 0,
    rfis: 0,
    tenders: 0,
    projects: 0,
  });
  const { user } = useAuth();

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
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Parallel count queries for better performance
      const [messagesResult, documentsResult, rfisResult, tendersResult] = await Promise.all([
        // Count unread messages (messages from last 7 days that user hasn't sent)
        supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .in('project_id', projectIds)
          .neq('sender_id', user.id)
          .gte('created_at', sevenDaysAgo.toISOString()),
        
        // Count recent documents (last 7 days, not uploaded by user)
        supabase
          .from('documents')
          .select('*', { count: 'exact', head: true })
          .in('project_id', projectIds)
          .neq('uploaded_by', user.id)
          .gte('created_at', sevenDaysAgo.toISOString()),
        
        // Count open RFIs assigned to user
        supabase
          .from('rfis')
          .select('*', { count: 'exact', head: true })
          .in('project_id', projectIds)
          .eq('assigned_to', user.id)
          .in('status', ['outstanding', 'overdue']),
        
        // Count open tenders in user's projects
        supabase
          .from('tenders')
          .select('*', { count: 'exact', head: true })
          .in('project_id', projectIds)
          .eq('status', 'open')
      ]);

      setCounts({
        messages: messagesResult.count || 0,
        documents: documentsResult.count || 0,
        rfis: rfisResult.count || 0,
        tenders: tendersResult.count || 0,
        projects: 0, // Projects don't have notifications typically
      });
    } catch (error) {
      console.error('Error refreshing tab notification counts:', error);
    }
  };

  const markTabAsRead = (tabId: string) => {
    setCounts(prev => ({
      ...prev,
      [tabId]: 0,
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
        .channel('tab-messages-notifications')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, refreshCounts)
        .subscribe(),
      
      supabase
        .channel('tab-rfis-notifications')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'rfis' }, refreshCounts)
        .subscribe(),
      
      supabase
        .channel('tab-documents-notifications')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'documents' }, refreshCounts)
        .subscribe(),
      
      supabase
        .channel('tab-tenders-notifications')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tenders' }, refreshCounts)
        .subscribe(),
      
      // Refresh when projects are deleted
      supabase
        .channel('tab-projects-cleanup')
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'projects' }, refreshCounts)
        .subscribe(),
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [user]);

  return {
    counts,
    markTabAsRead,
    refreshCounts,
  };
};