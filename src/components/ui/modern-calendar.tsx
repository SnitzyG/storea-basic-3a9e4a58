import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { cn } from '@/lib/utils';

interface ModernCalendarProps {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  className?: string;
}

export const ModernCalendar: React.FC<ModernCalendarProps> = ({
  selectedDate,
  onDateSelect,
  className
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => 
      direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  const handleDateClick = (date: Date) => {
    onDateSelect?.(date);
  };

  // Generate calendar grid
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd
  });

  // Ensure we always show 6 weeks (42 days)
  const weeksToShow = 6;
  const totalDaysNeeded = weeksToShow * 7;
  
  let displayDays = [...calendarDays];
  while (displayDays.length < totalDaysNeeded) {
    const lastDay = displayDays[displayDays.length - 1];
    displayDays.push(new Date(lastDay.getTime() + 24 * 60 * 60 * 1000));
  }
  displayDays = displayDays.slice(0, totalDaysNeeded);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={cn("bg-white rounded-xl shadow-lg border border-gray-200", className)}>
      {/* Header Section */}
      <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all duration-200 border border-transparent hover:border-gray-200"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>
        
        <h2 className="text-lg font-bold text-gray-800 tracking-tight">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all duration-200 border border-transparent hover:border-gray-200"
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="p-6">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((day) => (
            <div
              key={day}
              className="h-10 flex items-center justify-center text-sm font-medium text-gray-600 bg-gray-50 rounded-lg"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Date Grid */}
        <div className="grid grid-cols-7 gap-1">
          {displayDays.map((date, index) => {
            const isCurrentMonth = isSameMonth(date, currentMonth);
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            const isTodayDate = isToday(date);
            
            return (
              <button
                key={index}
                onClick={() => handleDateClick(date)}
                className={cn(
                  "h-12 flex items-center justify-center text-base font-normal rounded-lg transition-all duration-200 relative",
                  "hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1",
                  // Current month dates
                  isCurrentMonth && "text-gray-900",
                  // Other month dates (muted)
                  !isCurrentMonth && "text-gray-400",
                  // Today's date (bright green background)
                  isTodayDate && "bg-green-500 text-white font-semibold hover:bg-green-600",
                  // Selected date
                  isSelected && !isTodayDate && "bg-blue-500 text-white hover:bg-blue-600",
                  // Default hover for non-special dates
                  !isTodayDate && !isSelected && "hover:bg-gray-100"
                )}
                aria-label={format(date, 'EEEE, MMMM do, yyyy')}
              >
                {format(date, 'd')}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
