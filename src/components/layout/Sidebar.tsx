import { cn } from '@/lib/utils';
import { useLocation, Link } from 'react-router-dom';
import { 
  FolderOpen, 
  FileStack, 
  MessageSquare, 
  HelpCircle, 
  Briefcase
} from 'lucide-react';

interface SidebarProps {
  userRole: 'architect' | 'builder' | 'homeowner' | 'contractor';
}

export const Sidebar = ({ userRole }: SidebarProps) => {
  const location = useLocation();

  const getVisibleTabs = (role: string) => {
    const allTabs = [
      { id: 'projects', label: 'Projects', icon: FolderOpen, path: '/projects' },
      { id: 'tenders', label: 'Tenders', icon: Briefcase, path: '/tenders' },
      { id: 'documents', label: 'Documents', icon: FileStack, path: '/documents' },
      { id: 'messages', label: 'Messages', icon: MessageSquare, path: '/messages' },
      { id: 'rfis', label: 'RFIs', icon: HelpCircle, path: '/rfis' }
    ];

    switch (role) {
      case 'architect':
        return allTabs; // Full access
      case 'builder':
        return allTabs; // Full access
      case 'homeowner':
        return allTabs.filter(tab => !['tenders'].includes(tab.id)); // No tenders for homeowners
      case 'contractor':
        return allTabs; // Full access
      default:
        return allTabs;
    }
  };

  const visibleTabs = getVisibleTabs(userRole);

  return (
    <div className="w-64 bg-sidebar-background border-r border-sidebar-border flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div>
            <h1 className="text-xl font-bold text-sidebar-foreground">STOREA</h1>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = location.pathname.startsWith(tab.path);
            
            return (
              <Link
                key={tab.id}
                to={tab.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-sidebar-border">
        <div className="text-xs text-sidebar-foreground/50 capitalize">
          Role: {userRole}
        </div>
      </div>
    </div>
  );
};