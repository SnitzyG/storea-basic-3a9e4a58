import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AppLayout } from '@/components/layout/AppLayout';
import { BidSubmissionDialog } from './BidSubmissionDialog';
import { 
  Download, 
  FileText, 
  Calendar, 
  DollarSign, 
  MapPin, 
  Building,
  ArrowLeft,
  Loader2,
  Package
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { downloadFromStorage } from '@/utils/storageUtils';

interface TenderPackageDoc {
  id: string;
  document_type: string;
  document_name: string;
  file_path: string;
  file_size?: number;
  uploaded_at: string;
}

export const TenderDetailsView = () => {
  const { tenderId } = useParams<{ tenderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tender, setTender] = useState<any>(null);
  const [packageDocs, setPackageDocs] = useState<TenderPackageDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBidDialog, setShowBidDialog] = useState(false);

  useEffect(() => {
    const fetchTenderDetails = async () => {
      if (!user || !tenderId) {
        setLoading(false);
        return;
      }

      try {
        // Fetch tender details
        const { data: tenderData, error: tenderError } = await supabase
          .from('tenders')
          .select(`
            *,
            profiles:issued_by (
              name,
              company_id
            )
          `)
          .eq('id', tenderId)
          .single();

        if (tenderError) throw tenderError;
        setTender(tenderData);

        // Fetch package documents
        const { data: docsData, error: docsError } = await supabase
          .from('tender_package_documents')
          .select('*')
          .eq('tender_id', tenderId)
          .order('uploaded_at', { ascending: false });

        if (docsError) throw docsError;
        setPackageDocs(docsData || []);
      } catch (error: any) {
        console.error('Error fetching tender details:', error);
        toast.error('Failed to load tender details');
      } finally {
        setLoading(false);
      }
    };

    fetchTenderDetails();
  }, [tenderId, user]);

  const handleDownloadDocument = async (doc: TenderPackageDoc) => {
    try {
      await downloadFromStorage(doc.file_path, doc.document_name);
      toast.success('Document downloaded successfully');
    } catch (error: any) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  const groupDocumentsByType = () => {
    const groups: Record<string, TenderPackageDoc[]> = {};
    packageDocs.forEach(doc => {
      const type = doc.document_type || 'Other';
      if (!groups[type]) groups[type] = [];
      groups[type].push(doc);
    });
    return groups;
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!tender) {
    return (
      <AppLayout>
        <Card>
          <CardContent className="pt-6 text-center">
            <p>Tender not found</p>
            <Button onClick={() => navigate('/tenders')} className="mt-4">
              Back to Tenders
            </Button>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  const documentGroups = groupDocumentsByType();
  const isExpired = tender.deadline && new Date(tender.deadline) < new Date();

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/tenders')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tenders
          </Button>
          <Badge variant={isExpired ? 'destructive' : 'default'}>
            {tender.status}
          </Badge>
        </div>

        {/* Tender Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{tender.title}</CardTitle>
            <CardDescription>
              Tender ID: <span className="font-mono">{tender.tender_id}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Client</p>
                  <p className="text-sm text-muted-foreground">{tender.client_name || 'Not specified'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Project Address</p>
                  <p className="text-sm text-muted-foreground">{tender.project_address || 'Not specified'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Submission Deadline</p>
                  <p className="text-sm text-muted-foreground">
                    {tender.deadline 
                      ? new Date(tender.deadline).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Not specified'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Budget</p>
                  <p className="text-sm text-muted-foreground">
                    {tender.budget ? `$${tender.budget.toLocaleString()}` : 'Not specified'}
                  </p>
                </div>
              </div>
            </div>

            {tender.description && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-2">Description</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {tender.description}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Tender Package Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Tender Package Documents
              <Badge variant="secondary">{packageDocs.length}</Badge>
            </CardTitle>
            <CardDescription>
              Download tender documents to prepare your bid submission
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.keys(documentGroups).length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No documents available for this tender
              </p>
            ) : (
              Object.entries(documentGroups).map(([type, docs]) => (
                <div key={type} className="space-y-3">
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                    {type}
                  </h3>
                  <div className="space-y-2">
                    {docs.map((doc) => (
                      <Card key={doc.id}>
                        <CardContent className="py-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-primary" />
                              <div>
                                <p className="font-medium text-sm">{doc.document_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Uploaded {formatDistanceToNow(new Date(doc.uploaded_at), { addSuffix: true })}
                                  {doc.file_size && ` • ${(doc.file_size / 1024 / 1024).toFixed(2)} MB`}
                                </p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleDownloadDocument(doc)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Submit Bid Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Ready to submit your bid?</h3>
                <p className="text-sm text-muted-foreground">
                  {isExpired 
                    ? 'This tender has expired and is no longer accepting bids'
                    : 'Review all documents and submit your competitive bid'}
                </p>
              </div>
              <Button 
                onClick={() => setShowBidDialog(true)}
                disabled={isExpired}
              >
                Submit Bid
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <BidSubmissionDialog
        open={showBidDialog}
        onOpenChange={setShowBidDialog}
        tender={tender}
      />
    </AppLayout>
  );
};
