import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, DollarSign, FileText, Users, Award } from 'lucide-react';
import { Tender, TenderBid, useTenders } from '@/hooks/useTenders';
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
  cancelled: 'bg-red-500/10 text-red-700 border-red-500/20',
};

const bidStatusColors = {
  submitted: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  under_review: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
  accepted: 'bg-green-500/10 text-green-700 border-green-500/20',
  rejected: 'bg-red-500/10 text-red-700 border-red-500/20',
};

export const TenderDetailsDialog = ({ open, onOpenChange, tender, userRole }: TenderDetailsDialogProps) => {
  const [bids, setBids] = useState<TenderBid[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBidder, setSelectedBidder] = useState<string>('');

  const { getTenderBids, awardTender } = useTenders();

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            {tender.status === 'awarded' && tender.awarded_to_profile && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Award className="w-3 h-3" />
                Awarded to {tender.awarded_to_profile.name}
              </Badge>
            )}
            {isExpired && tender.status === 'open' && (
              <Badge className="bg-red-500/10 text-red-700 border-red-500/20">
                Expired
              </Badge>
            )}
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
            {tender.budget && (
              <div className="flex items-center text-sm">
                <DollarSign className="w-4 h-4 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground mr-2">Budget:</span>
                <span className="font-medium">${tender.budget.toLocaleString()}</span>
              </div>
            )}

            <div className="flex items-center text-sm">
              <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
              <span className="text-muted-foreground mr-2">Deadline:</span>
              <span className="font-medium">
                {deadline.toLocaleDateString()} 
                {!isExpired && (
                  <span className="ml-1 text-muted-foreground">
                    ({formatDistanceToNow(deadline, { addSuffix: true })})
                  </span>
                )}
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
          {tender.requirements?.description && (
            <div>
              <h3 className="font-semibold mb-2">Additional Requirements</h3>
              <p className="text-foreground bg-muted/50 p-3 rounded-md">
                {tender.requirements.description}
              </p>
            </div>
          )}

          <Separator />

          {/* Bids Section */}
          {canViewBids ? (
            <div>
              <h3 className="font-semibold mb-3 flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Bids ({bids.length})
              </h3>
              
              {loading ? (
                <p className="text-center text-muted-foreground py-4">Loading bids...</p>
              ) : bids.length > 0 ? (
                <div className="space-y-4">
                  {/* Bid Statistics */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-md">
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

                  {/* Bids Table */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {canAward && <TableHead className="w-12"></TableHead>}
                        <TableHead>Bidder</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Proposal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bids.map((bid) => (
                        <TableRow key={bid.id}>
                          {canAward && (
                            <TableCell>
                              <input
                                type="radio"
                                name="selectedBidder"
                                value={bid.bidder_id}
                                checked={selectedBidder === bid.bidder_id}
                                onChange={(e) => setSelectedBidder(e.target.value)}
                                className="w-4 h-4"
                              />
                            </TableCell>
                          )}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
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
                            <span className={`font-medium ${bid.bid_amount === lowestBid ? 'text-green-600' : ''}`}>
                              ${bid.bid_amount.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={bidStatusColors[bid.status]}>
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
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Award Button */}
                  {canAward && (
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleAward}
                        disabled={!selectedBidder}
                      >
                        Award to Selected Bidder
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-4">No bids submitted yet</p>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Bid details are only visible to the tender issuer</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};