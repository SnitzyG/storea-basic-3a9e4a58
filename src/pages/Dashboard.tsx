import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Search, Moon, Sun, MessageSquare, FileText, Upload } from 'lucide-react';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { ToDoList } from '@/components/dashboard/ToDoList';
import { InfoPanel } from '@/components/dashboard/InfoPanel';
import { CalendarWidget } from '@/components/dashboard/CalendarWidget';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
const Dashboard = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const {
    theme,
    toggleTheme
  } = useTheme();
  const {
    profile
  } = useAuth();
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
  return <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-card px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {userName}</h1>
            <p className="text-muted-foreground">Here's what's happening with your projects today.</p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Quick Action Shortcuts (non-functional placeholders) */}
            <Button size="sm" variant="outline" className="gap-1 text-xs px-2 py-1" onClick={() => navigate('/messages')}>
              <MessageSquare className="h-4 w-4" />
              Message
            </Button>
            <Button size="sm" variant="outline" className="gap-1 text-xs px-2 py-1" onClick={() => navigate('/rfis', {
            state: {
              openCreate: true
            }
          })}>
              <FileText className="h-4 w-4" />
              RFI
            </Button>
            <Button size="sm" variant="outline" className="gap-1 text-xs px-2 py-1" onClick={() => navigate('/documents', {
            state: {
              openUpload: true
            }
          })}>
              <Upload className="h-4 w-4" />
              Upload
            </Button>

            <Button variant="outline" onClick={() => setSearchOpen(true)} className="gap-2">
              <Search className="h-4 w-4" />
              Search
            </Button>
            
            
            
            <NotificationCenter />
          </div>
        </div>
      </div>

      {/* Main Dashboard Content - Optimized Single Page Layout */}
      <div className="flex-1 p-4 overflow-hidden">
        <div className="h-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {/* Recent Activity */}
          <div className="col-span-1 h-full">
            <RecentActivity />
          </div>

          {/* Calendar */}
          <div className="col-span-1 h-full">
            <CalendarWidget />
          </div>

          {/* To-Do List */}
          <div className="col-span-1 h-full">
            <ToDoList />
          </div>

          {/* Info Panel / Team Members */}
          <div className="col-span-1 h-full">
            <InfoPanel />
          </div>
        </div>
      </div>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>;
};
export default Dashboard;