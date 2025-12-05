import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type HealthStatus = 'loading' | 'connected' | 'error';

export const HealthIndicator = () => {
  const [status, setStatus] = useState<HealthStatus>('loading');
  const showIndicator = new URLSearchParams(window.location.search).has('health');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        // Simple health check - just verify Supabase client works
        const { error } = await supabase.auth.getSession();
        setStatus(error ? 'error' : 'connected');
      } catch {
        setStatus('error');
      }
    };

    checkHealth();
  }, []);

  if (!showIndicator) return null;

  const statusColors = {
    loading: 'bg-yellow-500',
    connected: 'bg-green-500',
    error: 'bg-red-500',
  };

  const statusText = {
    loading: 'Checking...',
    connected: 'Connected',
    error: 'Error',
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 bg-background/90 backdrop-blur border border-border rounded-lg px-3 py-2 text-xs shadow-lg">
      <div className={`w-2 h-2 rounded-full ${statusColors[status]} animate-pulse`} />
      <span className="text-muted-foreground">
        App: <span className="text-foreground">{statusText[status]}</span>
      </span>
    </div>
  );
};
