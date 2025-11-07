import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTenderAccess } from '@/hooks/useTenderAccess';
import { useTenderLineItems, TenderLineItem } from '@/hooks/useTenderLineItems';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AppLayout } from '@/components/layout/AppLayout';
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
  FileSpreadsheet,
  Upload,
  Save,
  Send,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { TenderBidFileService } from '@/services/TenderBidFileService';
import { downloadFromStorage } from '@/utils/storageUtils';

interface TenderPackageDoc {
  id: string;
  document_type: string;
  document_name: string;
  file_path: string;
  file_size?: number;
  uploaded_at: string;
}

interface BidDocument {
  id?: string;
  name: string;
  file_path: string;
  file_size?: number;
  uploaded_at?: string;
}

interface LineItemPricing {
  [lineItemId: string]: {
    unit_price: number;
    notes: string;
  };
}

export const TenderBuilder = () => {
  const { tenderId } = useParams<{ tenderId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [tender, setTender] = useState<any>(null);
  const [packageDocs, setPackageDocs] = useState<TenderPackageDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [accessChecked, setAccessChecked] = useState<boolean>(false);
  const [existingBid, setExistingBid] = useState<any>(null);
  const [bidDocuments, setBidDocuments] = useState<BidDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lineItemPricing, setLineItemPricing] = useState<LineItemPricing>({});
  const [bidNotes, setBidNotes] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  
  const { lineItems, loading: lineItemsLoading } = useTenderLineItems(tenderId);
  const { checkTenderAccess } = useTenderAccess();

  // Initialize line item pricing when line items load
  useEffect(() => {
    if (lineItems.length > 0 && Object.keys(lineItemPricing).length === 0) {
      const initialPricing: LineItemPricing = {};
      lineItems.forEach(item => {
        initialPricing[item.id] = {
          unit_price: 0,
          notes: ''
        };
      });
      setLineItemPricing(initialPricing);
    }
  }, [lineItems]);

  // Check tender access
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

  // Fetch tender details and existing bid
  useEffect(() => {
    const fetchTenderDetails = async () => {
      if (!user || !tenderId || !accessChecked) {
        return;
      }

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

        // Check for existing bid
        const { data: bidData } = await supabase
          .from('tender_bids')
          .select('*')
          .eq('tender_id', tenderId)
          .eq('bidder_id', user.id)
          .single();

        if (bidData) {
          setExistingBid(bidData);
          setBidNotes((bidData as any).proposal || '');
          
          // Fetch existing bid line items
          const { data: bidLineItems } = await supabase
            .from('tender_bid_line_items')
            .select('*')
            .eq('bid_id', bidData.id);

          if (bidLineItems) {
            const pricing: LineItemPricing = {};
            bidLineItems.forEach((item: any) => {
              pricing[item.tender_line_item_id] = {
                unit_price: item.unit_price,
                notes: item.notes || ''
              };
            });
            setLineItemPricing(pricing);
          }

          // Parse attachments if they exist
          if (bidData.attachments && Array.isArray(bidData.attachments)) {
            setBidDocuments(bidData.attachments as unknown as BidDocument[]);
          }
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadedDocs: BidDocument[] = [];

      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `tenders/${tenderId}/bid-docs/${user?.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        uploadedDocs.push({
          name: file.name,
          file_path: filePath,
          file_size: file.size,
          uploaded_at: new Date().toISOString()
        });
      }

      setBidDocuments([...bidDocuments, ...uploadedDocs]);
      toast.success(`${uploadedDocs.length} document(s) uploaded successfully`);
    } catch (error: any) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload documents');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveDocument = (index: number) => {
    const newDocs = [...bidDocuments];
    newDocs.splice(index, 1);
    setBidDocuments(newDocs);
    toast.success('Document removed');
  };

  const handleDownloadDocument = async (doc: TenderPackageDoc | BidDocument) => {
    try {
      const fileName = 'document_name' in doc ? doc.document_name : doc.name;
      await downloadFromStorage(doc.file_path, fileName);
      toast.success('Download started');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  const calculateTotals = () => {
    let subtotal = 0;
    lineItems.forEach(item => {
      const pricing = lineItemPricing[item.id];
      if (pricing) {
        const quantity = item.quantity || 1;
        subtotal += quantity * pricing.unit_price;
      }
    });
    const gst = subtotal * 0.1;
    const grandTotal = subtotal + gst;
    
    return { subtotal, gst, grandTotal };
  };

  const handleSubmitBid = async () => {
    // Validate that all line items have pricing
    const missingPrices = lineItems.filter(item => {
      const pricing = lineItemPricing[item.id];
      return !pricing || pricing.unit_price <= 0;
    });

    if (missingPrices.length > 0) {
      toast.error(`Please provide pricing for all ${missingPrices.length} line item(s)`);
      return;
    }

    setSubmitting(true);
    try {
      const totals = calculateTotals();
      
      let bidId = existingBid?.id;

      // Create or update bid
      if (existingBid) {
        // Update existing bid
        const { error: updateError } = await supabase
          .from('tender_bids')
          .update({
            bid_amount: totals.grandTotal,
            attachments: bidDocuments as any,
            status: 'submitted',
            submitted_at: new Date().toISOString()
          } as any)
          .eq('id', existingBid.id);

        if (updateError) throw updateError;
      } else {
        // Create new bid
        const { data: newBid, error: createError } = await supabase
          .from('tender_bids')
          .insert({
            bidder_id: user!.id,
            bid_amount: totals.grandTotal,
            attachments: bidDocuments as any,
            status: 'submitted',
            submitted_at: new Date().toISOString()
          } as any)
          .select()
          .single();

        if (createError) throw createError;
        bidId = newBid.id;
        setExistingBid(newBid);
      }

      // Delete existing line items and create new ones
      await supabase
        .from('tender_bid_line_items')
        .delete()
        .eq('bid_id', bidId);

      const lineItemsToInsert = lineItems.map(item => {
        const pricing = lineItemPricing[item.id];
        const quantity = item.quantity || 1;
        const total = quantity * pricing.unit_price;

        return {
          bid_id: bidId,
          tender_line_item_id: item.id,
          line_number: item.line_number,
          item_description: item.item_description,
          specification: item.specification,
          unit_of_measure: item.unit_of_measure,
          quantity: item.quantity,
          unit_price: pricing.unit_price,
          total: total,
          category: item.category,
          notes: pricing.notes
        };
      });

      const { error: lineItemsError } = await supabase
        .from('tender_bid_line_items')
        .insert(lineItemsToInsert);

      if (lineItemsError) throw lineItemsError;

      // Log activity
      await supabase.from('activity_log').insert({
        user_id: user!.id,
        entity_type: 'tender_bid',
        entity_id: bidId,
        action: existingBid ? 'updated' : 'created',
        description: `${existingBid ? 'Updated' : 'Submitted'} bid for tender: ${tender.title}`,
        project_id: tender.project_id
      });

      toast.success(existingBid ? 'Bid updated successfully' : 'Bid submitted successfully');
      
      // Refresh to show updated bid
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      console.error('Error submitting bid:', error);
      toast.error('Failed to submit bid: ' + error.message);
    } finally {
      setSubmitting(false);
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
              Request access to this tender to submit your bid.
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
  const totals = calculateTotals();
  const hasAllPrices = lineItems.every(item => {
    const pricing = lineItemPricing[item.id];
    return pricing && pricing.unit_price > 0;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/tenders')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tenders
          </Button>
          <div className="flex items-center gap-2">
            {existingBid && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Bid {existingBid.status === 'submitted' ? 'Submitted' : 'Draft'}
              </Badge>
            )}
            <Badge variant={isExpired ? 'destructive' : 'default'}>
              {tender.status}
            </Badge>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="submit">Submit</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
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
                      {tender.deadline && !isExpired && (
                        <p className="text-xs text-primary mt-1">
                          {formatDistanceToNow(new Date(tender.deadline), { addSuffix: true })}
                        </p>
                      )}
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
                  Download and review tender documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                {packageDocs.length > 0 ? (
                  <div className="space-y-2">
                    {packageDocs.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{doc.document_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {doc.document_type} • {doc.file_size ? `${(doc.file_size / 1024).toFixed(2)} KB` : 'Unknown size'}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadDocument(doc)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No documents available
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pricing Tab */}
          <TabsContent value="pricing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Line Item Pricing</CardTitle>
                <CardDescription>
                  Enter your pricing for each line item below
                </CardDescription>
              </CardHeader>
              <CardContent>
                {lineItemsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : lineItems.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[60px]">#</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="w-[100px]">Qty</TableHead>
                          <TableHead className="w-[120px]">Unit</TableHead>
                          <TableHead className="w-[150px]">Unit Price</TableHead>
                          <TableHead className="w-[150px]">Total</TableHead>
                          <TableHead className="w-[200px]">Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lineItems.map((item) => {
                          const pricing = lineItemPricing[item.id] || { unit_price: 0, notes: '' };
                          const total = (item.quantity || 1) * pricing.unit_price;
                          
                          return (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.line_number}</TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{item.item_description}</p>
                                  {item.specification && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {item.specification}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{item.quantity || 1}</TableCell>
                              <TableCell>{item.unit_of_measure || '-'}</TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  value={pricing.unit_price || ''}
                                  onChange={(e) => {
                                    const value = parseFloat(e.target.value) || 0;
                                    setLineItemPricing(prev => ({
                                      ...prev,
                                      [item.id]: { ...prev[item.id], unit_price: value }
                                    }));
                                  }}
                                  disabled={isExpired}
                                />
                              </TableCell>
                              <TableCell className="font-semibold">
                                ${total.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Input
                                  placeholder="Optional notes..."
                                  value={pricing.notes || ''}
                                  onChange={(e) => {
                                    setLineItemPricing(prev => ({
                                      ...prev,
                                      [item.id]: { ...prev[item.id], notes: e.target.value }
                                    }));
                                  }}
                                  disabled={isExpired}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-12">
                    No line items available
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Totals */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-lg">
                    <span className="font-medium">Subtotal:</span>
                    <span className="font-semibold">${totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg">
                    <span className="font-medium">GST (10%):</span>
                    <span className="font-semibold">${totals.gst.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-2xl font-bold text-primary">
                    <span>Grand Total:</span>
                    <span>${totals.grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Your Documents
                </CardTitle>
                <CardDescription>
                  Add supporting documents, quotations, or completed templates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors">
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploading || isExpired}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-sm font-medium mb-1">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF, Excel, Word, Images (max 10MB each)
                    </p>
                  </label>
                </div>

                {uploading && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading documents...
                  </div>
                )}

                {bidDocuments.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Uploaded Documents</h4>
                    {bidDocuments.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{doc.name}</p>
                            {doc.file_size && (
                              <p className="text-xs text-muted-foreground">
                                {(doc.file_size / 1024).toFixed(2)} KB
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadDocument(doc)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveDocument(index)}
                            disabled={isExpired}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Submit Tab */}
          <TabsContent value="submit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Review & Submit Bid</CardTitle>
                <CardDescription>
                  Review your bid details before submission
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Bid Amount</p>
                    <p className="text-2xl font-bold text-primary">${totals.grandTotal.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Line Items Priced</p>
                    <p className="text-2xl font-bold">
                      {lineItems.filter(item => lineItemPricing[item.id]?.unit_price > 0).length} / {lineItems.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Documents Uploaded</p>
                    <p className="text-2xl font-bold">{bidDocuments.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="text-lg font-semibold">
                      {hasAllPrices ? (
                        <span className="text-green-600">Ready to Submit</span>
                      ) : (
                        <span className="text-orange-600">Incomplete</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Proposal/Notes */}
                <div className="space-y-2">
                  <Label htmlFor="bid-notes">Proposal / Cover Letter</Label>
                  <Textarea
                    id="bid-notes"
                    placeholder="Add a cover letter or proposal notes..."
                    value={bidNotes}
                    onChange={(e) => setBidNotes(e.target.value)}
                    rows={6}
                    disabled={isExpired}
                  />
                </div>

                {/* Submit Button */}
                <div className="flex flex-col gap-4">
                  {!hasAllPrices && (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-sm text-orange-800">
                        Please complete pricing for all line items before submitting.
                      </p>
                    </div>
                  )}

                  {isExpired && (
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <p className="text-sm text-destructive">
                        This tender has expired and is no longer accepting bids.
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={handleSubmitBid}
                    disabled={!hasAllPrices || isExpired || submitting}
                    size="lg"
                    className="w-full"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Submitting Bid...
                      </>
                    ) : existingBid ? (
                      <>
                        <Save className="h-5 w-5 mr-2" />
                        Update Bid
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5 mr-2" />
                        Submit Bid
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};
