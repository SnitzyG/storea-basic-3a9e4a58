import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TelemetryAnalytics {
  totalPageViews: number;
  uniqueUsers: number;
  avgSessionDuration: number;
  topPages: { page: string; views: number }[];
  errorRate: number;
  avgApiResponseTime: number;
  featureUsage: { feature: string; usage: number }[];
  userJourney: { from: string; to: string; count: number }[];
  activeUsers: number;
  topErrors: { message: string; count: number; severity: string }[];
}

export const useTelemetryAnalytics = (timeRange: '24h' | '7d' | '30d' = '24h') => {
  const [analytics, setAnalytics] = useState<TelemetryAnalytics>({
    totalPageViews: 0,
    uniqueUsers: 0,
    avgSessionDuration: 0,
    topPages: [],
    errorRate: 0,
    avgApiResponseTime: 0,
    featureUsage: [],
    userJourney: [],
    activeUsers: 0,
    topErrors: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      const startDate = getStartDate(timeRange);

      try {
        // Fetch all analytics data
        const [
          pageViewsData,
          sessionsData,
          errorsData,
          performanceData,
          eventsData,
        ] = await Promise.all([
          supabase.from('telemetry_events').select('*').eq('event_type', 'page_view').gte('created_at', startDate),
          supabase.from('telemetry_sessions').select('*').gte('started_at', startDate),
          supabase.from('telemetry_errors').select('*').gte('created_at', startDate),
          supabase.from('telemetry_performance').select('*').eq('metric_type', 'api_call').gte('created_at', startDate),
          supabase.from('telemetry_events').select('*').gte('created_at', startDate),
        ]);

        // Process analytics
        const totalPageViews = pageViewsData.data?.length || 0;
        const uniqueUsers = new Set(sessionsData.data?.map(s => s.user_id).filter(Boolean)).size;
        const avgSessionDuration = calculateAvgSessionDuration(sessionsData.data || []);
        const topPages = calculateTopPages(pageViewsData.data || []);
        const errorRate = calculateErrorRate(eventsData.data?.length || 0, errorsData.data?.length || 0);
        const avgApiResponseTime = calculateAvgResponseTime(performanceData.data || []);
        const featureUsage = calculateFeatureUsage(eventsData.data || []);
        const userJourney = calculateUserJourney(pageViewsData.data || []);
        const activeUsers = calculateActiveUsers(sessionsData.data || []);
        const topErrors = calculateTopErrors(errorsData.data || []);

        setAnalytics({
          totalPageViews,
          uniqueUsers,
          avgSessionDuration,
          topPages,
          errorRate,
          avgApiResponseTime,
          featureUsage,
          userJourney,
          activeUsers,
          topErrors,
        });
      } catch (error) {
        console.error('Error fetching telemetry analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  return { analytics, loading };
};

function getStartDate(timeRange: string): string {
  const now = new Date();
  switch (timeRange) {
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    default:
      return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  }
}

function calculateAvgSessionDuration(sessions: any[]): number {
  const completedSessions = sessions.filter(s => s.duration_seconds);
  if (completedSessions.length === 0) return 0;
  const total = completedSessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
  return Math.round(total / completedSessions.length);
}

function calculateTopPages(pageViews: any[]): { page: string; views: number }[] {
  const pageMap = new Map<string, number>();
  pageViews.forEach(pv => {
    const page = pv.event_name || 'unknown';
    pageMap.set(page, (pageMap.get(page) || 0) + 1);
  });
  return Array.from(pageMap.entries())
    .map(([page, views]) => ({ page, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);
}

function calculateErrorRate(totalEvents: number, totalErrors: number): number {
  if (totalEvents === 0) return 0;
  return Number(((totalErrors / totalEvents) * 100).toFixed(2));
}

function calculateAvgResponseTime(performance: any[]): number {
  if (performance.length === 0) return 0;
  const total = performance.reduce((sum, p) => sum + (p.duration_ms || 0), 0);
  return Math.round(total / performance.length);
}

function calculateFeatureUsage(events: any[]): { feature: string; usage: number }[] {
  const featureMap = new Map<string, number>();
  events.forEach(e => {
    if (e.event_type === 'button_click' || e.event_type === 'form_submit') {
      featureMap.set(e.event_name, (featureMap.get(e.event_name) || 0) + 1);
    }
  });
  return Array.from(featureMap.entries())
    .map(([feature, usage]) => ({ feature, usage }))
    .sort((a, b) => b.usage - a.usage)
    .slice(0, 10);
}

function calculateUserJourney(pageViews: any[]): { from: string; to: string; count: number }[] {
  const journeyMap = new Map<string, number>();
  const sortedViews = pageViews.sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  for (let i = 0; i < sortedViews.length - 1; i++) {
    if (sortedViews[i].session_id === sortedViews[i + 1].session_id) {
      const key = `${sortedViews[i].event_name}→${sortedViews[i + 1].event_name}`;
      journeyMap.set(key, (journeyMap.get(key) || 0) + 1);
    }
  }

  return Array.from(journeyMap.entries())
    .map(([journey, count]) => {
      const [from, to] = journey.split('→');
      return { from, to, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function calculateActiveUsers(sessions: any[]): number {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return sessions.filter(s => 
    !s.ended_at && new Date(s.started_at) > fiveMinutesAgo
  ).length;
}

function calculateTopErrors(errors: any[]): { message: string; count: number; severity: string }[] {
  const errorMap = new Map<string, { count: number; severity: string }>();
  errors.forEach(e => {
    const existing = errorMap.get(e.error_message) || { count: 0, severity: e.severity };
    errorMap.set(e.error_message, { count: existing.count + 1, severity: e.severity });
  });
  return Array.from(errorMap.entries())
    .map(([message, data]) => ({ message, count: data.count, severity: data.severity }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}
