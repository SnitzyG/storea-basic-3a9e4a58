import React from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { CalendarEvent } from '@/hooks/useCalendarEvents';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

interface ConflictWarningProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflictingEvents: CalendarEvent[];
  onProceed: () => void;
}

export const ConflictWarning: React.FC<ConflictWarningProps> = ({
  open,
  onOpenChange,
  conflictingEvents,
  onProceed,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Schedule Conflict Detected
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>This event overlaps with {conflictingEvents.length} other event{conflictingEvents.length > 1 ? 's' : ''}:</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {conflictingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="p-2 border rounded-md bg-muted/50 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{event.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {format(parseISO(event.start_datetime), 'h:mm a')}
                      </Badge>
                    </div>
                    {event.description && (
                      <p className="text-xs text-muted-foreground">{event.description}</p>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-sm font-medium">Do you want to proceed anyway?</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onProceed}>
            Proceed Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
