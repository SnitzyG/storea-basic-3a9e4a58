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
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  FileText,
  MessageSquare,
  HelpCircle,
  Briefcase,
  DollarSign,
  Calendar,
  CheckSquare,
  Shield,
  Mail,
  Settings,
  Palette,
  Activity,
  Monitor,
} from 'lucide-react';

export function AdminSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === 'collapsed';

  const isActive = (path: string) => currentPath === path;

  const navSections = [
    {
      label: 'Overview',
      items: [
        { title: 'Dashboard', url: '/admin/dashboard', icon: LayoutDashboard },
        { title: 'User Management', url: '/admin/users', icon: Users },
        { title: 'System Activity', url: '/admin/activity', icon: Activity },
        { title: 'Audit Logs', url: '/admin/logs', icon: FileText },
        { title: 'System Alerts', url: '/admin/alerts', icon: Monitor },
      ],
    },
    {
      label: 'Administration',
      items: [
        { title: 'User Approvals', url: '/admin/approvals', icon: Shield },
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
                        className="flex items-center gap-3"
                      >
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
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
