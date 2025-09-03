import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tender, useTenders } from '@/hooks/useTenders';

interface BidSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tender: Tender | null;
}

export const BidSubmissionDialog = ({ open, onOpenChange, tender }: BidSubmissionDialogProps) => {
  const [bidAmount, setBidAmount] = useState('');
  const [proposalText, setProposalText] = useState('');
  const [loading, setLoading] = useState(false);

  const { submitBid } = useTenders();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tender || !bidAmount.trim()) return;

    setLoading(true);
    
    const bidData = {
      tender_id: tender.id,
      bid_amount: parseFloat(bidAmount),
      proposal_text: proposalText.trim() || undefined,
      attachments: [], // TODO: Add file upload functionality
    };

    const result = await submitBid(bidData);
    
    if (result) {
      setBidAmount('');
      setProposalText('');
      onOpenChange(false);
    }
    
    setLoading(false);
  };

  React.useEffect(() => {
    if (!open) {
      setBidAmount('');
      setProposalText('');
    }
  }, [open]);

  if (!tender) return null;

  const deadline = new Date(tender.deadline);
  const isExpired = deadline < new Date();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Submit Bid - {tender.title}</DialogTitle>
        </DialogHeader>

        {isExpired ? (
          <div className="text-center py-6">
            <p className="text-red-600 font-medium mb-2">Tender Expired</p>
            <p className="text-muted-foreground">
              The deadline for this tender has passed. You can no longer submit bids.
            </p>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="mt-4"
            >
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tender Info */}
            <div className="bg-muted/50 p-3 rounded-md">
              <p className="text-sm text-muted-foreground">Tender Details:</p>
              <p className="font-medium">{tender.title}</p>
              {tender.budget && (
                <p className="text-sm text-muted-foreground">
                  Budget: ${tender.budget.toLocaleString()}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Deadline: {deadline.toLocaleDateString()}
              </p>
            </div>

            <div>
              <Label htmlFor="bidAmount">Bid Amount * (USD)</Label>
              <Input
                id="bidAmount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Enter your bid amount..."
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                className="mt-1"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter the total amount you would charge for this project
              </p>
            </div>

            <div>
              <Label htmlFor="proposalText">Proposal (Optional)</Label>
              <Textarea
                id="proposalText"
                placeholder="Describe your approach, timeline, qualifications, or any additional information..."
                value={proposalText}
                onChange={(e) => setProposalText(e.target.value)}
                className="min-h-[120px] mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use this space to explain why you're the best choice for this project
              </p>
            </div>

            {/* TODO: Add file upload for attachments */}
            <div className="text-xs text-muted-foreground bg-yellow-50 p-2 rounded">
              📎 File attachments will be available in a future update
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading || !bidAmount.trim()}
              >
                {loading ? 'Submitting...' : 'Submit Bid'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};