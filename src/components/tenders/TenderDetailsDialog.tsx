import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, DollarSign, FileText, Users, Award, BarChart3 } from 'lucide-react';
import { Tender, TenderBid, useTenders } from '@/hooks/useTenders';
import { EnhancedBidComparison } from './EnhancedBidComparison';
import { formatDistanceToNow } from 'date-fns';
interface TenderDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tender: Tender | null;
  userRole: string;
}
const statusColors = {
  draft: 'bg-gray-500/10 text-gray-700 border-gray-500/20',
  open: 'bg-green-500/10 text-green-700 border-green-500/20',
  closed: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
  awarded: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  cancelled: 'bg-red-500/10 text-red-700 border-red-500/20'
};
const bidStatusColors = {
  submitted: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  under_review: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
  accepted: 'bg-green-500/10 text-green-700 border-green-500/20',
  rejected: 'bg-red-500/10 text-red-700 border-red-500/20'
};
export const TenderDetailsDialog = ({
  open,
  onOpenChange,
  tender,
  userRole
}: TenderDetailsDialogProps) => {
  const [bids, setBids] = useState<TenderBid[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBidder, setSelectedBidder] = useState<string>('');
  const {
    getTenderBids,
    awardTender
  } = useTenders();
  useEffect(() => {
    if (tender && open) {
      fetchBids();
    }
  }, [tender, open]);
  const fetchBids = async () => {
    if (!tender) return;
    setLoading(true);
    const bidsData = await getTenderBids(tender.id);
    setBids(bidsData);
    setLoading(false);
  };
  const handleAward = async () => {
    if (!tender || !selectedBidder) return;
    const success = await awardTender(tender.id, selectedBidder);
    if (success) {
      onOpenChange(false);
    }
  };
  if (!tender) return null;
  const deadline = new Date(tender.deadline);
  const isExpired = deadline < new Date();
  const canViewBids = userRole === 'architect' || tender.issued_by;
  const canAward = tender.status === 'closed' && userRole === 'architect' && bids.length > 0;
  const lowestBid = bids.length > 0 ? Math.min(...bids.map(b => b.bid_amount)) : null;
  const averageBid = bids.length > 0 ? bids.reduce((sum, b) => sum + b.bid_amount, 0) / bids.length : null;
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{tender.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header with status */}
          <div className="flex flex-wrap gap-2">
            <Badge className={statusColors[tender.status]}>
              {tender.status.replace('_', ' ').toUpperCase()}
            </Badge>
            {tender.status === 'awarded' && tender.awarded_to_profile && <Badge variant="outline" className="flex items-center gap-1">
                <Award className="w-3 h-3" />
                Awarded to {tender.awarded_to_profile.name}
              </Badge>}
            {isExpired && tender.status === 'open' && <Badge className="bg-red-500/10 text-red-700 border-red-500/20">
                Expired
              </Badge>}
          </div>

          {/* Description */}
          <div>
            <h3 className="font-semibold mb-2 flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Description
            </h3>
            <p className="text-foreground bg-muted/50 p-3 rounded-md whitespace-pre-wrap">
              {tender.description}
            </p>
          </div>

          {/* Meta information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tender.budget && <div className="flex items-center text-sm">
                <DollarSign className="w-4 h-4 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground mr-2">Budget:</span>
                <span className="font-medium">${tender.budget.toLocaleString()}</span>
              </div>}

            <div className="flex items-center text-sm">
              <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
              <span className="text-muted-foreground mr-2">Deadline:</span>
              <span className="font-medium">
                {deadline.toLocaleDateString()} 
                {!isExpired && <span className="ml-1 text-muted-foreground">
                    ({formatDistanceToNow(deadline, {
                  addSuffix: true
                })})
                  </span>}
              </span>
            </div>

            <div className="flex items-center text-sm">
              <Avatar className="w-5 h-5 mr-2">
                <AvatarFallback className="text-xs">
                  {tender.issued_by_profile?.name?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
              <span className="text-muted-foreground mr-2">Issued by:</span>
              <span>{tender.issued_by_profile?.name || 'Unknown'}</span>
            </div>

            <div className="flex items-center text-sm">
              <Users className="w-4 h-4 mr-2 text-muted-foreground" />
              <span className="text-muted-foreground mr-2">Bids received:</span>
              <span className="font-medium">{bids.length}</span>
            </div>
          </div>

          {/* Requirements */}
          {tender.requirements?.description && <div>
              <h3 className="font-semibold mb-2">Additional Requirements</h3>
              <p className="text-foreground bg-muted/50 p-3 rounded-md">
                {tender.requirements.description}
              </p>
            </div>}

          <Separator />

          {/* Bids Section */}
          {canViewBids ? <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <h3 className="font-semibold">Bids Overview ({bids.length})</h3>
                </div>
                
                {loading ? <p className="text-center text-muted-foreground py-4">Loading bids...</p> : bids.length > 0 ? <div className="space-y-4">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-md">
                      <div>
                        <p className="text-sm text-muted-foreground">Lowest Bid</p>
                        <p className="font-semibold text-green-600">
                          ${lowestBid?.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Average Bid</p>
                        <p className="font-semibold">
                          ${averageBid?.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Bids</p>
                        <p className="font-semibold">{bids.length}</p>
                      </div>
                    </div>

                    {/* Simple Bid List */}
                    <div className="space-y-2">
                      {bids.map(bid => <div key={bid.id} className="flex items-center justify-between p-3 border rounded-md">
                          <div className="flex items-center gap-3">
                            {canAward && <input type="radio" name="selectedBidder" value={bid.bidder_id} checked={selectedBidder === bid.bidder_id} onChange={e => setSelectedBidder(e.target.value)} className="w-4 h-4" />}
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="text-xs">
                                {bid.bidder_profile?.name?.charAt(0) || 'B'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{bid.bidder_profile?.name || 'Unknown'}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(bid.submitted_at), {
                          addSuffix: true
                        })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${bid.bid_amount === lowestBid ? 'text-green-600' : ''}`}>
                              ${bid.bid_amount.toLocaleString()}
                            </p>
                            <Badge className={bidStatusColors[bid.status]}>
                              {bid.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>)}
                    </div>

                    {/* Award Button */}
                    {canAward && <div className="flex justify-end">
                        <Button onClick={handleAward} disabled={!selectedBidder}>
                          Award to Selected Bidder
                        </Button>
                      </div>}
                  </div> : <p className="text-center text-muted-foreground py-4">No bids submitted yet</p>}
              </TabsContent>
              
              <TabsContent value="comparison">
                {bids.length > 0 ? <EnhancedBidComparison bids={bids} onAwardTender={bidId => {
              const bid = bids.find(b => b.id === bidId);
              if (bid) {
                awardTender(tender.id, bid.bidder_id);
                onOpenChange(false);
              }
            }} onSaveEvaluation={(bidId, evaluation) => {
              console.log('Save evaluation for bid:', bidId, evaluation);
              // In a real app, this would call an API to save the evaluation
            }} /> : <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No bids available for comparison</p>
                  </div>}
              </TabsContent>
            </Tabs> : <div className="text-center py-6 text-muted-foreground">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Bid details are only visible to the tender issuer</p>
            </div>}
        </div>
      </DialogContent>
    </Dialog>;
};