import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { subHours, subDays } from 'date-fns';

export interface IssueGroup {
  id: string;
  fingerprint: string;
  title: string;
  error_type: string;
  first_seen: string;
  last_seen: string;
  occurrence_count: number;
  affected_users: number;
  status: 'open' | 'resolved' | 'ignored';
  severity: string;
  environment: string;
  release_version: string;
}

export interface ErrorDetail {
  id: string;
  error_type: string;
  error_message: string;
  error_stack: string; // Changed from stack_trace to match DB
  created_at: string;
  user_affected: string;
  browser: string;
  os: string;
  device_type: string;
  url: string;
  severity: string;
  environment: string;
  release_version: string;
  resolved: boolean;
}

export interface PerformanceMetric {
  metric_name: string;
  duration_ms: number; // Changed from metric_value to match DB
  created_at: string;
  endpoint: string;
  operation_type: string;
}

export interface AlertNotification {
  id: string;
  triggered_at: string;
  severity: string;
  title: string;
  message: string;
  acknowledged: boolean;
  metadata: any;
}

export interface MonitoringSummary {
  totalErrors: number;
  openIssues: number;
  affectedUsers: number;
  avgResponseTime: number;
  errorRate24h: number;
  activeAlerts: number;
  crashFreeRate: number;
}

export const useMonitoringData = (timeRange: '1h' | '24h' | '7d' | '30d' = '24h') => {
  const [issueGroups, setIssueGroups] = useState<IssueGroup[]>([]);
  const [recentErrors, setRecentErrors] = useState<ErrorDetail[]>([]);
  const [performance, setPerformance] = useState<PerformanceMetric[]>([]);
  const [alerts, setAlerts] = useState<AlertNotification[]>([]);
  const [summary, setSummary] = useState<MonitoringSummary>({
    totalErrors: 0,
    openIssues: 0,
    affectedUsers: 0,
    avgResponseTime: 0,
    errorRate24h: 0,
    activeAlerts: 0,
    crashFreeRate: 100,
  });
  const [loading, setLoading] = useState(true);

  const getTimeRangeDate = () => {
    switch (timeRange) {
      case '1h': return subHours(new Date(), 1);
      case '24h': return subHours(new Date(), 24);
      case '7d': return subDays(new Date(), 7);
      case '30d': return subDays(new Date(), 30);
      default: return subHours(new Date(), 24);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const startTime = getTimeRangeDate().toISOString();

      // Fetch issue groups
      const { data: issues } = await supabase
        .from('issue_groups' as any)
        .select('*')
        .gte('last_seen', startTime)
        .order('last_seen', { ascending: false });

      if (issues) setIssueGroups(issues as any as IssueGroup[]);

      // Fetch recent errors
      const { data: errors } = await supabase
        .from('telemetry_errors' as any)
        .select('*')
        .gte('created_at', startTime)
        .order('created_at', { ascending: false})
        .limit(100);

      if (errors) setRecentErrors(errors as any as ErrorDetail[]);

      // Fetch performance metrics
      const { data: perf } = await supabase
        .from('telemetry_performance' as any)
        .select('*')
        .gte('created_at', startTime)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (perf) setPerformance(perf as any as PerformanceMetric[]);

      // Fetch active alerts
      const { data: activeAlerts } = await supabase
        .from('alert_notifications' as any)
        .select('*')
        .eq('acknowledged', false)
        .order('triggered_at', { ascending: false });

      if (activeAlerts) setAlerts(activeAlerts as any as AlertNotification[]);

      // Calculate summary
      const openIssuesCount = issues?.filter((i: any) => i.status === 'open').length || 0;
      const uniqueUsers = new Set(errors?.map((e: any) => e.user_affected).filter(Boolean)).size;
      const avgPerf = perf && perf.length > 0
        ? perf.reduce((sum: number, p: any) => sum + p.duration_ms, 0) / perf.length
        : 0;

      const totalSessions = 1000; // Would need session tracking
      const errorSessions = new Set(errors?.map((e: any) => e.user_affected)).size;
      const crashFree = ((totalSessions - errorSessions) / totalSessions) * 100;

      setSummary({
        totalErrors: errors?.length || 0,
        openIssues: openIssuesCount,
        affectedUsers: uniqueUsers,
        avgResponseTime: Math.round(avgPerf),
        errorRate24h: errors?.length || 0,
        activeAlerts: activeAlerts?.length || 0,
        crashFreeRate: Math.round(crashFree * 10) / 10,
      });

    } catch (error) {
      console.error('Error fetching monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);

    // Setup realtime subscription
    const subscription = supabase
      .channel('monitoring')
      .on('postgres_changes' as any, {
        event: '*',
        schema: 'public',
        table: 'telemetry_errors',
      }, fetchData)
      .on('postgres_changes' as any, {
        event: '*',
        schema: 'public',
        table: 'issue_groups',
      }, fetchData)
      .on('postgres_changes' as any, {
        event: '*',
        schema: 'public',
        table: 'alert_notifications',
      }, fetchData)
      .subscribe();

    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, [timeRange]);

  const resolveIssue = async (issueId: string) => {
    await supabase
      .from('issue_groups' as any)
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
      })
      .eq('id', issueId);

    fetchData();
  };

  const acknowledgeAlert = async (alertId: string) => {
    await supabase
      .from('alert_notifications' as any)
      .update({
        acknowledged: true,
        acknowledged_at: new Date().toISOString(),
      })
      .eq('id', alertId);

    fetchData();
  };

  return {
    issueGroups,
    recentErrors,
    performance,
    alerts,
    summary,
    loading,
    resolveIssue,
    acknowledgeAlert,
    refetch: fetchData,
  };
};
