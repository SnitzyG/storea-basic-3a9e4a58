import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { StorealiteLogo } from '@/components/ui/storealite-logo';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import {
  LayoutDashboard,
  Users,
  FileText,
  Shield,
  Settings,
  Activity,
  Monitor,
  AlertCircle,
} from 'lucide-react';

export function AdminSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === 'collapsed';
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [criticalAlerts, setCriticalAlerts] = useState(0);

  const isActive = (path: string) => currentPath === path;

  // Fetch notification counts
  useEffect(() => {
    const fetchCounts = async () => {
      // Pending approvals
      const { count: approvalCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('approved', false);
      setPendingApprovals(approvalCount || 0);

      // Critical alerts
      const { count: alertCount } = await supabase
        .from('admin_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('severity', 'critical')
        .is('resolved_at', null);
      setCriticalAlerts(alertCount || 0);
    };

    fetchCounts();

    // Real-time updates
    const channel = supabase
      .channel('sidebar-counts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchCounts)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_alerts' }, fetchCounts)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const navSections = [
    {
      label: 'Overview',
      items: [
        { title: 'Dashboard', url: '/admin/dashboard', icon: LayoutDashboard },
        { title: 'User Management', url: '/admin/users', icon: Users },
        { title: 'System Activity', url: '/admin/activity', icon: Activity },
        { title: 'Audit Logs', url: '/admin/logs', icon: FileText },
        { title: 'System Alerts', url: '/admin/alerts', icon: Monitor, badge: criticalAlerts },
      ],
    },
    {
      label: 'Administration',
      items: [
        { title: 'User Approvals', url: '/admin/approvals', icon: Shield, badge: pendingApprovals },
        { title: 'Settings', url: '/admin/settings', icon: Settings },
      ],
    },
  ];

  return (
    <Sidebar className={collapsed ? 'w-14' : 'w-64'} collapsible="icon">
      <SidebarContent>
        {/* Logo Section */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            {!collapsed && <StorealiteLogo className="h-8" />}
            <div className={`rounded-full bg-gradient-to-br from-primary/20 to-primary-glow/10 p-2 ${collapsed ? 'mx-auto' : ''}`}>
              <Shield className="h-5 w-5 text-primary" />
            </div>
          </div>
          {!collapsed && (
            <p className="text-sm text-muted-foreground mt-2">Admin Portal</p>
          )}
        </div>

        {/* Navigation Sections */}
        {navSections.map((section) => (
          <SidebarGroup key={section.label}>
            {!collapsed && <SidebarGroupLabel>{section.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink
                        to={item.url}
                        className="flex items-center gap-3 relative"
                      >
                        <item.icon className="h-4 w-4" />
                        {!collapsed && (
                          <div className="flex items-center justify-between flex-1">
                            <span>{item.title}</span>
                            {item.badge && item.badge > 0 && (
                              <Badge variant="destructive" className="ml-auto text-xs h-5 min-w-5 px-1">
                                {item.badge > 99 ? '99+' : item.badge}
                              </Badge>
                            )}
                          </div>
                        )}
                        {collapsed && item.badge && item.badge > 0 && (
                          <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive animate-pulse" />
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
