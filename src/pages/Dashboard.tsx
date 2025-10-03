import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Search, MessageSquare, FileText, Upload, FolderOpen, Filter } from 'lucide-react';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { ToDoList } from '@/components/dashboard/ToDoList';
import { InfoPanel } from '@/components/dashboard/InfoPanel';
import { CalendarWidget } from '@/components/dashboard/CalendarWidget';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import { useProjectSelection } from '@/context/ProjectSelectionContext';
const Dashboard = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('all');
  const { theme, toggleTheme } = useTheme();
  const { profile } = useAuth();
  const { projects } = useProjects();
  const { selectedProject, availableProjects } = useProjectSelection();
  const navigate = useNavigate();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
  const userName = profile?.name || 'username';

  return (
    <div className="space-y-6 mx-[25px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div></div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Project Filter */}
          <div className="flex items-center gap-2 mr-4">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedProjectFilter} onValueChange={setSelectedProjectFilter}>
              <SelectTrigger className="w-40 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {availableProjects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            size="sm" 
            variant="outline" 
            className="gap-1 text-xs px-3 py-2 h-8" 
            onClick={() => navigate('/messages')}
          >
            <MessageSquare className="h-3 w-3" />
            <span className="hidden sm:inline">Message</span>
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="gap-1 text-xs px-3 py-2 h-8" 
            onClick={() => navigate('/rfis', { state: { openCreate: true } })}
          >
            <FileText className="h-3 w-3" />
            <span className="hidden sm:inline">RFI</span>
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="gap-1 text-xs px-3 py-2 h-8" 
            onClick={() => navigate('/documents', { state: { openUpload: true } })}
          >
            <Upload className="h-3 w-3" />
            <span className="hidden sm:inline">Upload</span>
          </Button>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Recent Activity */}
            <div>
              <RecentActivity selectedProjectFilter={selectedProjectFilter} />
            </div>

            {/* Calendar Widget */}
            <div>
              <CalendarWidget selectedProjectFilter={selectedProjectFilter} />
            </div>

            {/* To-Do List */}
            <div>
              <ToDoList selectedProjectFilter={selectedProjectFilter} />
            </div>

            {/* Info Panel */}
            <div>
              <InfoPanel selectedProjectFilter={selectedProjectFilter} />
            </div>
            
          </div>
        </div>
      </div>

      {/* Global Search Component */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
};
export default Dashboard;