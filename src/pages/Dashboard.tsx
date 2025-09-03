import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Search, Moon, Sun, Command } from 'lucide-react';
import { DashboardAnalytics } from '@/components/dashboard/DashboardAnalytics';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { OpenRFIs } from '@/components/dashboard/OpenRFIs';
import { OpenMessages } from '@/components/dashboard/OpenMessages';
import { ActionableDocuments } from '@/components/dashboard/ActionableDocuments';
import { ToDoList } from '@/components/dashboard/ToDoList';
import { InfoPanel } from '@/components/dashboard/InfoPanel';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { UserProfile } from '@/components/profile/UserProfile';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/useAuth';

const Dashboard = () => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
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
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground ml-auto">
              <Command className="h-3 w-3" />K
            </kbd>
          </Button>
          
          <Button variant="outline" size="sm" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          
          <NotificationCenter />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Left Column - Main Content */}
            <div className="xl:col-span-2 space-y-6">
              <RecentActivity />
              <QuickActions />
              <OpenRFIs />
            </div>
            
            {/* Middle Column - Messages & Documents */}
            <div className="space-y-6">
              <OpenMessages />
              <ActionableDocuments />
            </div>
            
            {/* Right Column - To-Do & Info */}
            <div className="space-y-6">
              <ToDoList />
              <InfoPanel />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics"><DashboardAnalytics /></TabsContent>
        <TabsContent value="activity">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentActivity />
            <QuickActions />
          </div>
        </TabsContent>
        <TabsContent value="profile"><UserProfile /></TabsContent>
      </Tabs>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
};

export default Dashboard;