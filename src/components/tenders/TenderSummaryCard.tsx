import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, User, Eye, Hash, Copy } from 'lucide-react';
import { Tender } from '@/hooks/useTenders';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface TenderSummaryCardProps {
  tender: Tender;
  onView: (tender: Tender) => void;
}

const statusColors = {
  draft: 'bg-muted text-muted-foreground',
  open: 'bg-green-500/10 text-green-700 border-green-500/20',
  closed: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
  awarded: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  cancelled: 'bg-red-500/10 text-red-700 border-red-500/20',
};

const statusLabels = {
  draft: 'Draft',
  open: 'Open for Bidding',
  closed: 'Closed',
  awarded: 'Awarded',
  cancelled: 'Cancelled',
};

export const TenderSummaryCard = ({ tender, onView }: TenderSummaryCardProps) => {
  const deadline = new Date(tender.deadline);
  const daysUntilDeadline = Math.ceil((deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  const copyTenderId = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(tender.tender_id);
      toast({
        title: "Tender ID copied",
        description: "Tender ID has been copied to clipboard"
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the Tender ID manually",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="hover:shadow-md transition-all duration-200 cursor-pointer" onClick={() => onView(tender)}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header with Title and Status */}
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-semibold text-foreground leading-tight flex-1">
              {tender.title}
            </h3>
            <Badge className={statusColors[tender.status]}>
              {statusLabels[tender.status]}
            </Badge>
          </div>

          {/* Tender ID */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Tender ID</span>
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-1 text-xs text-primary font-mono bg-primary/10 px-2 py-1 rounded border border-primary/20">
                <Hash className="h-3 w-3" />
                {tender.tender_id}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={copyTenderId}
                className="h-6 w-6 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Client */}
          {tender.issued_by_profile?.name && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Client</p>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-3 w-3 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  {tender.issued_by_profile.name}
                </p>
              </div>
            </div>
          )}

          {/* Description */}
          {tender.description && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Description</p>
              <p className="text-sm text-foreground line-clamp-2">
                {tender.description}
              </p>
            </div>
          )}

          {/* Submission Deadline */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Submission Deadline</p>
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium text-foreground">
                  {deadline.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })} at {deadline.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {daysUntilDeadline > 0 
                    ? `in ${daysUntilDeadline} day${daysUntilDeadline !== 1 ? 's' : ''}`
                    : 'Expired'}
                </p>
              </div>
            </div>
          </div>

          {/* Budget */}
          {tender.budget && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Budget</p>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">
                  ${tender.budget.toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* View Details Button */}
          <Button 
            className="w-full mt-2" 
            onClick={(e) => {
              e.stopPropagation();
              onView(tender);
            }}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Tender Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
