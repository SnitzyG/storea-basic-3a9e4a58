import React from 'react';
import { CalendarEvent } from '@/hooks/useCalendarEvents';
import { format, isToday, isTomorrow, parseISO, startOfDay } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, Video, Edit, Trash2, CheckCircle2 } from 'lucide-react';
import { getCategoryColor, getCategoryLabel } from '@/lib/calendarUtils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface AgendaViewProps {
  events: CalendarEvent[];
  onEdit: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => void;
  onStatusChange: (eventId: string, status: CalendarEvent['status']) => void;
}

export const AgendaView: React.FC<AgendaViewProps> = ({
  events,
  onEdit,
  onDelete,
  onStatusChange,
}) => {
  // Group events by date
  const eventsByDate = events.reduce((acc, event) => {
    const dateKey = format(parseISO(event.start_datetime), 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

  // Sort dates
  const sortedDates = Object.keys(eventsByDate).sort();

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      high: 'destructive',
      medium: 'default',
      low: 'secondary',
    } as const;
    return <Badge variant={variants[priority as keyof typeof variants] || 'default'}>{priority}</Badge>;
  };

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 p-4">
        {sortedDates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No upcoming events</p>
          </div>
        ) : (
          sortedDates.map((dateKey) => (
            <div key={dateKey} className="space-y-2">
              <div className="sticky top-0 bg-background py-2 z-10">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  {getDateLabel(dateKey)}
                </h3>
              </div>
              <div className="space-y-2">
                {eventsByDate[dateKey]
                  .sort((a, b) => 
                    parseISO(a.start_datetime).getTime() - parseISO(b.start_datetime).getTime()
                  )
                  .map((event) => (
                    <Card key={event.id} className="p-3 hover:bg-accent/50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-1 rounded-full"
                              style={{ backgroundColor: getCategoryColor(event.category || 'general') }}
                            />
                            <h4 className="font-medium">{event.title}</h4>
                            {event.is_meeting && (
                              <Badge variant="outline" className="h-5">Meeting</Badge>
                            )}
                          </div>
                          
                          {event.description && (
                            <p className="text-sm text-muted-foreground">{event.description}</p>
                          )}

                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(parseISO(event.start_datetime), 'h:mm a')}
                              {event.end_datetime && ` - ${format(parseISO(event.end_datetime), 'h:mm a')}`}
                            </div>
                            
                            {event.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {event.location}
                              </div>
                            )}
                            
                            {event.meeting_link && (
                              <div className="flex items-center gap-1">
                                <Video className="h-3 w-3" />
                                <a 
                                  href={event.meeting_link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="hover:underline"
                                >
                                  Join meeting
                                </a>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{getCategoryLabel(event.category || 'general')}</Badge>
                            {getPriorityBadge(event.priority)}
                            <Badge 
                              variant={event.status === 'completed' ? 'default' : 'secondary'}
                            >
                              {event.status}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => onEdit(event)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          {event.status !== 'completed' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => onStatusChange(event.id, 'completed')}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => onDelete(event.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
              {dateKey !== sortedDates[sortedDates.length - 1] && (
                <Separator className="my-4" />
              )}
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
};
