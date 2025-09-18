import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, AlertTriangle, User } from 'lucide-react';
import { useRFIs } from '@/hooks/useRFIs';
import { useNotificationContext } from '@/context/NotificationContext';
import { format } from 'date-fns';

export const OpenRFIs = () => {
  const { rfis, loading } = useRFIs(); // Get all RFIs across projects
  const { unreadCounts } = useNotificationContext();

  const openRFIs = rfis.filter(rfi => 
    rfi.status === 'open' || rfi.status === 'submitted'
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Open RFIs
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Open RFIs ({openRFIs.length})
          {unreadCounts.rfis > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unreadCounts.rfis}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto space-y-4">
        {openRFIs.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center mt-8">No action required</div>
        ) : (
          openRFIs.slice(0, 5).map((rfi) => (
            <div key={rfi.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-sm">{rfi.question}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={getPriorityColor(rfi.priority)} className="text-xs">
                      {rfi.priority}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {rfi.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {rfi.raised_by_profile?.name || 'Unknown'}
                </div>
                {rfi.due_date && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Due: {format(new Date(rfi.due_date), 'MMM d')}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        
        {openRFIs.length > 5 && (
          <Button variant="outline" size="sm" className="w-full mt-4">
            View All ({openRFIs.length - 5} more)
          </Button>
        )}
      </CardContent>
    </Card>
  );
};