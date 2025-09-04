import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Search, Moon, Sun, Command } from 'lucide-react';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { OpenRFIs } from '@/components/dashboard/OpenRFIs';
import { OpenMessages } from '@/components/dashboard/OpenMessages';
import { ActionableDocuments } from '@/components/dashboard/ActionableDocuments';
import { ToDoList } from '@/components/dashboard/ToDoList';
import { LocationInfo } from '@/components/dashboard/LocationInfo';
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

  const userName = profile?.name || 'User';

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
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

      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1 - Recent Activity */}
          <div className="space-y-4">
            <RecentActivity />
          </div>
          
          {/* Column 2 - Open Documents, Messages & RFIs */}
          <div className="space-y-4">
            <ActionableDocuments />
            <OpenMessages />
            <OpenRFIs />
          </div>
          
          {/* Column 3 - Location Info & To-Do */}
          <div className="space-y-4">
            <LocationInfo />
            <ToDoList />
          </div>
        </div>
      </div>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
};

export default Dashboard;