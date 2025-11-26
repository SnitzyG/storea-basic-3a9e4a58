import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, FileSpreadsheet, Loader2, Building, Mail, Phone, User } from 'lucide-react';
import { BidLineItemEditor } from './BidLineItemEditor';
import { TenderBidFileService } from '@/services/TenderBidFileService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface TenderBidDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bidId: string;
  tenderId: string;
}

export const TenderBidDetailsDialog = ({ open, onOpenChange, bidId, tenderId }: TenderBidDetailsDialogProps) => {
  const { user } = useAuth();
  const [bid, setBid] = useState<any>(null);
  const [tender, setTender] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchBidDetails = async () => {
      if (!bidId || !open) return;

      setLoading(true);
      try {
        // Fetch bid with bidder profile
        const { data: bidData, error: bidError } = await supabase
          .from('tender_bids')
          .select(`
            *,
            profiles:bidder_id (
              name,
              company_name,
              email,
              phone
            )
          `)
          .eq('id', bidId)
          .maybeSingle();

        if (!bidData) {
          throw new Error('Bid not found');
        }
        setBid(bidData);

        // Fetch tender details
        const { data: tenderData, error: tenderError } = await supabase
          .from('tenders')
          .select('*')
          .eq('id', tenderId)
          .maybeSingle();

        if (!tenderData) {
          throw new Error('Tender not found');
        }
        setTender(tenderData);
      } catch (error: any) {
        console.error('Error fetching bid details:', error);
        toast.error('Failed to load bid details');
      } finally {
        setLoading(false);
      }
    };

    fetchBidDetails();
  }, [bidId, tenderId, open]);

  const handleDownloadExcel = async () => {
    if (!bid?.excel_file_path || !bid?.excel_file_name) {
      toast.error('No Excel file available for this bid');
      return;
    }

    setDownloading(true);
    try {
      await TenderBidFileService.downloadBidExcel(bid.excel_file_path, bid.excel_file_name);
      toast.success('Excel file downloaded');
    } catch (error: any) {
      toast.error('Failed to download Excel file');
    } finally {
      setDownloading(false);
    }
  };

  const isOwner = user?.id === bid?.bidder_id;
  const isBeforeDeadline = tender?.deadline ? new Date(tender.deadline) > new Date() : true;

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!bid || !tender) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <p className="text-center text-muted-foreground py-8">Bid not found</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Bid Details</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Submitted {formatDistanceToNow(new Date(bid.created_at), { addSuffix: true })}
              </p>
            </div>
            <Badge variant={bid.status === 'submitted' ? 'default' : 'secondary'}>
              {bid.status}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="line-items">Line Items</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="execution">Execution</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Bid Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Bid Amount</p>
                    <p className="text-3xl font-bold text-primary">
                      ${bid.bid_amount?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Data Entry Method</p>
                    <Badge variant="outline" className="text-sm">
                      {bid.data_entry_method === 'excel' ? 'Excel Upload' : 
                       bid.data_entry_method === 'web_form' ? 'Online Form' : 'N/A'}
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Company Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Company Name</Label>
                      <p className="font-medium">{bid.company_name || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Contact Person</Label>
                      <p className="font-medium">{bid.contact_person || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Email</Label>
                      <p className="font-medium flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        {bid.contact_email || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Phone</Label>
                      <p className="font-medium flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        {bid.contact_phone || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {bid.proposal_text && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-2">Proposal / Cover Letter</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {bid.proposal_text}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Line Items Tab */}
          <TabsContent value="line-items">
            <BidLineItemEditor
              bidId={bidId}
              tenderId={tenderId}
              isOwner={isOwner}
              isBeforeDeadline={isBeforeDeadline}
              readOnly={!isOwner}
            />
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Submitted Documents</CardTitle>
                <CardDescription>
                  Files and attachments included with this bid
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {bid.excel_file_path && bid.excel_file_name && (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-success/10 rounded-lg">
                        <FileSpreadsheet className="h-6 w-6 text-success" />
                      </div>
                      <div>
                        <p className="font-medium">{bid.excel_file_name}</p>
                        <p className="text-sm text-muted-foreground">Quote Template Excel</p>
                      </div>
                    </div>
                    <Button onClick={handleDownloadExcel} disabled={downloading}>
                      {downloading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {!bid.excel_file_path && (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No documents attached to this bid</p>
                    <p className="text-sm mt-1">Bid was submitted via online form</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Execution Tab */}
          <TabsContent value="execution">
            <Card>
              <CardHeader>
                <CardTitle>Project Execution Details</CardTitle>
                <CardDescription>
                  Timeline and delivery information
                </CardDescription>
              </CardHeader>
              <CardContent>
                {bid.execution_details ? (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-muted-foreground">Proposed Timeline</Label>
                      <p className="font-medium">{bid.execution_details.timeline || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Resources</Label>
                      <p className="font-medium">{bid.execution_details.resources || 'N/A'}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-12">
                    No execution details provided
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

const Label = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-sm font-medium mb-1 ${className}`}>{children}</p>
);
