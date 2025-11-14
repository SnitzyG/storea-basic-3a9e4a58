import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface AdminStats {
  projects: {
    total: number;
    active: number;
    onTrack: number;
    atRisk: number;
    delayed: number;
    completed: number;
    healthScore: number;
  };
  financial: {
    totalBudget: number;
    totalSpent: number;
    remaining: number;
    burnRate: number;
    utilizationPercent: number;
    pendingInvoices: Array<{
      id: string;
      number: string;
      amount: number;
      dueDate: string;
      vendor: string;
    }>;
  };
  team: {
    totalUsers: number;
    onlineUsers: number;
    pendingApprovals: number;
    roleBreakdown: Record<string, number>;
  };
  collaboration: {
    messagesLast24h: number;
    documentsLast7d: number;
    rfisPending: number;
    approvalsWaiting: number;
  };
  tenders: {
    total: number;
    draft: number;
    open: number;
    awarded: number;
    closed: number;
    dueThisWeek: number;
    rfisWaitingResponse: number;
    rfisPendingClient: number;
  };
}

export const useAdminStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchStats = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch all stats in parallel
      const [
        projectsData,
        budgetsData,
        profilesData,
        messagesData,
        documentsData,
        rfisData,
        tendersData,
      ] = await Promise.all([
        supabase.from('projects').select('*'),
        supabase.from('project_budgets').select('*'),
        supabase.from('profiles').select('user_id, role, approved, last_seen, online_status'),
        supabase.from('messages').select('created_at').gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('documents').select('created_at').gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('rfis').select('*'),
        supabase.from('tenders').select('*'),
      ]);

      // Process projects
      const projects = projectsData.data || [];
      const activeProjects = projects.filter(p => p.status === 'active');
      
      // Calculate project health (simplified)
      const onTrack = activeProjects.filter(p => {
        // Project is on track if it exists and is active
        return true; // Simplified for now
      }).length;
      
      const healthScore = activeProjects.length > 0 ? Math.round((onTrack / activeProjects.length) * 100) : 100;

      // Process financial
      const budgets = budgetsData.data || [];
      const totalBudget = budgets.reduce((sum, b) => sum + (b.revised_budget || b.original_budget || 0), 0);
      const totalSpent = 0; // Would need actual spent tracking
      const remaining = totalBudget - totalSpent;
      const utilizationPercent = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
      const burnRate = totalSpent > 0 ? Math.round(totalSpent / Math.max(1, budgets.length)) : 0;

      // Process team
      const profiles = profilesData.data || [];
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const onlineUsers = profiles.filter(p => 
        p.last_seen && new Date(p.last_seen) > fiveMinutesAgo
      ).length;
      const pendingApprovals = profiles.filter(p => !p.approved).length;
      
      const roleBreakdown = profiles.reduce((acc, p) => {
        acc[p.role || 'unknown'] = (acc[p.role || 'unknown'] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Process collaboration
      const messagesLast24h = messagesData.data?.length || 0;
      const documentsLast7d = documentsData.data?.length || 0;
      
      const rfis = rfisData.data || [];
      const rfisPending = rfis.filter(r => r.status === 'draft' || r.status === 'outstanding').length;
      
      // Approvals waiting - simplified
      const approvalsWaiting = pendingApprovals;

      // Process tenders & RFIs
      const tenders = tendersData.data || [];
      
      // Count tenders by status
      const tendersByStatus = {
        draft: tenders.filter(t => t.status === 'draft').length,
        open: tenders.filter(t => t.status === 'open').length,
        awarded: tenders.filter(t => t.status === 'awarded').length,
        closed: tenders.filter(t => t.status === 'closed').length,
      };
      const totalTenders = tenders.length;
      
      const dueThisWeek = tenders.filter(t => {
        if (!t.submission_deadline_time) return false;
        const daysUntilDue = Math.floor((new Date(t.submission_deadline_time).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilDue <= 7 && daysUntilDue >= 0;
      }).length;
      
      const rfisWaitingResponse = rfis.filter(r => r.status === 'outstanding' || r.status === 'sent').length;
      const rfisPendingClient = rfis.filter(r => r.status === 'received' || r.status === 'answered').length;

      setStats({
        projects: {
          total: projects.length,
          active: activeProjects.length,
          onTrack,
          atRisk: Math.floor(activeProjects.length * 0.2), // Simplified
          delayed: Math.floor(activeProjects.length * 0.1), // Simplified
          completed: projects.filter(p => p.status === 'completed').length,
          healthScore,
        },
        financial: {
          totalBudget,
          totalSpent,
          remaining,
          burnRate,
          utilizationPercent,
          pendingInvoices: [], // Would need invoices table
        },
        team: {
          totalUsers: profiles.length,
          onlineUsers,
          pendingApprovals,
          roleBreakdown,
        },
        collaboration: {
          messagesLast24h,
          documentsLast7d,
          rfisPending,
          approvalsWaiting,
        },
        tenders: {
          total: totalTenders,
          draft: tendersByStatus.draft,
          open: tendersByStatus.open,
          awarded: tendersByStatus.awarded,
          closed: tendersByStatus.closed,
          dueThisWeek,
          rfisWaitingResponse,
          rfisPendingClient,
        },
      });

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Set up real-time subscriptions
    const channel = supabase
      .channel('admin-stats-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rfis' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tenders' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_budgets' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchStats)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return { stats, loading, lastUpdate, refetch: fetchStats };
};
