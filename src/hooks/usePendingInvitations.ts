import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  created_at: string;
  inviter_id: string;
  expires_at: string;
  project_id: string;
  status: string;
  token: string;
}

interface UsePendingInvitationsReturn {
  pendingInvitations: PendingInvitation[];
  loading: boolean;
  error: string | null;
  refreshInvitations: () => Promise<void>;
}

export const usePendingInvitations = (projectId: string): UsePendingInvitationsReturn => {
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingInvitations = useCallback(async () => {
    if (!projectId) {
      setPendingInvitations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('invitations')
        .select('*')
        .eq('project_id', projectId)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching pending invitations:', fetchError);
        setError('Failed to fetch pending invitations');
        return;
      }

      setPendingInvitations(data || []);
    } catch (error) {
      console.error('Error in fetchPendingInvitations:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const refreshInvitations = useCallback(async () => {
    await fetchPendingInvitations();
  }, [fetchPendingInvitations]);

  // Real-time subscription for pending invitations with debounced updates
  useEffect(() => {
    fetchPendingInvitations();

    const subscription = supabase
      .channel(`pending_invitations_${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invitations',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          console.log('Pending invitation change:', payload);
          // Direct call without setTimeout to prevent flickering
          fetchPendingInvitations();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [projectId, fetchPendingInvitations]);

  return {
    pendingInvitations,
    loading,
    error,
    refreshInvitations
  };
};