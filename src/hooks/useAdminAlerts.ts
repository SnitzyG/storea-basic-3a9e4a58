import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  category: 'project' | 'financial' | 'system' | 'team';
  title: string;
  description: string;
  actionUrl?: string;
  actionLabel?: string;
  timestamp: string;
  dismissed: boolean;
}

export const useAdminAlerts = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const generateAlerts = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const generatedAlerts: Alert[] = [];

      // Fetch data for alert generation
      const [budgetsData, rfisData, profilesData, projectsData] = await Promise.all([
        supabase.from('project_budgets').select('*'),
        supabase.from('rfis').select('*'),
        supabase.from('profiles').select('approved').eq('approved', false),
        supabase.from('projects').select('*'),
      ]);

      // Budget overrun alerts
      const budgets = budgetsData.data || [];
      budgets.forEach(budget => {
        const totalBudget = budget.revised_budget || budget.original_budget || 0;
        const utilization = totalBudget > 0 
          ? (0 / totalBudget) * 100 // Would need actual spent tracking
          : 0;
        
        if (utilization > 100) {
          generatedAlerts.push({
            id: `budget-overrun-${budget.id}`,
            severity: 'critical',
            category: 'financial',
            title: 'Budget Overrun Detected',
            description: `Project budget exceeded by ${Math.round(utilization - 100)}%`,
            actionUrl: '/financials',
            actionLabel: 'View Financials',
            timestamp: new Date().toISOString(),
            dismissed: false,
          });
        } else if (utilization > 90) {
          generatedAlerts.push({
            id: `budget-warning-${budget.id}`,
            severity: 'warning',
            category: 'financial',
            title: 'Budget Alert',
            description: `Project budget at ${Math.round(utilization)}% utilization`,
            actionUrl: '/financials',
            actionLabel: 'Review Budget',
            timestamp: new Date().toISOString(),
            dismissed: false,
          });
        }
      });

      // Overdue RFI alerts
      const rfis = rfisData.data || [];
      const now = new Date();
      rfis.forEach(rfi => {
        if (rfi.due_date) {
          const dueDate = new Date(rfi.due_date);
          const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysOverdue > 7 && rfi.status !== 'closed') {
            generatedAlerts.push({
              id: `rfi-overdue-${rfi.id}`,
              severity: 'critical',
              category: 'project',
              title: 'RFI Overdue',
              description: `RFI ${rfi.rfi_number} is ${daysOverdue} days overdue`,
              actionUrl: '/rfis',
              actionLabel: 'View RFI',
              timestamp: new Date().toISOString(),
              dismissed: false,
            });
          } else if (daysOverdue > 0 && daysOverdue <= 2 && rfi.status !== 'closed') {
            generatedAlerts.push({
              id: `rfi-due-soon-${rfi.id}`,
              severity: 'warning',
              category: 'project',
              title: 'RFI Due Soon',
              description: `RFI ${rfi.rfi_number} is due in ${2 - daysOverdue} days`,
              actionUrl: '/rfis',
              actionLabel: 'Review RFI',
              timestamp: new Date().toISOString(),
              dismissed: false,
            });
          }
        }
      });

      // Pending approvals alert
      const pendingUsers = profilesData.data || [];
      if (pendingUsers.length > 5) {
        generatedAlerts.push({
          id: 'pending-approvals',
          severity: 'warning',
          category: 'team',
          title: 'Multiple Pending Approvals',
          description: `${pendingUsers.length} users awaiting approval`,
          actionUrl: '/admin/approvals',
          actionLabel: 'Review Users',
          timestamp: new Date().toISOString(),
          dismissed: false,
        });
      }

      // Inactive projects
      const projects = projectsData.data || [];
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      projects.forEach(project => {
        if (project.updated_at && new Date(project.updated_at) < threeDaysAgo && project.status === 'active') {
          generatedAlerts.push({
            id: `inactive-project-${project.id}`,
            severity: 'info',
            category: 'project',
            title: 'Inactive Project',
            description: `No activity on "${project.name}" for 3+ days`,
            actionUrl: `/projects`,
            actionLabel: 'View Project',
            timestamp: new Date().toISOString(),
            dismissed: false,
          });
        }
      });

      setAlerts(generatedAlerts);
    } catch (error) {
      console.error('Error generating alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  useEffect(() => {
    if (!user) return;

    generateAlerts();

    // Set up real-time subscription for admin alerts with error handling
    const channel = supabase
      .channel('admin-alerts-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_alerts',
        },
        () => {
          generateAlerts();
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Admin alerts channel error');
        }
      });

    // Refresh alerts every 5 minutes
    const interval = setInterval(generateAlerts, 5 * 60 * 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [user]);

  return { alerts, loading, dismissAlert, refetch: generateAlerts };
};
