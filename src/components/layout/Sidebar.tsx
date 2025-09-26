import { cn } from '@/lib/utils';
import { useLocation, Link } from 'react-router-dom';
import { BarChart3, FolderOpen, FileStack, MessageSquare, HelpCircle, Briefcase, TestTube, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTabNotifications } from '@/hooks/useTabNotifications';
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
      label: 'Mail',
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
  const showCompanyLogo = userRole !== 'homeowner' && profile?.company_logo_url;
  
  return <div className="w-64 bg-sidebar-background border-r border-sidebar-border flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center justify-center">
          {showCompanyLogo ? (
            <div className="relative w-full h-24 rounded-lg bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 border border-primary/20 flex flex-col items-center justify-center p-4">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 rounded-lg animate-pulse"></div>
              
              <div className="relative z-10 flex flex-col items-center w-full">
                <img 
                  src={profile.company_logo_url} 
                  alt={profile.company_name || "Company Logo"} 
                  className="h-18 w-auto max-w-full object-contain drop-shadow-sm"
                />
                {profile.company_name && (
                  <p className="text-sm font-medium text-foreground mt-2 text-center truncate w-full">
                    {profile.company_name}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div>
              <h1 className="text-xl font-bold tracking-wider text-center">
                <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent font-black">
                  STOREA
                </span>
                <span className="bg-gradient-to-r from-accent to-accent/70 bg-clip-text text-transparent font-light ml-1">
                  Lite
                </span>
              </h1>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {visibleTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = location.pathname.startsWith(tab.path);
          const isDisabled = ['tenders', 'financials'].includes(tab.id);
          
          if (isDisabled) {
            return <div 
              key={tab.id} 
              className="flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground cursor-not-allowed opacity-50"
            >
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5" />
                {tab.label}
              </div>
              <span className="text-xs text-muted-foreground">Coming Soon</span>
            </div>;
          }
          
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

      {/* STOREALite text at bottom for company users */}
      {showCompanyLogo && (
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center justify-center">
            <h2 className="text-lg font-bold tracking-wider">
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent font-black">
                STOREA
              </span>
              <span className="bg-gradient-to-r from-accent to-accent/70 bg-clip-text text-transparent font-light ml-1">
                Lite
              </span>
            </h2>
          </div>
        </div>
      )}
    </div>;
};