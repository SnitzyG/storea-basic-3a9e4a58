import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

      // Determine status based on response time
      let status: 'healthy' | 'degraded' | 'down' = 'healthy';
      if (responseTime > 2000) status = 'down';
      else if (responseTime > 1000) status = 'degraded';

      setStats({
        avgQueryResponseTime: responseTime,
        slowQueries: 0, // Would need analytics/logs to track
        activeConnections: 0, // Would need pg_stat_activity access
        errorRate: 0, // Would need error logging
        status,
        recentErrors: [],
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
