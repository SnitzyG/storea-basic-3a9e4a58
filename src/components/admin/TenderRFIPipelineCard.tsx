import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, HelpCircle, ArrowRight, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRFIs } from '@/hooks/useRFIs';
import { useTenders } from '@/hooks/useTenders';
import { formatDistanceToNow } from 'date-fns';

interface TenderRFIPipelineCardProps {
  stats: {
    totalOpen: number;
    dueThisWeek: number;
    rfisWaitingResponse: number;
    rfisPendingClient: number;
  } | null;
}

export const TenderRFIPipelineCard = ({ stats }: TenderRFIPipelineCardProps) => {
  const navigate = useNavigate();
  const { rfis } = useRFIs();
  const { tenders } = useTenders();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'resolved': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const isUrgent = (dueDate: string | null) => {
    if (!dueDate) return false;
    const days = Math.floor((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days <= 2;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Tender & RFI Pipeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-green-500/10 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.totalOpen}</div>
              <div className="text-xs text-muted-foreground">Open Tenders</div>
            </div>
            <div className="p-3 rounded-lg bg-orange-500/10 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.dueThisWeek}</div>
              <div className="text-xs text-muted-foreground">Due This Week</div>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.rfisWaitingResponse}</div>
              <div className="text-xs text-muted-foreground">RFIs Waiting</div>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/10 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.rfisPendingClient}</div>
              <div className="text-xs text-muted-foreground">Pending Client</div>
            </div>
          </div>
        )}

        {/* Recent RFIs */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            Recent RFIs
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {rfis.slice(0, 5).map(rfi => (
              <div
                key={rfi.id}
                className="flex items-center justify-between p-2 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors"
                onClick={() => navigate('/rfis')}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{rfi.rfi_number}</span>
                    {isUrgent(rfi.due_date) && (
                      <Badge variant="destructive" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        Urgent
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{rfi.subject}</p>
                </div>
                <div className={`w-2 h-2 rounded-full ${getStatusColor(rfi.status)}`} />
              </div>
            ))}
            
            {rfis.length === 0 && (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No RFIs found
              </div>
            )}
          </div>
        </div>

        {/* Recent Tenders */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Active Tenders
          </h4>
          <div className="space-y-2">
            {tenders.slice(0, 3).map(tender => (
              <div
                key={tender.id}
                className="flex items-center justify-between p-2 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors"
                onClick={() => navigate('/tenders')}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{tender.title}</div>
                  <p className="text-xs text-muted-foreground">
                    {tender.begin_date 
                      ? `Started ${formatDistanceToNow(new Date(tender.begin_date), { addSuffix: true })}`
                      : 'No start date'
                    }
                  </p>
                </div>
                <Badge variant="outline">{tender.status}</Badge>
              </div>
            ))}
            
            {tenders.length === 0 && (
              <div className="text-center py-6 text-muted-foreground text-sm">
                No active tenders
              </div>
            )}
          </div>
        </div>

        <Button variant="outline" className="w-full" onClick={() => navigate('/rfis')}>
          View All RFIs & Tenders
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
};
