import { CalendarEvent } from '@/hooks/useCalendarEvents';
import { isSameDay, areIntervalsOverlapping, parseISO } from 'date-fns';

export const CATEGORY_OPTIONS = [
  { value: 'client_meeting', label: 'Client Meetings', color: 'hsl(var(--chart-1))' },
  { value: 'internal', label: 'Internal', color: 'hsl(var(--chart-2))' },
  { value: 'deadline', label: 'Deadlines', color: 'hsl(var(--chart-3))' },
  { value: 'personal', label: 'Personal', color: 'hsl(var(--chart-4))' },
  { value: 'focus_time', label: 'Focus Time', color: 'hsl(var(--chart-5))' },
  { value: 'general', label: 'General', color: 'hsl(var(--muted-foreground))' },
] as const;

export const getCategoryColor = (category: string): string => {
  const cat = CATEGORY_OPTIONS.find(c => c.value === category);
  return cat?.color || 'hsl(var(--muted-foreground))';
};

export const getCategoryLabel = (category: string): string => {
  const cat = CATEGORY_OPTIONS.find(c => c.value === category);
  return cat?.label || 'General';
};

export interface ConflictInfo {
  hasConflict: boolean;
  conflictingEvents: CalendarEvent[];
  message?: string;
}

export const detectConflicts = (
  newEvent: {
    start_datetime: string;
    end_datetime?: string;
  },
  existingEvents: CalendarEvent[],
  excludeEventId?: string
): ConflictInfo => {
  const conflicts: CalendarEvent[] = [];
  
  const newStart = parseISO(newEvent.start_datetime);
  const newEnd = newEvent.end_datetime ? parseISO(newEvent.end_datetime) : newStart;

  for (const event of existingEvents) {
    // Skip the event being edited
    if (excludeEventId && event.id === excludeEventId) continue;

    const eventStart = parseISO(event.start_datetime);
    const eventEnd = event.end_datetime ? parseISO(event.end_datetime) : eventStart;

    // Check if events overlap
    const overlaps = areIntervalsOverlapping(
      { start: newStart, end: newEnd },
      { start: eventStart, end: eventEnd },
      { inclusive: true }
    );

    if (overlaps) {
      conflicts.push(event);
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflictingEvents: conflicts,
    message: conflicts.length > 0 
      ? `This event overlaps with ${conflicts.length} other event${conflicts.length > 1 ? 's' : ''}`
      : undefined,
  };
};
