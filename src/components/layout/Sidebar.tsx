import { cn } from '@/lib/utils';
import { useLocation, Link } from 'react-router-dom';
import { BarChart3, FolderOpen, FileStack, MessageSquare, HelpCircle, Briefcase, TestTube, DollarSign, CalendarDays, CheckSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTabNotifications } from '@/hooks/useTabNotifications';
import { StorealiteLogo } from '@/components/ui/storealite-logo';
interface SidebarProps {
  userRole: 'architect' | 'builder' | 'homeowner' | 'contractor';
  profile?: {
    company_logo_url?: string;
    company_name?: string;
  };
}
export const Sidebar = ({
  userRole,
  profile
}: SidebarProps) => {
  const location = useLocation();
  const {
    counts,
    markTabAsRead
  } = useTabNotifications();
  const getVisibleTabs = (role: string) => {
    const allTabs = [{
      id: 'dashboard',
      label: 'Home',
      icon: BarChart3,
      path: '/dashboard'
    }, {
      id: 'projects',
      label: 'Projects',
      icon: FolderOpen,
      path: '/projects'
    }, {
      id: 'calendar',
      label: 'Calendar',
      icon: CalendarDays,
      path: '/calendar'
    }, {
      id: 'todo-list',
      label: 'To-Do List',
      icon: CheckSquare,
      path: '/todo-list'
    }, {
      id: 'documents',
      label: 'Documents',
      icon: FileStack,
      path: '/documents'
    }, {
      id: 'messages',
      label: 'Messages',
      icon: MessageSquare,
      path: '/messages'
    }, {
      id: 'tenders',
      label: 'Tenders',
      icon: Briefcase,
      path: '/tenders'
    }, {
      id: 'financials',
      label: 'Financials',
      icon: DollarSign,
      path: '/financials'
    }, {
      id: 'rfis',
      label: 'Mail',
      icon: HelpCircle,
      path: '/rfis'
    }];
    switch (role) {
      case 'architect':
        return allTabs;
      // Full access
      case 'builder':
        return allTabs;
      // Full access
      case 'homeowner':
        return allTabs; // Give homeowners access to all tabs
      // No tenders for homeowners
      case 'contractor':
        return allTabs;
      // Full access
      default:
        return allTabs;
    }
  };
  const visibleTabs = getVisibleTabs(userRole);
  const showCompanyLogo = userRole !== 'homeowner' && profile?.company_logo_url;
  return <div className="w-64 bg-sidebar-background border-r border-sidebar-border flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center justify-center space-x-2">
          <StorealiteLogo className="h-8" />
          
          {/* Company logo - shown for non-homeowners */}
          {showCompanyLogo && <div className="flex flex-col items-end flex-shrink-0 min-w-0">
              {profile.company_name && <p className="text-xs text-muted-foreground mt-1 text-right truncate max-w-[80px]">
                  {profile.company_name}
                </p>}
            </div>}
        </div>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {visibleTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = location.pathname.startsWith(tab.path);
          const notificationCount = counts[tab.id as keyof typeof counts];
          
          return <Link key={tab.id} to={tab.path} className={cn("flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors", isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground dark:text-white")} onClick={() => {
            markTabAsRead(tab.id);
          }}>
                <Icon className="h-5 w-5" />
                {tab.label}
                {notificationCount > 0 && <Badge variant="secondary" className="ml-auto h-5 min-w-5 px-1 text-xs">
                    {notificationCount}
                  </Badge>}
              </Link>;
        })}
        </div>
      </nav>
    </div>;
};