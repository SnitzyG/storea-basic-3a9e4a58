// @ts-nocheck
import { useEffect, useState } from 'react';
import { Home, Users, Activity, AlertCircle, FileText, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

export function AdminSidebar() {
  const location = useLocation();
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    const fetchAlertCount = async () => {
      const { count } = await supabase
        .from('admin_alerts')
        .select('*', { count: 'exact', head: true })
        .is('resolved_at', null)
        .in('severity', ['critical', 'error']);
      
      setAlertCount(count || 0);
    };

    fetchAlertCount();

    const channel = supabase
      .channel('admin-alerts-sidebar')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_alerts' }, () => {
        fetchAlertCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: Home },
    { name: 'User Management', href: '/admin/users', icon: Users },
    { name: 'System Activity', href: '/admin/activity', icon: Activity },
    { name: 'Alerts & Issues', href: '/admin/alerts', icon: AlertCircle, badge: alertCount },
    { name: 'Audit Logs', href: '/admin/logs', icon: FileText },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <h2 className="text-lg font-semibold">Admin Panel</h2>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="flex-1">{item.name}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <Badge 
                  variant={isActive ? 'secondary' : 'destructive'}
                  className="ml-auto"
                >
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
