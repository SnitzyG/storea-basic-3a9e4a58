import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface AdminAlert {
  id: string;
  severity: string;
  alert_type: string;
  title: string;
  message: string;
  metadata?: any;
  created_at: string;
}

export const useAdminNotifications = () => {
  useEffect(() => {
    // Subscribe to new admin alerts
    const channel = supabase
      .channel('admin-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_alerts',
        },
        (payload) => {
          const alert = payload.new as AdminAlert;
          
          // Only show notifications for critical and error severity
          if (alert.severity === 'critical' || alert.severity === 'error') {
            showNotification(alert);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const showNotification = (alert: AdminAlert) => {
    const getIcon = () => {
      switch (alert.severity) {
        case 'critical':
          return AlertTriangle;
        case 'error':
          return AlertCircle;
        default:
          return Info;
      }
    };

    const Icon = getIcon();

    // Use Sonner toast for notifications
    toast(alert.title, {
      description: alert.message,
      icon: <Icon className="h-5 w-5" />,
      duration: alert.severity === 'critical' ? 10000 : 5000,
      className: alert.severity === 'critical' 
        ? 'border-destructive bg-destructive/10' 
        : 'border-orange-500 bg-orange-500/10',
      action: ['pending_approvals', 'rfi_overdue', 'budget_overrun', 'failed_login'].includes(alert.alert_type)
        ? {
            label: 'View',
            onClick: () => {
              const routes: Record<string, string> = {
                pending_approvals: '/admin/approvals',
                rfi_overdue: '/admin/activity',
                budget_overrun: '/financials',
                failed_login: '/admin/logs',
              };
              const route = routes[alert.alert_type];
              if (route) {
                window.location.href = route;
              }
            },
          }
        : undefined,
    });

    // Play notification sound for critical alerts (optional)
    if (alert.severity === 'critical' && typeof Audio !== 'undefined') {
      try {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => {
          // Ignore audio play errors (user interaction required)
        });
      } catch (error) {
        // Audio not supported or failed
      }
    }
  };
};
