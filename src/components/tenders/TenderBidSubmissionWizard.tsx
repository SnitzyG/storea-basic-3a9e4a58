import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, Edit, Check, AlertCircle, Loader2 } from 'lucide-react';
import { TenderExcelParser, ParsedBidData } from '@/services/TenderExcelParser';
import { TenderBidFileService } from '@/services/TenderBidFileService';
import { TenderLineItem } from '@/hooks/useTenderLineItems';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TenderBidSubmissionWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tender: any;
  lineItems?: TenderLineItem[];
  onSuccess?: () => void;
}

type SubmissionMethod = 'excel' | 'web_form' | null;
type WizardStep = 'method' | 'upload' | 'review' | 'complete';

export const TenderBidSubmissionWizard = ({ open, onOpenChange, tender, lineItems = [], onSuccess }: TenderBidSubmissionWizardProps) => {
  const { user, profile } = useAuth();
  const [currentStep, setCurrentStep] = useState<WizardStep>('method');
  const [submissionMethod, setSubmissionMethod] = useState<SubmissionMethod>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Excel upload state
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedBidData | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  
  // Web form state
  const [lineItemPrices, setLineItemPrices] = useState<Record<string, { unitPrice: number; notes: string }>>({});
  
  // Bid details
  const [bidAmount, setBidAmount] = useState('');
  const [proposal, setProposal] = useState('');
  const [companyName, setCompanyName] = useState(profile?.company_name || '');
  const [contactPerson, setContactPerson] = useState(profile?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;
      
      const file = acceptedFiles[0];
      if (!file.name.match(/\.(xlsx|xls)$/i)) {
        toast.error('Please upload an Excel file (.xlsx or .xls)');
        return;
      }

      setExcelFile(file);
      setUploading(true);
      setParseError(null);

      try {
        const parsed = await TenderExcelParser.parseExcelBidFile(file);
        const validation = TenderExcelParser.validateBidLineItems(parsed, lineItems);

        if (!validation.isValid) {
          setParseError(validation.errors.join(', '));
          toast.error('Excel validation failed');
          return;
        }

        if (validation.warnings.length > 0) {
          validation.warnings.forEach(warning => toast.warning(warning));
        }

        setParsedData(parsed);
        setBidAmount(parsed.grandTotal.toString());
        setCurrentStep('review');
        toast.success('Excel file parsed successfully');
      } catch (error: any) {
        setParseError(error.message);
        toast.error('Failed to parse Excel file');
      } finally {
        setUploading(false);
      }
    },
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1
  });

  const calculateWebFormTotal = () => {
    let subtotal = 0;
    lineItems.forEach(item => {
      const price = lineItemPrices[item.id];
      if (price && price.unitPrice > 0) {
        const quantity = item.quantity || 1;
        subtotal += quantity * price.unitPrice;
      }
    });
    const gst = subtotal * 0.10;
    return { subtotal, gst, grandTotal: subtotal + gst };
  };

  const handleWebFormSubmit = () => {
    const totals = calculateWebFormTotal();
    setBidAmount(totals.grandTotal.toString());
    setCurrentStep('review');
  };

  const handleFinalSubmit = async () => {
    if (!user || !tender) return;

    setSubmitting(true);
    try {
      // Create bid record
      const { data: bid, error: bidError } = await supabase
        .from('tender_bids')
        .insert([{
          tender_id: tender.id,
          bidder_id: user.id,
          bid_amount: parseFloat(bidAmount),
          proposal_text: proposal,
          company_name: companyName,
          contact_person: contactPerson,
          contact_email: email,
          contact_phone: phone,
          data_entry_method: submissionMethod,
          status: 'submitted'
        }])
        .select()
        .maybeSingle();

      if (bidError) throw bidError;

      // Upload Excel file if method is excel
      if (submissionMethod === 'excel' && excelFile && parsedData) {
        const filePath = await TenderBidFileService.uploadBidExcel(tender.id, bid.id, excelFile);
        
        await supabase
          .from('tender_bids')
          .update({ 
            excel_file_path: filePath,
            excel_file_name: excelFile.name
          })
          .eq('id', bid.id);

        // Insert line items from parsed data
        const lineItemsToInsert = parsedData.lineItems.map((item, index) => ({
          bid_id: bid.id,
          tender_line_item_id: null,
          line_number: item.lineNumber,
          item_description: item.itemDescription,
          specification: item.specification,
          unit_of_measure: item.unitOfMeasure,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total: item.total,
          category: item.category,
          notes: item.notes
        }));

        const { error: lineItemsError } = await supabase
          .from('tender_bid_line_items')
          .insert(lineItemsToInsert);

        if (lineItemsError) throw lineItemsError;
      }

      // Insert line items from web form
      if (submissionMethod === 'web_form') {
        const lineItemsToInsert = lineItems
          .filter(item => lineItemPrices[item.id]?.unitPrice > 0)
          .map((item, index) => ({
            bid_id: bid.id,
            tender_line_item_id: item.id,
            line_number: index + 1,
            item_description: item.item_description,
            specification: item.specification,
            unit_of_measure: item.unit_of_measure,
            quantity: item.quantity,
            unit_price: lineItemPrices[item.id].unitPrice,
            total: (item.quantity || 1) * lineItemPrices[item.id].unitPrice,
            category: item.category,
            notes: lineItemPrices[item.id].notes
          }));

        const { error: lineItemsError } = await supabase
          .from('tender_bid_line_items')
          .insert(lineItemsToInsert);

        if (lineItemsError) throw lineItemsError;
      }

      setCurrentStep('complete');
      toast.success('Bid submitted successfully!');
      
      setTimeout(() => {
        onSuccess?.();
        onOpenChange(false);
        resetForm();
      }, 2000);
    } catch (error: any) {
      console.error('Error submitting bid:', error);
      toast.error('Failed to submit bid: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setCurrentStep('method');
    setSubmissionMethod(null);
    setExcelFile(null);
    setParsedData(null);
    setParseError(null);
    setLineItemPrices({});
    setBidAmount('');
    setProposal('');
  };

  const renderMethodSelection = () => (
    <div className="space-y-4">
      <DialogDescription>
        Choose how you'd like to submit your bid for this tender
      </DialogDescription>
      
      <div className="grid md:grid-cols-2 gap-4">
        <Card 
          className="cursor-pointer hover:border-primary transition-colors"
          onClick={() => {
            setSubmissionMethod('excel');
            setCurrentStep('upload');
          }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Excel Upload
            </CardTitle>
            <CardDescription>
              Download template, complete offline, and upload
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Pre-filled with line items</li>
              <li>• Complete at your own pace</li>
              <li>• Automatic calculations</li>
              <li>• Professional formatting</li>
            </ul>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:border-primary transition-colors"
          onClick={() => {
            setSubmissionMethod('web_form');
            setCurrentStep('upload');
          }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Online Form
            </CardTitle>
            <CardDescription>
              Fill in prices directly on this website
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• No downloads needed</li>
              <li>• Real-time calculations</li>
              <li>• Auto-save progress</li>
              <li>• Instant validation</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderExcelUpload = () => (
    <div className="space-y-4">
      <DialogDescription>
        Upload your completed tender quote template
      </DialogDescription>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        {uploading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Parsing Excel file...</p>
          </>
        ) : excelFile ? (
          <>
            <Check className="h-8 w-8 text-success mx-auto mb-2" />
            <p className="font-medium">{excelFile.name}</p>
            <p className="text-sm text-muted-foreground mt-1">Click or drag to replace</p>
          </>
        ) : (
          <>
            <p className="font-medium mb-2">Drop your Excel file here</p>
            <p className="text-sm text-muted-foreground">or click to browse</p>
            <p className="text-xs text-muted-foreground mt-2">Accepts .xlsx and .xls files</p>
          </>
        )}
      </div>

      {parseError && (
        <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="text-sm">{parseError}</div>
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setCurrentStep('method')}>
          Back
        </Button>
      </div>
    </div>
  );

  const renderWebForm = () => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
      <DialogDescription>
        Enter your unit prices for each line item
      </DialogDescription>

      <div className="space-y-4">
        {lineItems.map((item, index) => (
          <Card key={item.id}>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Badge variant="outline" className="mb-2">{item.category}</Badge>
                    <h4 className="font-medium">{item.item_description}</h4>
                    {item.specification && (
                      <p className="text-sm text-muted-foreground mt-1">{item.specification}</p>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {item.quantity} {item.unit_of_measure}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Unit Price ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={lineItemPrices[item.id]?.unitPrice || ''}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setLineItemPrices(prev => ({
                          ...prev,
                          [item.id]: { ...prev[item.id], unitPrice: value, notes: prev[item.id]?.notes || '' }
                        }));
                      }}
                    />
                  </div>
                  <div>
                    <Label>Total</Label>
                    <div className="h-10 flex items-center px-3 bg-muted rounded-md text-sm font-medium">
                      ${((item.quantity || 1) * (lineItemPrices[item.id]?.unitPrice || 0)).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Notes (optional)</Label>
                  <Input
                    placeholder="Any notes about this line item..."
                    value={lineItemPrices[item.id]?.notes || ''}
                    onChange={(e) => {
                      setLineItemPrices(prev => ({
                        ...prev,
                        [item.id]: { ...prev[item.id], unitPrice: prev[item.id]?.unitPrice || 0, notes: e.target.value }
                      }));
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-primary/5">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span className="font-medium">${calculateWebFormTotal().subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>GST (10%):</span>
              <span className="font-medium">${calculateWebFormTotal().gst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Grand Total:</span>
              <span>${calculateWebFormTotal().grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setCurrentStep('method')}>
          Back
        </Button>
        <Button onClick={handleWebFormSubmit} className="flex-1">
          Continue to Review
        </Button>
      </div>
    </div>
  );

  const renderReview = () => (
    <div className="space-y-4">
      <DialogDescription>
        Review your bid details before submission
      </DialogDescription>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bid Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <Label className="text-muted-foreground">Total Bid Amount</Label>
              <p className="text-2xl font-bold text-primary">${parseFloat(bidAmount).toFixed(2)}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Line Items</Label>
              <p className="text-lg font-medium">
                {submissionMethod === 'excel' ? parsedData?.lineItems.length : Object.keys(lineItemPrices).length}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label>Company Name</Label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </div>
            <div>
              <Label>Contact Person</Label>
              <Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Proposal / Cover Letter (optional)</Label>
              <Textarea
                placeholder="Describe your approach, experience, or any additional information..."
                value={proposal}
                onChange={(e) => setProposal(e.target.value)}
                rows={4}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setCurrentStep('upload')}>
          Back
        </Button>
        <Button onClick={handleFinalSubmit} disabled={submitting} className="flex-1">
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Bid'
          )}
        </Button>
      </div>
    </div>
  );

  const renderComplete = () => (
    <div className="text-center py-8">
      <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
        <Check className="h-8 w-8 text-success" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Bid Submitted Successfully!</h3>
      <p className="text-muted-foreground">
        Your bid has been submitted and is now under review by the tender issuer.
      </p>
    </div>
  );

  const getStepProgress = () => {
    const steps = { method: 0, upload: 33, review: 66, complete: 100 };
    return steps[currentStep];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Tender Bid</DialogTitle>
        </DialogHeader>

        {currentStep !== 'complete' && (
          <Progress value={getStepProgress()} className="mb-4" />
        )}

        {currentStep === 'method' && renderMethodSelection()}
        {currentStep === 'upload' && submissionMethod === 'excel' && renderExcelUpload()}
        {currentStep === 'upload' && submissionMethod === 'web_form' && renderWebForm()}
        {currentStep === 'review' && renderReview()}
        {currentStep === 'complete' && renderComplete()}
      </DialogContent>
    </Dialog>
  );
};
