import React from 'react';
import { ToDoList } from '@/components/dashboard/ToDoList';
import { useProjectSelection } from '@/context/ProjectSelectionContext';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
export default function TodoList() {
  const {
    selectedProject,
    availableProjects
  } = useProjectSelection();
  return <div className="container mx-auto p-6 max-w-7xl">
      
      
      <div className="h-[calc(100vh-12rem)]">
        <ToDoList selectedProjectFilter={selectedProject?.id || 'all'} />
      </div>
    </div>;
}