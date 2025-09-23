import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, MessageSquare, FileText, Upload, FolderOpen } from 'lucide-react';
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
  const { theme, toggleTheme } = useTheme();
  const { profile } = useAuth();
  const { projects } = useProjects();
  const { selectedProject } = useProjectSelection();
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
    <div className="h-full flex flex-col bg-background">
      {/* Enhanced Header with Project Toggle */}
      <div className="flex-shrink-0 border-b bg-card">
        <div className="px-4 sm:px-6 py-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">Welcome back, {userName}</h1>
                  <p className="text-muted-foreground text-sm sm:text-base">
                    Here's what's happening with your projects today.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
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
        </div>
      </div>

      {/* Compact Dashboard Content - No Scroll Layout */}
      <div className="flex-1 p-2 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 h-full">
            
            {/* Recent Activity - Fixed compact height */}
            <div className="h-[calc(50vh-4rem)] min-h-[220px]">
              <RecentActivity />
            </div>

            {/* Calendar Widget - Fixed compact height */}
            <div className="h-[calc(50vh-4rem)] min-h-[220px]">
              <CalendarWidget />
            </div>

            {/* To-Do List - Fixed compact height */}
            <div className="h-[calc(50vh-4rem)] min-h-[220px]">
              <ToDoList />
            </div>

            {/* Info Panel - Fixed compact height */}
            <div className="h-[calc(50vh-4rem)] min-h-[220px]">
              <InfoPanel />
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