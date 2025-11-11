import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Calendar, DollarSign, User, Eye } from 'lucide-react';
import { Tender } from '@/hooks/useTenders';
import { toast } from '@/hooks/use-toast';

interface TenderListViewProps {
  tenders: Tender[];
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
  open: 'Open',
  closed: 'Closed',
  awarded: 'Awarded',
  cancelled: 'Cancelled',
};

export const TenderListView = ({ tenders, onView }: TenderListViewProps) => {
  const copyTenderId = async (e: React.MouseEvent, tenderId: string) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(tenderId);
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

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    const daysUntil = Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      formatted: date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      }),
      daysText: daysUntil > 0 
        ? `${daysUntil} day${daysUntil !== 1 ? 's' : ''}`
        : 'Expired'
    };
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Tender ID</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Deadline</TableHead>
            <TableHead className="text-right">Budget</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tenders.map((tender) => {
            const deadline = formatDeadline(tender.deadline);
            return (
              <TableRow 
                key={tender.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onView(tender)}
              >
                <TableCell className="font-medium">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold">{tender.title}</span>
                    {tender.description && (
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {tender.description}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[tender.status]}>
                    {statusLabels[tender.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <code className="text-xs font-mono bg-primary/10 text-primary px-2 py-1 rounded border border-primary/20">
                      {tender.tender_id}
                    </code>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => copyTenderId(e, tender.tender_id)}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  {tender.issued_by_profile?.name ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-sm">{tender.issued_by_profile.name}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="text-sm">{deadline.formatted}</span>
                      <span className="text-xs text-muted-foreground">{deadline.daysText}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {tender.budget ? (
                    <div className="flex items-center justify-end gap-1">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {tender.budget.toLocaleString()}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onView(tender);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
