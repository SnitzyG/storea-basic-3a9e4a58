import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, startOfWeek, startOfMonth, isPast } from 'date-fns';

interface CalendarMonitoring {
  totalEvents: number;
  eventsToday: number;
  eventsThisWeek: number;
  eventsThisMonth: number;
  overdueEvents: number;
  upcomingEvents: any[];
  eventsByType: { type: string; count: number }[];
  mostBusyProjects: { project_id: string; project_name: string; event_count: number }[];
}

export const useCalendarMonitoring = () => {
  const [stats, setStats] = useState<CalendarMonitoring | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const now = new Date();
      const today = startOfDay(now).toISOString();
      const weekStart = startOfWeek(now).toISOString();
      const monthStart = startOfMonth(now).toISOString();

      const [
        totalResult,
        allEventsResult,
        upcomingResult,
      ] = await Promise.all([
        supabase.from('calendar_events').select('*', { count: 'exact', head: true }),
        supabase.from('calendar_events').select('*'),
        supabase.from('calendar_events')
          .select('*, projects(name)')
          .gte('start_datetime', today)
          .order('start_datetime', { ascending: true })
          .limit(10),
      ]);

      const allEvents = allEventsResult.data || [];
      
      // Count events by time period
      const eventsToday = allEvents.filter(e => e.start_datetime >= today).length;
      const eventsThisWeek = allEvents.filter(e => e.start_datetime >= weekStart).length;
      const eventsThisMonth = allEvents.filter(e => e.start_datetime >= monthStart).length;
      
      // Count overdue events
      const overdueEvents = allEvents.filter(e => isPast(new Date(e.start_datetime)) && e.status !== 'completed').length;

      // Calculate events by type
      const typeMap = new Map<string, number>();
      allEvents.forEach((event: any) => {
        const type = event.event_type || 'Other';
        typeMap.set(type, (typeMap.get(type) || 0) + 1);
      });

      // Calculate most busy projects
      const projectMap = new Map<string, { name: string; count: number }>();
      allEvents.forEach((event: any) => {
        if (event.project_id) {
          const existing = projectMap.get(event.project_id);
          projectMap.set(event.project_id, {
            name: 'Project', // Get from join if needed
            count: (existing?.count || 0) + 1,
          });
        }
      });

      const mostBusyProjects = Array.from(projectMap.entries())
        .map(([id, data]) => ({ project_id: id, project_name: data.name, event_count: data.count }))
        .sort((a, b) => b.event_count - a.event_count)
        .slice(0, 5);

      setStats({
        totalEvents: totalResult.count || 0,
        eventsToday,
        eventsThisWeek,
        eventsThisMonth,
        overdueEvents,
        upcomingEvents: upcomingResult.data || [],
        eventsByType: Array.from(typeMap.entries()).map(([type, count]) => ({ type, count })),
        mostBusyProjects,
      });
    } catch (error) {
      console.error('Error fetching calendar monitoring stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    const channel = supabase
      .channel('calendar-monitoring')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_events' }, () => {
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { stats, loading, refetch: fetchStats };
};
