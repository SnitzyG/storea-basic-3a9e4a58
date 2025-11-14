import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { subHours, subDays } from 'date-fns';

interface MessagesMonitoring {
  totalThreads: number;
  messagesSent24h: number;
  messagesSent7d: number;
  messagesSent30d: number;
  avgResponseTimeMinutes: number;
  activeThreads: number;
  totalUnreadMessages: number;
  mostActiveUsers: { user_id: string; username: string; message_count: number }[];
  recentMessages: any[];
}

export const useMessagesMonitoring = () => {
  const [stats, setStats] = useState<MessagesMonitoring | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const now = new Date();
      const last24h = subHours(now, 24).toISOString();
      const last7d = subDays(now, 7).toISOString();
      const last30d = subDays(now, 30).toISOString();

      const [
        threadsResult,
        messages24hResult,
        messages7dResult,
        messages30dResult,
        messagesWithUsersResult,
        recentResult,
      ] = await Promise.all([
        supabase.from('message_threads').select('*', { count: 'exact', head: true }),
        supabase.from('messages').select('*', { count: 'exact', head: true }).gte('created_at', last24h),
        supabase.from('messages').select('*', { count: 'exact', head: true }).gte('created_at', last7d),
        supabase.from('messages').select('*', { count: 'exact', head: true }).gte('created_at', last30d),
        supabase.from('messages').select('sender_id, profiles(full_name)').gte('created_at', last7d),
        supabase.from('messages').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(20),
      ]);

      // Calculate most active users
      const userMap = new Map<string, { name: string; count: number }>();
      messagesWithUsersResult.data?.forEach((msg: any) => {
        if (msg.sender_id && msg.profiles) {
          const existing = userMap.get(msg.sender_id);
          userMap.set(msg.sender_id, {
            name: msg.profiles.full_name || 'Unknown',
            count: (existing?.count || 0) + 1,
          });
        }
      });

      const mostActiveUsers = Array.from(userMap.entries())
        .map(([id, data]) => ({ user_id: id, username: data.name, message_count: data.count }))
        .sort((a, b) => b.message_count - a.message_count)
        .slice(0, 5);

      setStats({
        totalThreads: threadsResult.count || 0,
        messagesSent24h: messages24hResult.count || 0,
        messagesSent7d: messages7dResult.count || 0,
        messagesSent30d: messages30dResult.count || 0,
        avgResponseTimeMinutes: 0, // Calculate from thread response times if needed
        activeThreads: threadsResult.count || 0,
        totalUnreadMessages: 0, // Calculate from read_receipts if needed
        mostActiveUsers,
        recentMessages: recentResult.data || [],
      });
    } catch (error) {
      console.error('Error fetching messages monitoring stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    const channel = supabase
      .channel('messages-monitoring')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { stats, loading, refetch: fetchStats };
};
