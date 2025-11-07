import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTenderAccess } from '@/hooks/useTenderAccess';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AppLayout } from '@/components/layout/AppLayout';
import { BidSubmissionDialog } from './BidSubmissionDialog';
import { EnhancedDocumentGallery } from './EnhancedDocumentGallery';
import { 
  Download, 
  FileText, 
  Calendar, 
  DollarSign, 
  MapPin, 
  Building,
  ArrowLeft,
  Loader2,
  Package,
  FileSpreadsheet
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useTenderLineItems } from '@/hooks/useTenderLineItems';
import { generateProfessionalQuoteTemplate, getCompanyInfoFromProfile } from '@/utils/tenderExportUtils';

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
  const { user, profile } = useAuth();
  const [tender, setTender] = useState<any>(null);
  const [packageDocs, setPackageDocs] = useState<TenderPackageDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBidDialog, setShowBidDialog] = useState(false);
  const [company, setCompany] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [accessChecked, setAccessChecked] = useState<boolean>(false);
  
  const { lineItems, loading: lineItemsLoading } = useTenderLineItems(tenderId);
  const { checkTenderAccess } = useTenderAccess();

  // First check tender access
  useEffect(() => {
    const verifyAccess = async () => {
      if (!user || !tenderId) {
        setAccessChecked(true);
        setLoading(false);
        return;
      }

      try {
        const accessResult = await checkTenderAccess(tenderId);
        setHasAccess(accessResult.hasAccess);
        setAccessChecked(true);
      } catch (error) {
        console.error('Error checking tender access:', error);
        setAccessChecked(true);
        setHasAccess(false);
      }
    };

    verifyAccess();
  }, [tenderId, user]);

  // Then fetch tender details if access is granted
  useEffect(() => {
    const fetchTenderDetails = async () => {
      if (!user || !tenderId || !accessChecked) {
        return;
      }

      // Check if user has access OR is the tender issuer
      if (!hasAccess) {
        try {
          const { data: tenderCheck } = await supabase
            .from('tenders')
            .select('issued_by')
            .eq('id', tenderId)
            .single();
          
          if (tenderCheck?.issued_by !== user.id) {
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error('Error checking tender ownership:', error);
          setLoading(false);
          return;
        }
      }

      try {
        setLoading(true);
        
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

        // Fetch company info
        if (profile?.company_id) {
          const { data: companyData } = await supabase
            .from('companies')
            .select('*')
            .eq('id', profile.company_id)
            .single();
          
          setCompany(companyData);
        }
      } catch (error: any) {
        console.error('Error fetching tender details:', error);
        toast.error('Failed to load tender details');
      } finally {
        setLoading(false);
      }
    };

    fetchTenderDetails();
  }, [tenderId, user, profile, hasAccess, accessChecked]);

  const handleDownloadTemplate = async () => {
    try {
      if (!tender || !profile) {
        toast.error('Unable to generate template');
        return;
      }

      const companyInfo = getCompanyInfoFromProfile(profile, company);
      
      // Get project data if available
      let projectData;
      if (tender.project_id) {
        const { data } = await supabase
          .from('projects')
          .select('reference, name, id, address')
          .eq('id', tender.project_id)
          .single();
        
        projectData = data;
      }

      await generateProfessionalQuoteTemplate({
        tenderTitle: tender.title,
        companyInfo,
        lineItems: lineItems.map(item => ({
          itemDescription: item.item_description,
          specification: item.specification || undefined,
          unitOfMeasure: item.unit_of_measure || undefined,
          quantity: item.quantity || undefined,
          category: item.category
        })),
        includeGST: true,
        deadline: tender.deadline ? new Date(tender.deadline).toLocaleDateString() : undefined,
        projectData
      });

      toast.success('Excel template downloaded - complete offline and upload when submitting your bid');
    } catch (error: any) {
      console.error('Error downloading template:', error);
      toast.error('Failed to download template');
    }
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

  // Check if user has access
  if (accessChecked && !hasAccess && !tender) {
    return (
      <AppLayout>
        <Card className="max-w-2xl mx-auto mt-8">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to view this tender
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 text-center space-y-4">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              Your access request may be pending approval from the architect, or you may not have requested access yet.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate('/tenders')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tenders
              </Button>
              <Button onClick={() => navigate('/tenders', { state: { activeTab: 'join' } })}>
                Request Access
              </Button>
            </div>
          </CardContent>
        </Card>
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

        {/* Download Template Section */}
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Quote Template
            </CardTitle>
            <CardDescription>
              Download a professional Excel template pre-filled with tender details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium">Complete your bid offline</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Pre-populated with all line items from tender</li>
                  <li>• Built-in formulas for calculations</li>
                  <li>• Professional formatting ready for submission</li>
                  <li>• Upload completed file when submitting your bid</li>
                </ul>
              </div>
              <Button
                onClick={handleDownloadTemplate}
                disabled={lineItemsLoading || lineItems.length === 0}
                size="lg"
                className="shrink-0"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>
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
              View and download tender documents to prepare your bid submission
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EnhancedDocumentGallery documents={packageDocs} />
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
                    : 'Upload your completed quote template or fill in the details online'}
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
