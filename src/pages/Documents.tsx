import React, { useState, useMemo, useEffect } from 'react';
import { Upload, Building } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDocuments, Document } from '@/hooks/useDocuments';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { DocumentManager } from '@/components/documents/DocumentManager';
const Documents = () => {
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const { projects } = useProjects();
  const location = useLocation();
  // Auto-open upload dialog when navigated with state
  useEffect(() => {
    if ((location.state as any)?.openUpload) {
      // Handle upload dialog opening if needed
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);
  return (
    <div className="space-y-6 mx-[25px]">
      {/* Project Selector */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Document Management</h1>
          <p className="text-muted-foreground">
            Professional document control and collaboration system
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="min-w-[200px]">
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger>
                <SelectValue placeholder="Select Project">
                  {selectedProject === 'all' ? 'All Projects' : 
                   projects.find(p => p.id === selectedProject)?.name || 'Select Project'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Enhanced Document Manager */}
      <DocumentManager selectedProject={selectedProject} />
    </div>
  );
};
export default Documents;