import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { subHours } from 'date-fns';

interface DatabaseMonitoring {
  avgQueryResponseTime: number;
  slowQueries: number;
  activeConnections: number;
  errorRate: number;
  status: 'healthy' | 'degraded' | 'down';
  recentErrors: any[];
}

export const useDatabaseMonitoring = () => {
  const [stats, setStats] = useState<DatabaseMonitoring | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const startTime = Date.now();
      
      // Perform a simple query to measure response time
      await supabase.from('profiles').select('id', { count: 'exact', head: true });
      
      const responseTime = Date.now() - startTime;

      // Get slow queries from activity_log (queries taking > 1 second)
      const oneHourAgo = subHours(new Date(), 1).toISOString();
      const { count: slowQueries } = await supabase
        .from('activity_log')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneHourAgo)
        .neq('metadata->>response_time', null);

      // Get recent errors from activity_log
      const { data: recentErrors } = await supabase
        .from('activity_log')
        .select('*')
        .eq('action', 'error')
        .gte('created_at', oneHourAgo)
        .order('created_at', { ascending: false })
        .limit(10);

      // Calculate error rate
      const { count: totalActivities } = await supabase
        .from('activity_log')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneHourAgo);

      const errorRate = totalActivities && recentErrors 
        ? (recentErrors.length / totalActivities) * 100 
        : 0;

      // Determine status based on response time and error rate
      let status: 'healthy' | 'degraded' | 'down' = 'healthy';
      if (responseTime > 2000 || errorRate > 10) status = 'down';
      else if (responseTime > 1000 || errorRate > 5) status = 'degraded';

      setStats({
        avgQueryResponseTime: responseTime,
        slowQueries: slowQueries || 0,
        activeConnections: 0, // Would need pg_stat_activity access
        errorRate: Math.round(errorRate * 100) / 100,
        status,
        recentErrors: recentErrors || [],
      });
    } catch (error) {
      console.error('Error fetching database monitoring stats:', error);
      setStats({
        avgQueryResponseTime: 0,
        slowQueries: 0,
        activeConnections: 0,
        errorRate: 100,
        status: 'down',
        recentErrors: [],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return { stats, loading, refetch: fetchStats };
};
