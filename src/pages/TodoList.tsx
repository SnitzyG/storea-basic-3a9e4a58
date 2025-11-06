import React from 'react';
import { ToDoList } from '@/components/dashboard/ToDoList';
import { useProjectSelection } from '@/context/ProjectSelectionContext';
import { NoProjectsDialog } from '@/components/ui/no-projects-dialog';

export default function TodoList() {
  const { selectedProject, availableProjects } = useProjectSelection();
  
  return (
    <>
      <NoProjectsDialog open={availableProjects.length === 0} />
      
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
    </>
  );
}
