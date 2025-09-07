import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Search, Moon, Sun } from 'lucide-react';
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
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-card px-6 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {userName}</h1>
            <p className="text-muted-foreground">Here's what's happening with your projects today.</p>
          </div>
          
          <div className="flex items-center gap-2">
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

      {/* Main Dashboard Content - Optimized Single Page Layout */}
      <div className="flex-1 p-4 overflow-hidden">
        <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Primary Section - Recent Activity */}
          <div className="lg:col-span-1 h-full">
            <RecentActivity />
          </div>
          
          {/* Secondary Section - Calendar */}
          <div className="lg:col-span-1 h-full">
            <CalendarWidget />
          </div>
          
          {/* Tertiary Section - To-Do List and Info Panel */}
          <div className="lg:col-span-1 h-full flex flex-col gap-4">
            <div className="flex-1 min-h-0">
              <ToDoList />
            </div>
            <div className="flex-1 min-h-0">
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