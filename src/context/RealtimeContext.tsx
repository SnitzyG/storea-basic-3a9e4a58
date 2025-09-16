import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface RealtimeContextType {
  isConnected: boolean;
  lastUpdate: Date | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

const RealtimeContext = createContext<RealtimeContextType>({
  isConnected: false,
  lastUpdate: null,
  connectionStatus: 'disconnected'
});

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};

interface RealtimeProviderProps {
  children: React.ReactNode;
}

export const RealtimeProvider: React.FC<RealtimeProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setIsConnected(false);
      setConnectionStatus('disconnected');
      return;
    }

    console.log('Setting up global real-time connection for user:', user.id);
    setConnectionStatus('connecting');

    // Global activity channel for connection monitoring
    const activityChannel = supabase
      .channel('global-activity')
      .on('broadcast', { event: 'activity' }, () => {
        setLastUpdate(new Date());
      })
      .subscribe((status) => {
        console.log('Global real-time connection status:', status);
        
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setConnectionStatus('connected');
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          setConnectionStatus('error');
        } else if (status === 'TIMED_OUT') {
          setIsConnected(false);
          setConnectionStatus('error');
        } else if (status === 'CLOSED') {
          setIsConnected(false);
          setConnectionStatus('disconnected');
        }
      });

    // Global notification channel to ensure real-time updates work
    const globalChannel = supabase
      .channel('global-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_log',
        },
        () => {
          setLastUpdate(new Date());
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      console.log('Cleaning up global real-time connection');
      supabase.removeChannel(activityChannel);
      supabase.removeChannel(globalChannel);
      setIsConnected(false);
      setConnectionStatus('disconnected');
    };
  }, [user]);

  // Heartbeat to maintain connection
  useEffect(() => {
    if (!isConnected || !user) return;

    const heartbeat = setInterval(() => {
      // Send a heartbeat to keep the connection alive
      supabase
        .channel('global-activity')
        .send({
          type: 'broadcast',
          event: 'heartbeat',
          payload: { user_id: user.id, timestamp: new Date().toISOString() }
        });
    }, 30000); // Every 30 seconds

    return () => clearInterval(heartbeat);
  }, [isConnected, user]);

  const value: RealtimeContextType = {
    isConnected,
    lastUpdate,
    connectionStatus
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
};
