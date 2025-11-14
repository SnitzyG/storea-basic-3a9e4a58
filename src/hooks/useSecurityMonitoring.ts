import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { subHours } from 'date-fns';

interface SecurityMonitoring {
  failedLoginAttempts24h: number;
  rlsViolations: number;
  securityScore: number;
  recentSecurityEvents: any[];
  status: 'secure' | 'warning' | 'critical';
}

export const useSecurityMonitoring = () => {
  const [stats, setStats] = useState<SecurityMonitoring | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const last24h = subHours(new Date(), 24).toISOString();

      // Check for suspicious activity patterns
      const { data: recentActivity } = await supabase
        .from('activity_log')
        .select('*')
        .gte('timestamp', last24h)
        .order('timestamp', { ascending: false })
        .limit(50);

      const failedAttempts = 0; // Would need auth logs
      const rlsViolations = 0; // Would need RLS audit logs

      // Calculate security score (0-100)
      let securityScore = 100;
      if (failedAttempts > 50) securityScore -= 30;
      else if (failedAttempts > 20) securityScore -= 15;
      else if (failedAttempts > 10) securityScore -= 5;

      if (rlsViolations > 0) securityScore -= 20;

      let status: 'secure' | 'warning' | 'critical' = 'secure';
      if (securityScore < 50) status = 'critical';
      else if (securityScore < 75) status = 'warning';

      setStats({
        failedLoginAttempts24h: failedAttempts,
        rlsViolations,
        securityScore,
        recentSecurityEvents: recentActivity || [],
        status,
      });
    } catch (error) {
      console.error('Error fetching security monitoring stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Refresh every 60 seconds
    const interval = setInterval(fetchStats, 60000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return { stats, loading, refetch: fetchStats };
};
