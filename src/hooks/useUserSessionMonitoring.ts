// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { subMinutes } from 'date-fns';

interface UserSessionMonitoring {
  activeSessions: number;
  onlineUsers: number;
  totalUsers: number;
  pendingApprovals: number;
  usersByRole: { role: string; count: number }[];
  recentLogins: any[];
  failedLoginAttempts: number;
}

export const useUserSessionMonitoring = () => {
  const [stats, setStats] = useState<UserSessionMonitoring>({
    activeSessions: 0,
    onlineUsers: 0,
    totalUsers: 0,
    pendingApprovals: 0,
    usersByRole: [],
    recentLogins: [],
    failedLoginAttempts: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Get total users count
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get pending approvals
      const { count: pendingApprovals } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('approved', false);

      // Get active sessions (users who logged in within last 15 minutes)
      const fifteenMinutesAgo = subMinutes(new Date(), 15).toISOString();
      const { count: activeSessions } = await supabase
        .from('user_sessions')
        .select('*', { count: 'exact', head: true })
        .is('ended_at', null)
        .gte('started_at', fifteenMinutesAgo);

      // Get online users (users active in last 5 minutes)
      const fiveMinutesAgo = subMinutes(new Date(), 5).toISOString();
      const { count: onlineUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_seen', fiveMinutesAgo);

      // Get users by role
      const { data: roleData } = await supabase
        .from('profiles')
        .select('role');

      const usersByRole = roleData?.reduce((acc: { role: string; count: number }[], profile) => {
        const role = profile.role || 'unknown';
        const existing = acc.find(r => r.role === role);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ role, count: 1 });
        }
        return acc;
      }, []) || [];

      // Get recent logins (last 10)
      const { data: recentLogins } = await supabase
        .from('activity_log')
        .select(`
          *,
          user:profiles!activity_log_user_id_fkey(name, email)
        `)
        .eq('action', 'login')
        .order('created_at', { ascending: false })
        .limit(10);

      // Get failed login attempts in last hour
      const oneHourAgo = subMinutes(new Date(), 60).toISOString();
      const { count: failedLoginAttempts } = await supabase
        .from('activity_log')
        .select('*', { count: 'exact', head: true })
        .eq('action', 'login_failed')
        .gte('created_at', oneHourAgo);

      setStats({
        activeSessions: activeSessions || 0,
        onlineUsers: onlineUsers || 0,
        totalUsers: totalUsers || 0,
        pendingApprovals: pendingApprovals || 0,
        usersByRole,
        recentLogins: recentLogins || [],
        failedLoginAttempts: failedLoginAttempts || 0,
      });
    } catch (error) {
      console.error('Error fetching user session monitoring stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Set up real-time subscription for user sessions
    const channel = supabase
      .channel('user-session-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_sessions',
        },
        () => {
          fetchStats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  return { stats, loading, refetch: fetchStats };
};
