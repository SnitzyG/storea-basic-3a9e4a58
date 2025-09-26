import { cn } from '@/lib/utils';
import { useLocation, Link } from 'react-router-dom';
import { BarChart3, FolderOpen, FileStack, MessageSquare, HelpCircle, Briefcase, TestTube, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTabNotifications } from '@/hooks/useTabNotifications';
import { useState } from 'react';
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const {
    counts,
    markTabAsRead
  } = useTabNotifications();
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
  
  const sidebarWidth = isCollapsed && !isHovered ? 'w-16' : 'w-64';
  const isExpanded = !isCollapsed || isHovered;
  
  return <div 
    className={cn(
      "bg-sidebar-background border-r border-sidebar-border flex flex-col transition-all duration-300 relative group",
      sidebarWidth
    )}
    onMouseEnter={() => setIsHovered(true)}
    onMouseLeave={() => setIsHovered(false)}
  >
      {/* Collapse/Expand Button */}
      <div className="absolute top-4 right-2 z-10">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 rounded-md hover:bg-sidebar-accent/50 transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-sidebar-foreground" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-sidebar-foreground" />
          )}
        </button>
      </div>

      <div className={cn("p-6 border-b border-sidebar-border transition-all duration-300", !isExpanded && "p-2")}>
        <div className={cn("flex items-center space-x-3 transition-all duration-300", !isExpanded && "justify-center")}>
          {/* STOREALite text - hidden when collapsed */}
          {isExpanded && (
            <div className="flex-shrink-0 transition-all duration-300">
              <h1 className="text-xl font-bold tracking-wider">
                <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent font-black">
                  STOREA
                </span>
                <span className="bg-gradient-to-r from-accent to-accent/70 bg-clip-text text-transparent font-light ml-1">
                  Lite
                </span>
              </h1>
            </div>
          )}
          
          {/* Collapsed state - show just first letter */}
          {!isExpanded && (
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">S</span>
              </div>
            </div>
          )}
          
          {/* Company logo - shown for non-homeowners when expanded */}
          {showCompanyLogo && isExpanded && (
            <div className="flex flex-col items-end flex-shrink-0 min-w-0 transition-all duration-300">
              {profile.company_name && (
                <p className="text-xs text-muted-foreground mt-1 text-right truncate max-w-[80px]">
                  {profile.company_name}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <nav className={cn("flex-1 transition-all duration-300", isExpanded ? "p-4" : "p-2")}>
        <div className="space-y-2">
          {visibleTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = location.pathname.startsWith(tab.path);
          const isDisabled = ['tenders', 'financials'].includes(tab.id);
          const hasNotification = counts[tab.id] && counts[tab.id] > 0;
          
          if (isDisabled) {
            return <div 
              key={tab.id} 
              className={cn(
                "flex items-center rounded-lg text-sm font-medium text-muted-foreground cursor-not-allowed opacity-50 transition-all duration-300",
                isExpanded ? "justify-between px-4 py-3" : "justify-center px-2 py-3"
              )}
              title={!isExpanded ? tab.label : undefined}
            >
              <div className={cn("flex items-center transition-all duration-300", isExpanded ? "gap-3" : "")}>
                <Icon className="h-5 w-5 flex-shrink-0" />
                {isExpanded && (
                  <>
                    <span className="transition-all duration-300">{tab.label}</span>
                  </>
                )}
              </div>
              {isExpanded && <span className="text-xs text-muted-foreground">Coming Soon</span>}
            </div>;
          }
          
          return <Link 
            key={tab.id} 
            to={tab.path} 
            className={cn(
              "flex items-center rounded-lg text-sm font-medium transition-all duration-300 relative",
              isExpanded ? "gap-3 px-4 py-3" : "justify-center px-2 py-3",
              isActive 
                ? "bg-sidebar-accent text-sidebar-accent-foreground" 
                : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground dark:text-white"
            )}
            title={!isExpanded ? tab.label : undefined}
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            {isExpanded && (
              <span className="transition-all duration-300 truncate">{tab.label}</span>
            )}
            {hasNotification && (
              <Badge 
                className={cn(
                  "transition-all duration-300",
                  isExpanded 
                    ? "ml-auto" 
                    : "absolute -top-1 -right-1 h-4 w-4 p-0 text-xs"
                )}
                variant="destructive"
              >
                {isExpanded ? counts[tab.id] : ""}
              </Badge>
            )}
          </Link>;
        })}
        </div>
      </nav>
    </div>;
};