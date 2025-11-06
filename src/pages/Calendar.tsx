import React from 'react';
import { CalendarWidget } from '@/components/dashboard/CalendarWidget';
import { useProjectSelection } from '@/context/ProjectSelectionContext';
import { StorealiteLogo } from '@/components/ui/storealite-logo';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function Calendar() {
  const { selectedProject, availableProjects } = useProjectSelection();
  
  if (availableProjects.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <div className="mb-6">
              <StorealiteLogo className="text-5xl" />
            </div>
            
            <h3 className="text-lg font-semibold mb-2">Calendar</h3>
            <p className="text-muted-foreground mb-4">
              No projects available. Create a project or join a project first to use Calendar.
            </p>
            <Button asChild>
              <Link to="/projects">Go to Projects</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
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
