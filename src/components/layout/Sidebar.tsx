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
          {/* House logo icon */}
          <svg width="32" height="32" viewBox="0 0 48 48" className="flex-shrink-0">
            <defs>
              <linearGradient id="sidebarLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(215, 45%, 25%)" />
                <stop offset="100%" stopColor="hsl(40, 85%, 60%)" />
              </linearGradient>
            </defs>
            <path d="M 24 8 L 8 20 L 8 40 L 20 40 L 20 28 L 28 28 L 28 40 L 40 40 L 40 20 Z" fill="url(#sidebarLogoGradient)" />
            <polygon points="24,4 4,20 8,20 24,8 40,20 44,20" fill="hsl(40, 85%, 60%)" />
            <rect x="22" y="32" width="4" height="8" fill="hsl(40, 85%, 60%)" />
          </svg>
          
          {/* Storealite text */}
          <h1 className="text-xl font-bold tracking-tight leading-none">
            <span style={{ 
              background: 'linear-gradient(135deg, hsl(215, 45%, 25%), hsl(215, 45%, 35%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: 800,
              letterSpacing: '-0.02em'
            }}>
              Storea
            </span>
            <span style={{ 
              background: 'linear-gradient(135deg, hsl(40, 85%, 60%), hsl(45, 90%, 70%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: 300,
              letterSpacing: '0.05em'
            }}>
              lite
            </span>
          </h1>
          
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
          
          const isComingSoon = tab.id === 'financials';
          
          if (isComingSoon) {
            return <div key={tab.id} className={cn("flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium cursor-not-allowed opacity-50")}>
                  <Icon className="h-5 w-5" />
                  {tab.label}
                  <Badge variant="outline" className="ml-auto text-xs">
                    Coming Soon
                  </Badge>
                </div>;
          }
          
          return <Link key={tab.id} to={tab.path} className={cn("flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors", isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground dark:text-white")} onClick={() => markTabAsRead(tab.id)}>
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