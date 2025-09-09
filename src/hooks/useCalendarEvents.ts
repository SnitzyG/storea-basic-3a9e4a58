import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CalendarEvent {
  id: string;
  project_id?: string | null;
  created_by: string;
  title: string;
  description?: string | null;
  start_datetime: string;
  end_datetime?: string | null;
  is_meeting: boolean | null;
  attendees: any;
  external_attendees: string[] | null;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useCalendarEvents = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .order('start_datetime', { ascending: true });

      if (error) throw error;
      setEvents((data || []).map(event => ({
        ...event,
        attendees: Array.isArray(event.attendees) ? event.attendees : [],
        is_meeting: event.is_meeting || false,
        external_attendees: event.external_attendees || []
      })) as CalendarEvent[]);
    } catch (error: any) {
      console.error('Error fetching calendar events:', error);
      toast({
        title: "Error fetching events",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addEvent = async (eventData: {
    project_id?: string;
    title: string;
    description?: string;
    start_datetime: string;
    end_datetime?: string;
    is_meeting: boolean;
    attendees: string[];
    external_attendees: string[];
    priority: 'low' | 'medium' | 'high';
  }) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('calendar_events')
        .insert([{
          ...eventData,
          created_by: userData.user.id
        }])
        .select()
        .single();

      if (error) throw error;

      const eventWithArrayAttendees = {
        ...data,
        attendees: Array.isArray(data.attendees) ? data.attendees : [],
        is_meeting: data.is_meeting || false,
        external_attendees: data.external_attendees || []
      } as CalendarEvent;
      setEvents(prev => [...prev, eventWithArrayAttendees]);
      
      // Send notifications to attendees if it's a meeting
      if (eventData.is_meeting && eventData.attendees.length > 0) {
        await sendMeetingNotifications(data, eventData.attendees);
      }

      toast({
        title: "Event created",
        description: "Calendar event has been created successfully"
      });
      
      return data;
    } catch (error: any) {
      console.error('Error adding event:', error);
      toast({
        title: "Error creating event",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const sendMeetingNotifications = async (event: CalendarEvent, attendeeIds: string[]) => {
    try {
      // Create notifications for each attendee
      const notifications = attendeeIds.map(userId => ({
        user_id: userId,
        type: 'meeting_invitation',
        title: 'Meeting Invitation',
        message: `You've been invited to: ${event.title}`,
        data: {
          event_id: event.id,
          start_datetime: event.start_datetime,
          is_meeting: true
        }
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;
    } catch (error) {
      console.error('Error sending meeting notifications:', error);
    }
  };

  const updateEvent = async (id: string, updates: Partial<CalendarEvent>) => {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setEvents(prev => prev.map(event => 
        event.id === id ? { ...event, ...updates } : event
      ));

      toast({
        title: "Event updated",
        description: "Calendar event has been updated successfully"
      });
    } catch (error: any) {
      console.error('Error updating event:', error);
      toast({
        title: "Error updating event",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setEvents(prev => prev.filter(event => event.id !== id));

      toast({
        title: "Event deleted",
        description: "Calendar event has been deleted successfully"
      });
    } catch (error: any) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error deleting event",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchEvents();

    // Set up real-time subscription
    const channel = supabase
      .channel('calendar_events_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'calendar_events'
      }, () => {
        fetchEvents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    events,
    loading,
    addEvent,
    updateEvent,
    deleteEvent,
    fetchEvents
  };
};