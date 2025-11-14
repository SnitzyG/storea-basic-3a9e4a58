import { AlertNotification } from '@/hooks/useMonitoringData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface ActiveAlertsPanelProps {
  alerts: AlertNotification[];
  onAcknowledge: (id: string) => void;
}

export const ActiveAlertsPanel = ({ alerts, onAcknowledge }: ActiveAlertsPanelProps) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-card border">
          <Bell className="h-5 w-5 text-destructive mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium">{alert.title}</span>
              <Badge variant={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {format(new Date(alert.triggered_at), 'PPpp')}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAcknowledge(alert.id)}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Acknowledge
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
