import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { Alert } from '@/hooks/useAdminAlerts';
import { useNavigate } from 'react-router-dom';

interface AlertsIssuesCardProps {
  alerts: Alert[];
  onDismiss: (alertId: string) => void;
}

export const AlertsIssuesCard = ({ alerts, onDismiss }: AlertsIssuesCardProps) => {
  const navigate = useNavigate();

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      case 'warning': return <AlertCircle className="h-4 w-4" />;
      case 'info': return <Info className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 border-red-500/20 text-red-600';
      case 'warning': return 'bg-orange-500/10 border-orange-500/20 text-orange-600';
      case 'info': return 'bg-blue-500/10 border-blue-500/20 text-blue-600';
      default: return 'bg-gray-500/10 border-gray-500/20 text-gray-600';
    }
  };

  const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.dismissed);
  const warningAlerts = alerts.filter(a => a.severity === 'warning' && !a.dismissed);
  const infoAlerts = alerts.filter(a => a.severity === 'info' && !a.dismissed);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alerts & Issues
          </CardTitle>
          {alerts.length > 0 && (
            <Badge variant="destructive">{alerts.filter(a => !a.dismissed).length}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="max-h-96 overflow-y-auto space-y-2">
          {/* Critical Alerts */}
          {criticalAlerts.map(alert => (
            <div
              key={alert.id}
              className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)} relative`}
            >
              <button
                onClick={() => onDismiss(alert.id)}
                className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
              
              <div className="flex items-start gap-2 pr-8">
                {getSeverityIcon(alert.severity)}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{alert.title}</div>
                  <p className="text-xs mt-1 text-muted-foreground">{alert.description}</p>
                  
                  {alert.actionUrl && (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 mt-2 text-xs"
                      onClick={() => navigate(alert.actionUrl!)}
                    >
                      {alert.actionLabel || 'View Details'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Warning Alerts */}
          {warningAlerts.map(alert => (
            <div
              key={alert.id}
              className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)} relative`}
            >
              <button
                onClick={() => onDismiss(alert.id)}
                className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
              
              <div className="flex items-start gap-2 pr-8">
                {getSeverityIcon(alert.severity)}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{alert.title}</div>
                  <p className="text-xs mt-1 text-muted-foreground">{alert.description}</p>
                  
                  {alert.actionUrl && (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 mt-2 text-xs"
                      onClick={() => navigate(alert.actionUrl!)}
                    >
                      {alert.actionLabel || 'View Details'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Info Alerts */}
          {infoAlerts.slice(0, 3).map(alert => (
            <div
              key={alert.id}
              className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)} relative`}
            >
              <button
                onClick={() => onDismiss(alert.id)}
                className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
              
              <div className="flex items-start gap-2 pr-8">
                {getSeverityIcon(alert.severity)}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{alert.title}</div>
                  <p className="text-xs mt-1 text-muted-foreground">{alert.description}</p>
                  
                  {alert.actionUrl && (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 mt-2 text-xs"
                      onClick={() => navigate(alert.actionUrl!)}
                    >
                      {alert.actionLabel || 'View Details'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {alerts.filter(a => !a.dismissed).length === 0 && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 mb-3">
                <AlertCircle className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-sm font-medium">All Clear!</p>
              <p className="text-xs text-muted-foreground mt-1">No active alerts or issues</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
