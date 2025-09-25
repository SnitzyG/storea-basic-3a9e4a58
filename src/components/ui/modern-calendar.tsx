import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';

interface ModernCalendarProps {
  selected?: Date;
  onSelect?: (date: Date) => void;
  mode?: 'single';
  className?: string;
  initialFocus?: boolean;
}

export const ModernCalendar: React.FC<ModernCalendarProps> = ({
  selected,
  onSelect,
  mode = 'single',
  className,
  initialFocus = false
}) => {
  const [currentMonth, setCurrentMonth] = useState(selected || new Date());
  const today = new Date();

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentMonth(subMonths(currentMonth, 1));
    } else {
      setCurrentMonth(addMonths(currentMonth, 1));
    }
  };

  const generateCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  };

  const handleDateClick = (date: Date) => {
    if (onSelect) {
      onSelect(date);
    }
  };

  const calendarDays = generateCalendarDays();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={cn("bg-background border border-border rounded-lg shadow-md p-6 w-full max-w-md", className)}>
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-border">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigateMonth('prev')}
          className="h-8 w-8 rounded-md hover:bg-muted transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <h2 className="text-lg font-semibold text-foreground">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigateMonth('next')}
          className="h-8 w-8 rounded-md hover:bg-muted transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((dayName) => (
          <div
            key={dayName}
            className="text-center text-sm font-medium text-muted-foreground py-2 bg-muted/30 rounded-sm"
          >
            {dayName}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date) => {
          const isCurrentMonth = isSameMonth(date, currentMonth);
          const isToday = isSameDay(date, today);
          const isSelected = selected && isSameDay(date, selected);

          return (
            <button
              key={date.toISOString()}
              onClick={() => handleDateClick(date)}
              className={cn(
                "h-10 w-10 text-center text-sm font-normal rounded-sm transition-all duration-200 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
                {
                  // Current month dates
                  "text-foreground": isCurrentMonth,
                  // Other month dates (muted)
                  "text-muted-foreground opacity-50": !isCurrentMonth,
                  // Today's date (bright green background with white text)
                  "bg-green-500 text-white font-semibold hover:bg-green-600": isToday && !isSelected,
                  // Selected date
                  "bg-primary text-primary-foreground font-semibold hover:bg-primary/90": isSelected,
                  // Hover effect for non-today, non-selected dates
                  "hover:bg-accent hover:text-accent-foreground": !isToday && !isSelected,
                }
              )}
            >
              {format(date, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
};
