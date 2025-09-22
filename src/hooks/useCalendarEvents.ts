import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface CalendarEvent {
  id: string;
  project_id?: string;
  title: string;
  description?: string;
  start_datetime: string;
  end_datetime?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  is_meeting: boolean;
  attendees: any[];
  external_attendees?: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const useCalendarEvents = (projectId?: string) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchEvents = async () => {
    if (!user) {
      setEvents([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      let query = supabase
        .from('calendar_events')
        .select('*')
        .order('start_datetime', { ascending: true });

      if (projectId) {
        // Verify user is member of the project
        const { data: membership } = await supabase
          .from('project_users')
          .select('user_id')
          .eq('project_id', projectId)
          .eq('user_id', user.id)
          .single();

        if (!membership) {
          setEvents([]);
          setLoading(false);
          return;
        }

        query = query.eq('project_id', projectId);
      } else {
        // Get events for all user's projects
        const { data: userProjects } = await supabase
          .from('project_users')
          .select('project_id')
          .eq('user_id', user.id);

        const projectIds = userProjects?.map(p => p.project_id) || [];
        
        if (projectIds.length > 0) {
          query = query.or(`project_id.in.(${projectIds.join(',')}),project_id.is.null`);
        } else {
          query = query.is('project_id', null);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      setEvents(data as CalendarEvent[] || []);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      toast({
        title: "Error",
        description: "Failed to fetch calendar events",
        variant: "destructive",
      });
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async (eventData: {
    project_id?: string;
    title: string;
    description?: string;
    start_datetime: string;
    end_datetime?: string;
    status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    priority?: 'low' | 'medium' | 'high';
    is_meeting?: boolean;
    attendees?: any[];
    external_attendees?: string[];
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          ...eventData,
          created_by: user.id,
          status: eventData.status || 'scheduled',
          priority: eventData.priority || 'medium',
          is_meeting: eventData.is_meeting || false,
          attendees: eventData.attendees || [],
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event created successfully",
      });

      fetchEvents();
      return data;
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateEvent = async (id: string, updates: Partial<CalendarEvent>) => {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event updated successfully",
      });

      fetchEvents();
      return data;
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: "Error",
        description: "Failed to update event",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event deleted successfully",
      });

      fetchEvents();
      return true;
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [projectId, user]);

  // Set up real-time subscriptions for instant updates
  useEffect(() => {
    if (!user) return;

    const channels = [];

    // Subscribe to calendar events changes
    const eventsChannel = supabase
      .channel('calendar-events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calendar_events',
        },
        (payload) => {
          console.log('Calendar event change detected:', payload);
          fetchEvents();
        }
      )
      .subscribe();

    channels.push(eventsChannel);

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [user]);

  return {
    events,
    loading,
    createEvent,
    updateEvent,
    deleteEvent,
    refetch: fetchEvents,
  };
};