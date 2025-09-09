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
  const { theme, toggleTheme } = useTheme();
  const { profile } = useAuth();
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
    <div className="h-screen flex flex-col bg-background overflow-hidden text-sm">
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-card px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {userName}</h1>
            <p className="text-muted-foreground">Here's what's happening with your projects today.</p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Quick Action Shortcuts */}
            <Button size="sm" variant="outline" className="gap-1 text-xs px-2 py-1" onClick={() => navigate('/messages')}>
              <MessageSquare className="h-4 w-4" />
              Message
            </Button>
            <Button size="sm" variant="outline" className="gap-1 text-xs px-2 py-1" onClick={() => navigate('/rfis', { state: { openCreate: true } })}>
              <FileText className="h-4 w-4" />
              RFI
            </Button>
            <Button size="sm" variant="outline" className="gap-1 text-xs px-2 py-1" onClick={() => navigate('/documents', { state: { openUpload: true } })}>
              <Upload className="h-4 w-4" />
              Upload
            </Button>

            <Button variant="outline" onClick={() => setSearchOpen(true)} className="gap-2">
              <Search className="h-4 w-4" />
              Search
            </Button>
            
            <Button variant="outline" size="sm" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            
            <NotificationCenter />
          </div>
        </div>
      </div>

      {/* Main Dashboard Content - Single Screen Responsive Grid */}
      <div className="flex-1 p-2 overflow-hidden">
        <div className="h-full grid grid-cols-12 gap-2 auto-rows-[1fr]">
          {/* Standardized 2x2 equal sizing */}
          <div className="col-span-12 md:col-span-6 min-h-0">
            <div className="h-full">
              <RecentActivity />
            </div>
          </div>

          <div className="col-span-12 md:col-span-6 min-h-0">
            <div className="h-full">
              <CalendarWidget />
            </div>
          </div>

          <div className="col-span-12 md:col-span-6 min-h-0">
            <div className="h-full">
              <ToDoList />
            </div>
          </div>

          <div className="col-span-12 md:col-span-6 min-h-0">
            <div className="h-full">
              <InfoPanel />
            </div>
          </div>
        </div>
      </div>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
};

export default Dashboard;