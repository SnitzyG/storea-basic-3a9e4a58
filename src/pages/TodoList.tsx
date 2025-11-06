import React from 'react';
import { ToDoList } from '@/components/dashboard/ToDoList';
import { useProjectSelection } from '@/context/ProjectSelectionContext';
import { StorealiteLogo } from '@/components/ui/storealite-logo';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function TodoList() {
  const { selectedProject, availableProjects } = useProjectSelection();
  
  if (availableProjects.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <div className="mb-6">
              <StorealiteLogo className="text-5xl" />
            </div>
            
            <h3 className="text-lg font-semibold mb-2">To-Do List</h3>
            <p className="text-muted-foreground mb-4">
              No projects available. Create a project or join a project first to use To-Do List.
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
        <h1 className="text-3xl font-bold">To-Do List</h1>
        <p className="text-muted-foreground mt-2">
          Track and manage all your tasks and action items
        </p>
      </div>
      
      <div className="h-[calc(100vh-12rem)]">
        <ToDoList selectedProjectFilter={selectedProject?.id || 'all'} />
      </div>
    </div>
  );
}
