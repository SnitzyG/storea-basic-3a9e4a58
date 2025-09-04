import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Search,
  Calendar,
  Award,
  Mail,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { Tender, TenderBid, useTenders } from '@/hooks/useTenders';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface BidsReceivedSectionProps {
  tenders: Tender[];
}

type SortField = 'bid_amount' | 'submitted_at' | 'bidder_name' | 'tender_title';
type SortDirection = 'asc' | 'desc';

const statusColors = {
  submitted: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  under_review: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
  accepted: 'bg-green-500/10 text-green-700 border-green-500/20',
  rejected: 'bg-red-500/10 text-red-700 border-red-500/20',
};

export const BidsReceivedSection = ({ tenders }: BidsReceivedSectionProps) => {
  const [allBids, setAllBids] = useState<(TenderBid & { tender: Tender })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tenderFilter, setTenderFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('submitted_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  const { getTenderBids, awardTender } = useTenders();
  const { toast } = useToast();

  useEffect(() => {
    fetchAllBids();
  }, [tenders]);

  const fetchAllBids = async () => {
    setLoading(true);
    try {
      const bidPromises = tenders.map(async (tender) => {
        const bids = await getTenderBids(tender.id);
        return bids.map(bid => ({ ...bid, tender }));
      });

      const results = await Promise.all(bidPromises);
      const flatBids = results.flat();
      setAllBids(flatBids);
    } catch (error) {
      console.error('Error fetching bids:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAwardBid = async (bid: TenderBid & { tender: Tender }) => {
    const success = await awardTender(bid.tender.id, bid.bidder_id);
    if (success) {
      toast({
        title: "Tender Awarded",
        description: `Tender "${bid.tender.title}" has been awarded to ${bid.bidder_profile?.name || 'the selected bidder'}.`,
      });
      fetchAllBids(); // Refresh data
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  const filteredAndSortedBids = useMemo(() => {
    let filtered = allBids;

    // Apply filters
    if (searchTerm) {
      filtered = filtered.filter(bid => 
        bid.bidder_profile?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bid.tender.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bid.proposal_text?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(bid => bid.status === statusFilter);
    }

    if (tenderFilter !== 'all') {
      filtered = filtered.filter(bid => bid.tender.id === tenderFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case 'bid_amount':
          aValue = a.bid_amount;
          bValue = b.bid_amount;
          break;
        case 'submitted_at':
          aValue = new Date(a.submitted_at);
          bValue = new Date(b.submitted_at);
          break;
        case 'bidder_name':
          aValue = a.bidder_profile?.name || '';
          bValue = b.bidder_profile?.name || '';
          break;
        case 'tender_title':
          aValue = a.tender.title;
          bValue = b.tender.title;
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [allBids, searchTerm, statusFilter, tenderFilter, sortField, sortDirection]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalBids = allBids.length;
    const avgBid = totalBids > 0 ? allBids.reduce((sum, bid) => sum + bid.bid_amount, 0) / totalBids : 0;
    const pendingBids = allBids.filter(bid => bid.status === 'submitted').length;
    const awardedBids = allBids.filter(bid => bid.status === 'accepted').length;

    return { totalBids, avgBid, pendingBids, awardedBids };
  }, [allBids]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Bids Received
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading bids...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Bids Received ({allBids.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted/30 p-3 rounded-md">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              Total Bids
            </div>
            <p className="text-2xl font-bold">{statistics.totalBids}</p>
          </div>
          <div className="bg-muted/30 p-3 rounded-md">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="w-4 h-4" />
              Average Bid
            </div>
            <p className="text-2xl font-bold">${statistics.avgBid.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="bg-muted/30 p-3 rounded-md">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              Pending Review
            </div>
            <p className="text-2xl font-bold">{statistics.pendingBids}</p>
          </div>
          <div className="bg-muted/30 p-3 rounded-md">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Award className="w-4 h-4" />
              Awarded
            </div>
            <p className="text-2xl font-bold">{statistics.awardedBids}</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search bids, bidders, or tenders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={tenderFilter} onValueChange={setTenderFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tenders</SelectItem>
              {tenders.map((tender) => (
                <SelectItem key={tender.id} value={tender.id}>
                  {tender.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bids Table */}
        {filteredAndSortedBids.length > 0 ? (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('tender_title')}
                  >
                    <div className="flex items-center gap-1">
                      Tender
                      <SortIcon field="tender_title" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('bidder_name')}
                  >
                    <div className="flex items-center gap-1">
                      Bidder
                      <SortIcon field="bidder_name" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('bid_amount')}
                  >
                    <div className="flex items-center gap-1">
                      Bid Amount
                      <SortIcon field="bid_amount" />
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('submitted_at')}
                  >
                    <div className="flex items-center gap-1">
                      Submitted
                      <SortIcon field="submitted_at" />
                    </div>
                  </TableHead>
                  <TableHead>Proposal</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedBids.map((bid) => (
                  <TableRow key={bid.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium line-clamp-1">{bid.tender.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {bid.tender.budget ? `Budget: $${bid.tender.budget.toLocaleString()}` : 'No budget specified'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">
                            {bid.bidder_profile?.name?.charAt(0) || 'B'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{bid.bidder_profile?.name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">
                            {bid.bidder_profile?.role}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">${bid.bid_amount.toLocaleString()}</span>
                        {bid.tender.budget && (
                          <span className="text-xs text-muted-foreground">
                            ({((bid.bid_amount / bid.tender.budget) * 100).toFixed(0)}% of budget)
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[bid.status]}>
                        {bid.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDistanceToNow(new Date(bid.submitted_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {bid.proposal_text ? (
                        <p className="text-sm line-clamp-2" title={bid.proposal_text}>
                          {bid.proposal_text}
                        </p>
                      ) : (
                        <span className="text-muted-foreground text-sm">No proposal</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {bid.tender.status === 'closed' && bid.status === 'submitted' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAwardBid(bid)}
                        >
                          Award
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Bids Found</h3>
            <p className="text-muted-foreground">
              {allBids.length === 0 
                ? "No bids have been received yet." 
                : "No bids match your current filters."
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};