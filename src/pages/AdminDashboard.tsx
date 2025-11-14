import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { ProjectsOverviewCard } from '@/components/admin/ProjectsOverviewCard';
import { FinancialDashboardCard } from '@/components/admin/FinancialDashboardCard';
import { TeamCollaborationCard } from '@/components/admin/TeamCollaborationCard';
import { TenderRFIPipelineCard } from '@/components/admin/TenderRFIPipelineCard';
import { AlertsIssuesCard } from '@/components/admin/AlertsIssuesCard';
import { EnhancedRealtimeActivityLog } from '@/components/admin/EnhancedRealtimeActivityLog';
import { SystemHealthWidget } from '@/components/admin/SystemHealthWidget';
import { DocumentsOverviewCard } from '@/components/admin/DocumentsOverviewCard';
import { MessagesOverviewCard } from '@/components/admin/MessagesOverviewCard';
import { UserActivityCard } from '@/components/admin/UserActivityCard';
import { StorageOverviewCard } from '@/components/admin/StorageOverviewCard';
import { CalendarOverviewCard } from '@/components/admin/CalendarOverviewCard';
import { TasksOverviewCard } from '@/components/admin/TasksOverviewCard';
import { DatabasePerformanceCard } from '@/components/admin/DatabasePerformanceCard';
import { EdgeFunctionsCard } from '@/components/admin/EdgeFunctionsCard';
import { SecurityOverviewCard } from '@/components/admin/SecurityOverviewCard';
import { APIMonitoringCard } from '@/components/admin/APIMonitoringCard';
import { useAdminStats } from '@/hooks/useAdminStats';
import { useSystemHealth } from '@/hooks/useSystemHealth';
import { useAdminAlerts } from '@/hooks/useAdminAlerts';
import { useRealtimeAdminStats } from '@/hooks/useRealtimeAdminStats';
import { Skeleton } from '@/components/ui/skeleton';
import { useCallback } from 'react';

export default function AdminDashboard() {
  const { stats, loading: statsLoading, lastUpdate, refetch: refetchStats } = useAdminStats();
  const { health, loading: healthLoading, refetch: refetchHealth } = useSystemHealth();
  const { alerts, dismissAlert } = useAdminAlerts();

  const handleRefresh = useCallback(() => {
    refetchStats();
    refetchHealth();
  }, [refetchStats, refetchHealth]);

  // Set up real-time monitoring for all admin stats
  useRealtimeAdminStats(handleRefresh);

  const loading = statsLoading || healthLoading;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <AdminHeader
          stats={stats ? {
            projects: {
              total: stats.projects.total,
              on_track: stats.projects.onTrack,
              at_risk: stats.projects.atRisk,
              delayed: stats.projects.delayed,
            },
            team: {
              total: stats.team.totalUsers,
              online: stats.team.onlineUsers,
            },
            financial: stats.financial,
          } : null}
          lastUpdate={lastUpdate}
          onRefresh={handleRefresh}
          loading={loading}
        />

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Projects Overview - Takes 2 columns on large screens */}
          {statsLoading ? (
            <div className="col-span-1 md:col-span-2">
              <Skeleton className="h-96 w-full" />
            </div>
          ) : (
            <ProjectsOverviewCard stats={stats?.projects || null} />
          )}

          {/* System Health Widget - Takes 1 column */}
          {healthLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <SystemHealthWidget health={health} />
          )}

          {/* Documents Overview - New */}
          <DocumentsOverviewCard />

          {/* Messages Overview - New */}
          <MessagesOverviewCard />

          {/* User Activity - New */}
          <UserActivityCard />

          {/* Financial Dashboard - Takes 1 column */}
          {statsLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <FinancialDashboardCard stats={stats?.financial || null} />
          )}

          {/* Alerts & Issues - Takes 1 column */}
          <AlertsIssuesCard alerts={alerts} onDismiss={dismissAlert} />

          {/* Team Collaboration - Takes 2 columns on large screens */}
          {statsLoading ? (
            <div className="col-span-1 md:col-span-2">
              <Skeleton className="h-96 w-full" />
            </div>
          ) : (
            <TeamCollaborationCard stats={stats?.collaboration || null} />
          )}

          {/* Tender & RFI Pipeline - Takes 1 column */}
          {statsLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <TenderRFIPipelineCard stats={stats?.tenders || null} />
          )}

          {/* Calendar Overview */}
          <CalendarOverviewCard />

          {/* Tasks Overview */}
          <TasksOverviewCard />

          {/* Database Performance */}
          <DatabasePerformanceCard />

          {/* Edge Functions */}
          <EdgeFunctionsCard />

          {/* Security Overview */}
          <SecurityOverviewCard />

          {/* API Monitoring */}
          <APIMonitoringCard />

          {/* Storage Overview - New */}
          <StorageOverviewCard />
        </div>

        {/* Enhanced Real-time Activity Log with Advanced Filters - Full Width */}
        <EnhancedRealtimeActivityLog />
      </div>
    </AdminLayout>
  );
}
