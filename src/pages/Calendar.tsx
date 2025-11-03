import React from 'react';
import { CalendarWidget } from '@/components/dashboard/CalendarWidget';
import { useProjectSelection } from '@/context/ProjectSelectionContext';

export default function Calendar() {
  const { selectedProject } = useProjectSelection();
  
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Calendar</h1>
        <p className="text-muted-foreground mt-2">
          Manage your schedule, events, and meetings
        </p>
      </div>
      
      <div className="h-[calc(100vh-12rem)]">
        <CalendarWidget selectedProjectFilter={selectedProject?.id || 'all'} />
      </div>
    </div>
  );
}
