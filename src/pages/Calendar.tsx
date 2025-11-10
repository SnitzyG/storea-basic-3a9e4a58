import React from 'react';
import { CalendarWidget } from '@/components/dashboard/CalendarWidget';
import { useProjectSelection } from '@/context/ProjectSelectionContext';
import { StorealiteLogo } from '@/components/ui/storealite-logo';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
export default function Calendar() {
  const {
    selectedProject,
    availableProjects
  } = useProjectSelection();
  return <div className="container mx-auto p-6 max-w-7xl">
      
      
      <div className="h-[calc(100vh-12rem)]">
        <CalendarWidget selectedProjectFilter={selectedProject?.id || 'all'} />
      </div>
    </div>;
}