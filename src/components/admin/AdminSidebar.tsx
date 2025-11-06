import { Shield, Users, Settings, BarChart3, Mail } from 'lucide-react';
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

const adminNavItems = [
  { title: 'Dashboard', url: '/admin/dashboard', icon: BarChart3 },
  { title: 'User Approvals', url: '/admin/approvals', icon: Users },
  { title: 'Email Monitoring', url: '/admin/emails', icon: Mail },
  { title: 'Settings', url: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted/50';

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

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
