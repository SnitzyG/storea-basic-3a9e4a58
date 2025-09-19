import { cn } from '@/lib/utils';
import { useLocation, Link } from 'react-router-dom';
import { BarChart3, FolderOpen, FileStack, MessageSquare, HelpCircle, Briefcase, TestTube, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTabNotifications } from '@/hooks/useTabNotifications';
interface SidebarProps {
  userRole: 'architect' | 'builder' | 'homeowner' | 'contractor';
}
export const Sidebar = ({
  userRole
}: SidebarProps) => {
  const location = useLocation();
  const { counts, markTabAsRead } = useTabNotifications();
  const getVisibleTabs = (role: string) => {
    const allTabs = [{
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      path: '/dashboard'
    }, {
      id: 'projects',
      label: 'Projects',
      icon: FolderOpen,
      path: '/projects'
    }, {
      id: 'messages',
      label: 'Messages',
      icon: MessageSquare,
      path: '/messages'
    }, {
      id: 'documents',
      label: 'Documents',
      icon: FileStack,
      path: '/documents'
    }, {
      id: 'rfis',
      label: 'RFIs',
      icon: HelpCircle,
      path: '/rfis'
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
    }];
    switch (role) {
      case 'architect':
        return allTabs;
      // Full access
      case 'builder':
        return allTabs;
      // Full access
      case 'homeowner':
        return allTabs.filter(tab => !['tenders'].includes(tab.id));
      // No tenders for homeowners
      case 'contractor':
        return allTabs;
      // Full access
      default:
        return allTabs;
    }
  };
  const visibleTabs = getVisibleTabs(userRole);
  return <div className="w-64 bg-sidebar-background border-r border-sidebar-border flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2 mx-0 px-[50px]">
          <div>
            <h1 className="text-xl font-bold tracking-wider">
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent font-black">
                STOREA
              </span>
              <span className="bg-gradient-to-r from-accent to-accent/70 bg-clip-text text-transparent font-light ml-1">
                Lite
              </span>
            </h1>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {visibleTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = location.pathname.startsWith(tab.path);
          return <Link 
            key={tab.id} 
            to={tab.path} 
            className={cn("flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors", isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground dark:text-white")}
          >
                <Icon className="h-5 w-5" />
                {tab.label}
              </Link>;
        })}
        </div>
      </nav>

      
    </div>;
};