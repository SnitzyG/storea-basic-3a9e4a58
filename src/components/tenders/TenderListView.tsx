import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Calendar, DollarSign, User, Eye, Hash } from 'lucide-react';
import { Tender } from '@/hooks/useTenders';
import { toast } from '@/hooks/use-toast';

interface TenderListViewProps {
  tenders: Tender[];
  onView: (tender: Tender) => void;
}

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  open: 'bg-green-100 text-green-800',
  closed: 'bg-yellow-100 text-yellow-800',
  awarded: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
};

const statusLabels = {
  draft: 'DRAFT',
  open: 'OPEN',
  closed: 'CLOSED',
  awarded: 'AWARDED',
  cancelled: 'CANCELLED',
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
    <Card className="border-0 shadow-sm bg-gradient-to-br from-card to-card/50">
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-gradient-to-r from-muted/50 to-muted/30 border-b-2 border-primary/10">
            <TableRow>
              <TableHead className="text-foreground/80 font-semibold text-sm h-12 px-4">Deadline</TableHead>
              <TableHead className="text-foreground/80 font-semibold text-sm h-12 px-4">Project Reference</TableHead>
              <TableHead className="text-foreground/80 font-semibold text-sm h-12 px-4">Project Name</TableHead>
              <TableHead className="text-foreground/80 font-semibold text-sm h-12 px-4">Tender ID</TableHead>
              <TableHead className="text-foreground/80 font-semibold text-sm h-12 px-4">Client</TableHead>
              <TableHead className="text-foreground/80 font-semibold text-sm h-12 px-4">Budget</TableHead>
              <TableHead className="text-foreground/80 font-semibold text-sm h-12 px-4">Est. Start Date</TableHead>
              <TableHead className="text-foreground/80 font-semibold text-sm h-12 px-4 w-[50px] text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenders.map((tender) => {
              const deadline = formatDeadline(tender.deadline);
              const startDate = tender.estimated_start_date 
                ? new Date(tender.estimated_start_date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })
                : '-';
              
              return (
                <TableRow 
                  key={tender.id}
                  className="hover:bg-muted/30 transition-all duration-200 cursor-pointer border-b border-muted/20"
                  onClick={() => onView(tender)}
                >
                  <TableCell className="text-sm px-4 py-3 text-foreground/90">
                    <div className="flex flex-col">
                      <span className="text-xs text-foreground font-medium">{deadline.formatted}</span>
                      <span className="text-xs text-muted-foreground">{deadline.daysText}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm px-4 py-3 text-foreground/90">
                    <span className="text-xs text-muted-foreground">
                      {tender.project?.project_reference_number || '-'}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm px-4 py-3 text-foreground/90">
                    <div className="space-y-1">
                      <p className="font-medium text-sm leading-none text-foreground">
                        {tender.project?.name || 'Unknown Project'}
                      </p>
                      {tender.title && (
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {tender.title}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm px-4 py-3 text-foreground/90">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-xs text-primary font-mono bg-primary/10 px-2 py-1 rounded border border-primary/20">
                        <Hash className="h-3 w-3" />
                        {tender.tender_id}
                      </div>
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
                  <TableCell className="text-sm px-4 py-3 text-foreground/90">
                    {tender.project?.homeowner_name ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-xs text-muted-foreground">{tender.project.homeowner_name}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm px-4 py-3 text-foreground/90">
                    {tender.project?.budget ? (
                      <span className="text-xs text-muted-foreground">
                        ${tender.project.budget.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm px-4 py-3 text-foreground/90">
                    <span className="text-xs text-muted-foreground">{startDate}</span>
                  </TableCell>
                  <TableCell className="text-sm px-4 py-3 text-foreground/90 w-[50px] text-center">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onView(tender);
                      }}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
