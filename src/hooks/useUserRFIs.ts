import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { RFI } from './useRFIs';

export const useUserRFIs = () => {
  const [assignedRFIs, setAssignedRFIs] = useState<RFI[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchAssignedRFIs = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Get RFIs assigned to the current user
      const { data: rfisData, error } = await supabase
        .from('rfis')
        .select('*')
        .eq('assigned_to', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!rfisData || rfisData.length === 0) {
        setAssignedRFIs([]);
        return;
      }

      // Fetch user profiles for raised_by users
      const userIds = [...new Set(rfisData.map(rfi => rfi.raised_by))];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, role')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const enrichedRFIs = rfisData.map(rfi => ({
        ...rfi,
        raised_by_profile: profileMap.get(rfi.raised_by),
      }));

      setAssignedRFIs(enrichedRFIs as RFI[]);
    } catch (error) {
      console.error('Error fetching assigned RFIs:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateRFI = async (id: string, updates: Partial<RFI>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('rfis')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Log activity
      const actions = [];
      if (updates.status) actions.push(`status changed to ${updates.status}`);
      if (updates.response) actions.push('response added');

      if (actions.length > 0) {
        await supabase
          .from('rfi_activities')
          .insert({
            rfi_id: id,
            user_id: user.id,
            action: 'updated',
            details: actions.join(', '),
          });
      }

      // Refresh the list
      await fetchAssignedRFIs();
      return data;
    } catch (error) {
      console.error('Error updating RFI:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchAssignedRFIs();
  }, [user]);

  // Set up real-time subscriptions for RFIs assigned to current user
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user-rfis-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rfis',
          filter: `assigned_to=eq.${user.id}`,
        },
        () => {
          fetchAssignedRFIs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    assignedRFIs,
    loading,
    updateRFI,
    refetch: fetchAssignedRFIs,
  };
};