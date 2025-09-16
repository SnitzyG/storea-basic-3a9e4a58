import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { Todo } from './useTodos';

export interface RFI {
  id: string;
  project_id: string;
  raised_by: string;
  assigned_to?: string;
  question: string;
  response?: string;
  status: 'outstanding' | 'overdue' | 'responded' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date?: string;
  category?: string;
  attachments?: any[];
  created_at: string;
  updated_at: string;
  // New structured RFI fields
  project_name?: string;
  project_number?: string;
  rfi_number?: string;
  recipient_name?: string;
  recipient_email?: string;
  sender_name?: string;
  sender_email?: string;
  subject?: string;
  drawing_no?: string;
  specification_section?: string;
  contract_clause?: string;
  other_reference?: string;
  proposed_solution?: string;
  required_response_by?: string;
  responder_name?: string;
  responder_position?: string;
  response_date?: string;
  raised_by_profile?: {
    name: string;
    role: string;
  };
  assigned_to_profile?: {
    name: string;
    role: string;
  };
}

export interface RFIActivity {
  id: string;
  rfi_id: string;
  user_id: string;
  action: string;
  details?: string;
  created_at: string;
  user_profile?: {
    name: string;
    role: string;
  };
}

export const useRFIs = (projectId?: string) => {
  const [rfis, setRFIs] = useState<RFI[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchRFIs = async () => {
    if (!projectId) return;
    
    try {
      const { data: rfisData, error } = await supabase
        .from('rfis')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles separately
      const userIds = [...new Set([
        ...rfisData.map(rfi => rfi.raised_by),
        ...rfisData.map(rfi => rfi.assigned_to).filter(Boolean)
      ])];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, role')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const enrichedRFIs = rfisData.map(rfi => ({
        ...rfi,
        raised_by_profile: profileMap.get(rfi.raised_by),
        assigned_to_profile: rfi.assigned_to ? profileMap.get(rfi.assigned_to) : undefined,
      }));

      setRFIs(enrichedRFIs as RFI[]);
    } catch (error) {
      console.error('Error fetching RFIs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch RFIs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createRFI = async (rfiData: {
    project_id: string;
    question: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    due_date?: string;
    category?: string;
    assigned_to?: string;
    // New structured fields
    project_name?: string;
    project_number?: string;
    recipient_name?: string;
    recipient_email?: string;
    sender_name?: string;
    sender_email?: string;
    subject?: string;
    drawing_no?: string;
    specification_section?: string;
    contract_clause?: string;
    other_reference?: string;
    proposed_solution?: string;
    required_response_by?: string;
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('rfis')
        .insert({
          ...rfiData,
          raised_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Log activity for the general activity feed
      await supabase
        .from('activity_log')
        .insert([{
          user_id: user.id,
          project_id: rfiData.project_id,
          entity_type: 'rfi',
          entity_id: data.id,
          action: 'created',
          description: `Created new RFI: "${rfiData.question.substring(0, 50)}${rfiData.question.length > 50 ? '...' : ''}"`,
          metadata: { 
            priority: rfiData.priority,
            assigned_to: rfiData.assigned_to,
            category: rfiData.category 
          }
        }]);

      // Log RFI-specific activity
      await supabase
        .from('rfi_activities')
        .insert({
          rfi_id: data.id,
          user_id: user.id,
          action: 'created',
          details: `RFI created with priority: ${rfiData.priority}`,
        });

      // Calendar sync: create todos for creator and assignee when required date is present
      if (rfiData.required_response_by) {
        const todoRows: Partial<Todo>[] = [];
        const content = `RFI response required: ${rfiData.subject || rfiData.question.substring(0, 50)}`;
        // Creator
        todoRows.push({
          user_id: user.id,
          project_id: rfiData.project_id,
          content,
          priority: rfiData.priority === 'critical' ? 'high' : rfiData.priority === 'high' ? 'high' : 'medium',
          due_date: rfiData.required_response_by,
        } as any);
        // Assignee
        if (rfiData.assigned_to) {
          todoRows.push({
            user_id: rfiData.assigned_to,
            project_id: rfiData.project_id,
            content,
            priority: rfiData.priority === 'critical' ? 'high' : rfiData.priority === 'high' ? 'high' : 'medium',
            due_date: rfiData.required_response_by,
          } as any);
        }

        if (todoRows.length > 0) {
          await supabase.from('todos').insert(todoRows as any);
        }
      }

      toast({
        title: "Success",
        description: "RFI created successfully",
      });

      fetchRFIs();
      return data;
    } catch (error) {
      console.error('Error creating RFI:', error);
      toast({
        title: "Error",
        description: "Failed to create RFI",
        variant: "destructive",
      });
      return null;
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
      if (updates.assigned_to) actions.push('assigned to team member');
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

      // If response was added now and there is a due date, optionally complete creator's todo
      if (updates.response) {
        try {
          const { data: rfiRow } = await supabase
            .from('rfis')
            .select('required_response_by, raised_by')
            .eq('id', id)
            .single();
          if (rfiRow?.required_response_by) {
            await supabase
              .from('todos')
              .update({ completed: true })
              .match({
                project_id: (data as any)?.project_id,
                user_id: rfiRow.raised_by,
              })
              .ilike('content', '%RFI response required:%');
          }
        } catch (e) {
          console.debug('Optional todo completion skipped or failed', e);
        }
      }

      toast({
        title: "Success",
        description: "RFI updated successfully",
      });

      fetchRFIs();
      return data;
    } catch (error) {
      console.error('Error updating RFI:', error);
      toast({
        title: "Error",
        description: "Failed to update RFI",
        variant: "destructive",
      });
      return null;
    }
  };

  const getRFIActivities = async (rfiId: string): Promise<RFIActivity[]> => {
    try {
      const { data: activitiesData, error } = await supabase
        .from('rfi_activities')
        .select('*')
        .eq('rfi_id', rfiId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles separately
      const userIds = [...new Set(activitiesData.map(activity => activity.user_id))];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, role')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const enrichedActivities = activitiesData.map(activity => ({
        ...activity,
        user_profile: profileMap.get(activity.user_id),
      }));

      return enrichedActivities as RFIActivity[];
    } catch (error) {
      console.error('Error fetching RFI activities:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchRFIs();
  }, [projectId]);

  // Set up comprehensive real-time subscriptions for instant updates
  useEffect(() => {
    if (!projectId) return;

    const channels = [];

    // Subscribe to RFI table changes
    const rfiChannel = supabase
      .channel('rfis-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rfis',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          console.log('RFI change detected:', payload);
          fetchRFIs();
        }
      )
      .subscribe();

    channels.push(rfiChannel);

    // Subscribe to RFI activities changes for instant activity updates
    const activitiesChannel = supabase
      .channel('rfi-activities-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rfi_activities',
        },
        (payload: any) => {
          console.log('RFI activity change detected:', payload);
          // Check if this activity belongs to an RFI in our project
          if (rfis.some(rfi => rfi.id === payload.new?.rfi_id || rfi.id === payload.old?.rfi_id)) {
            fetchRFIs();
          }
        }
      )
      .subscribe();

    channels.push(activitiesChannel);

    // Subscribe to RFI collaboration comments changes
    const commentsChannel = supabase
      .channel('rfi-comments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rfi_collaboration_comments',
        },
        (payload: any) => {
          console.log('RFI comment change detected:', payload);
          // Check if this comment belongs to an RFI in our project
          if (rfis.some(rfi => rfi.id === payload.new?.rfi_id || rfi.id === payload.old?.rfi_id)) {
            fetchRFIs();
          }
        }
      )
      .subscribe();

    channels.push(commentsChannel);

    // Subscribe to profile changes that might affect displayed names
    const profilesChannel = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        (payload: any) => {
          console.log('Profile change detected:', payload);
          // Check if this profile is referenced in any of our RFIs
          const updatedUserId = payload.new?.user_id;
          if (rfis.some(rfi => rfi.raised_by === updatedUserId || rfi.assigned_to === updatedUserId)) {
            fetchRFIs();
          }
        }
      )
      .subscribe();

    channels.push(profilesChannel);

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [projectId, rfis.length]); // Include rfis.length to ensure we re-subscribe when RFIs change

  return {
    rfis,
    loading,
    createRFI,
    updateRFI,
    getRFIActivities,
    refetch: fetchRFIs,
  };
};