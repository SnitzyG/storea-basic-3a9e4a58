import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { 
  BarChart3, 
  FolderOpen, 
  FileStack, 
  MessageSquare, 
  HelpCircle, 
  Briefcase, 
  DollarSign,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useTabNotifications } from "@/hooks/useTabNotifications";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface AppSidebarProps {
  userRole: 'architect' | 'builder' | 'homeowner' | 'contractor';
}

export function AppSidebar({ userRole }: AppSidebarProps) {
  const location = useLocation();
  const { state } = useSidebar();
  const { counts, markTabAsRead } = useTabNotifications();
  const [isMainGroupOpen, setIsMainGroupOpen] = useState(true);

  const getVisibleTabs = (role: string) => {
    const allTabs = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: BarChart3,
        path: '/dashboard'
      },
      {
        id: 'projects',
        label: 'Projects',
        icon: FolderOpen,
        path: '/projects'
      },
      {
        id: 'messages',
        label: 'Messages',
        icon: MessageSquare,
        path: '/messages'
      },
      {
        id: 'documents',
        label: 'Documents',
        icon: FileStack,
        path: '/documents'
      },
      {
        id: 'rfis',
        label: 'Mail',
        icon: HelpCircle,
        path: '/rfis'
      },
      {
        id: 'tenders',
        label: 'Tenders',
        icon: Briefcase,
        path: '/tenders'
      },
      {
        id: 'financials',
        label: 'Financials',
        icon: DollarSign,
        path: '/financials'
      }
    ];

    switch (role) {
      case 'architect':
        return allTabs;
      case 'builder':
        return allTabs;
      case 'homeowner':
        return allTabs.filter(tab => !['tenders'].includes(tab.id));
      case 'contractor':
        return allTabs;
      default:
        return allTabs;
    }
  };

  const visibleTabs = getVisibleTabs(userRole);
  const currentPath = location.pathname;

  // Keep group open if any of its items is active
  const isExpanded = visibleTabs.some((tab) => currentPath.startsWith(tab.path));

  const getNavClassName = (path: string) => {
    const isActive = currentPath.startsWith(path);
    return isActive 
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
      : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground";
  };

  return (
    <Sidebar 
      className={cn(
        "transition-all duration-300 ease-in-out",
        state === "collapsed" ? "w-14" : "w-64"
      )}
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-2">
          {state !== "collapsed" && (
            <div className="flex items-center justify-center w-full">
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
          {state === "collapsed" && (
            <div className="flex items-center justify-center w-full">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SL</span>
              </div>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            {state !== "collapsed" && "Navigation"}
            {state !== "collapsed" && (
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform duration-200",
                (isExpanded || isMainGroupOpen) ? "transform rotate-0" : "transform -rotate-90"
              )} />
            )}
          </SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleTabs.map((tab) => {
                const Icon = tab.icon;
                const isDisabled = ['tenders', 'financials'].includes(tab.id);
                
                if (isDisabled) {
                  return (
                    <SidebarMenuItem key={tab.id}>
                      <SidebarMenuButton
                        className="opacity-50 cursor-not-allowed"
                        disabled
                      >
                        <Icon className="h-5 w-5" />
                        {state !== "collapsed" && (
                          <>
                            <span>{tab.label}</span>
                            <span className="ml-auto text-xs text-muted-foreground">
                              Soon
                            </span>
                          </>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }

                return (
                  <SidebarMenuItem key={tab.id}>
                    <SidebarMenuButton
                      asChild
                      className={getNavClassName(tab.path)}
                    >
                      <Link to={tab.path}>
                        <Icon className="h-5 w-5" />
                        {state !== "collapsed" && <span>{tab.label}</span>}
                        {state !== "collapsed" && counts[tab.id] > 0 && (
                          <Badge 
                            variant="destructive" 
                            className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-xs"
                          >
                            {counts[tab.id]}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
