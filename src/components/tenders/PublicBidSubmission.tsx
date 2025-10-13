import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Check } from 'lucide-react';

interface PublicBidSubmissionProps {
  tender: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PublicBidSubmission = ({ tender, open, onOpenChange }: PublicBidSubmissionProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [proposalText, setProposalText] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');

  const handleSubmit = async () => {
    if (!bidAmount || !proposalText || !companyName || !contactEmail) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in or create an account to submit a bid",
          variant: "destructive"
        });
        return;
      }

      // Submit bid
      const { error: bidError } = await supabase
        .from('tender_bids')
        .insert({
          tender_id: tender.id,
          bidder_id: user.id,
          bid_amount: parseFloat(bidAmount),
          proposal_text: proposalText,
          status: 'submitted',
          company_name: companyName,
          contact_email: contactEmail,
          contact_phone: contactPhone,
          license_number: licenseNumber
        });

      if (bidError) throw bidError;

      toast({
        title: "Bid Submitted Successfully",
        description: "Your bid has been submitted for review"
      });

      onOpenChange(false);
      
      // Reset form
      setBidAmount('');
      setProposalText('');
      setCompanyName('');
      setContactEmail('');
      setContactPhone('');
      setLicenseNumber('');
      
    } catch (error: any) {
      toast({
        title: "Error Submitting Bid",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Bid for {tender?.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tender Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="font-semibold">Budget: </span>
                {tender?.budget ? `$${tender.budget.toLocaleString()}` : 'Not specified'}
              </div>
              <div>
                <span className="font-semibold">Deadline: </span>
                {tender?.deadline ? new Date(tender.deadline).toLocaleDateString() : 'Not specified'}
              </div>
              {tender?.description && (
                <div>
                  <span className="font-semibold">Description: </span>
                  <p className="mt-1 text-muted-foreground">{tender.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div>
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Your company name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactEmail">Contact Email *</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="contact@company.com"
                />
              </div>

              <div>
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+61 XXX XXX XXX"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="licenseNumber">Builder's License Number</Label>
              <Input
                id="licenseNumber"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="License number"
              />
            </div>

            <div>
              <Label htmlFor="bidAmount">Bid Amount (AUD) *</Label>
              <Input
                id="bidAmount"
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder="Enter your bid amount"
              />
            </div>

            <div>
              <Label htmlFor="proposalText">Proposal / Cover Letter *</Label>
              <Textarea
                id="proposalText"
                value={proposalText}
                onChange={(e) => setProposalText(e.target.value)}
                placeholder="Describe your approach, experience, and why you're the best fit for this project..."
                rows={6}
              />
            </div>

            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-2">
                  <Upload className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium mb-1">Supporting Documents</p>
                    <p className="text-muted-foreground">
                      To complete your bid submission, you can upload supporting documents (insurance certificates, previous work samples, etc.) after creating your account.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              <Check className="h-4 w-4 mr-2" />
              {loading ? 'Submitting...' : 'Submit Bid'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
