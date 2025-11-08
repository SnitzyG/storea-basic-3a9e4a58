import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTenderAccess } from '@/hooks/useTenderAccess';
import { useTenderLineItems, TenderLineItem } from '@/hooks/useTenderLineItems';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TenderDocumentCarousel } from '@/components/tenders/TenderDocumentCarousel';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Download, 
  FileText, 
  Calendar, 
  DollarSign, 
  MapPin, 
  Building,
  Loader2,
  Package,
  FileSpreadsheet,
  Upload,
  Save,
  Send,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Plus,
  MessageSquare,
  Percent
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { TenderBidFileService } from '@/services/TenderBidFileService';
import { downloadFromStorage } from '@/utils/storageUtils';
import { BidExcelParser, ParsedBidLineItem } from '@/services/BidExcelParser';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

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

const TenderBuilder = () => {
  const { tenderId } = useParams<{ tenderId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [tender, setTender] = useState<any>(null);
  const [packageDocs, setPackageDocs] = useState<TenderPackageDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [existingBid, setExistingBid] = useState<any>(null);
  const [bidDocuments, setBidDocuments] = useState<BidDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lineItemPricing, setLineItemPricing] = useState<LineItemPricing>({});
  const [bidNotes, setBidNotes] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [parsingExcel, setParsingExcel] = useState(false);
  const [showRFIDialog, setShowRFIDialog] = useState(false);
  const [rfiDocumentId, setRfiDocumentId] = useState<string>('');
  const [rfiDocumentName, setRfiDocumentName] = useState<string>('');
  const [rfiMessage, setRfiMessage] = useState('');
  const [showManualEntryDialog, setShowManualEntryDialog] = useState(false);
  const [manualLineItem, setManualLineItem] = useState({
    line_number: 0,
    item_description: '',
    quantity: 1,
    unit_price: 0,
    category: 'General'
  });
  const [builderMargin, setBuilderMargin] = useState(0);
  const [includeMargin, setIncludeMargin] = useState(false);
  const [sectionHeaders, setSectionHeaders] = useState<string[]>([]);
  
  const { lineItems: fetchedLineItems, loading: lineItemsLoading } = useTenderLineItems(tender?.id);
  const [lineItems, setLineItems] = useState<TenderLineItem[]>([]);

  // Sync fetched line items to local state
  useEffect(() => {
    if (fetchedLineItems.length > 0) {
      setLineItems(fetchedLineItems);
      // Extract unique section headers from categories
      const uniqueHeaders = Array.from(new Set(fetchedLineItems.map(item => item.category).filter(Boolean)));
      setSectionHeaders(uniqueHeaders as string[]);
    }
  }, [fetchedLineItems]);

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

  // Fetch tender details and existing bid
  useEffect(() => {
    const fetchTenderDetails = async () => {
      if (!user || !tenderId) {
        console.log('TenderBuilder: Missing user or tenderId', { user: !!user, tenderId });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('TenderBuilder: Fetching tender details for:', tenderId);
        
        // Detect if tenderId is a UUID (36 chars with hyphens) or human-readable ID
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tenderId);
        console.log('TenderBuilder: ID type:', isUUID ? 'UUID' : 'Human-readable');
        
        // Build query based on ID type
        let query = supabase
          .from('tenders')
          .select('*');
        
        if (isUUID) {
          query = query.eq('id', tenderId);
        } else {
          query = query.eq('tender_id', tenderId);
        }
        
        const { data: tenderData, error: tenderError } = await query.maybeSingle();

        if (tenderError) {
          console.error('TenderBuilder: Error fetching tender:', tenderError);
          throw tenderError;
        }
        
        if (!tenderData) {
          console.error('TenderBuilder: Tender not found for ID:', tenderId);
          toast.error('Tender not found');
          setLoading(false);
          return;
        }
        
        console.log('TenderBuilder: Tender loaded:', tenderData.tender_id || tenderData.id);
        
        // Fetch profile and company info separately
        const enrichedTender: any = { ...tenderData };
        
        if (tenderData.issued_by) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, company_id')
            .eq('user_id', tenderData.issued_by)
            .single();
          
          if (profileData) {
            enrichedTender.profiles = profileData;
            
            // Fetch company info
            if (profileData.company_id) {
              const { data: companyData } = await supabase
                .from('companies')
                .select('name, address')
                .eq('id', profileData.company_id)
                .single();
              
              if (companyData) {
                enrichedTender.profiles.companies = companyData;
              }
            }
          }
        }
        
        setTender(enrichedTender);

        // Fetch package documents - use tender.id not tender_id
        if (tenderData) {
          const { data: docsData, error: docsError } = await supabase
            .from('tender_package_documents')
            .select('*')
            .eq('tender_id', tenderData.id)
            .order('uploaded_at', { ascending: false });

          if (docsError) throw docsError;
          setPackageDocs(docsData || []);

          // Check for existing bid - use tender.id not tender_id
          const { data: bidData } = await supabase
            .from('tender_bids')
            .select('*')
            .eq('tender_id', tenderData.id)
            .eq('bidder_id', user.id)
            .maybeSingle();

            if (bidData) {
              setExistingBid(bidData);
              setBidNotes((bidData as any).proposal || '');
              setBuilderMargin((bidData as any).builder_margin || 0);
              setIncludeMargin(((bidData as any).builder_margin || 0) > 0);
              
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
        }
      } catch (error: any) {
        console.error('Error fetching tender details:', error);
        toast.error('Failed to load tender details');
      } finally {
        setLoading(false);
      }
    };

    fetchTenderDetails();
  }, [tenderId, user]);

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
      console.log('Downloading document:', { fileName, filePath: doc.file_path });
      
      // Download from tender-packages bucket for tender documents
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('tender-packages')
        .download(doc.file_path);

      if (downloadError) {
        console.error('Download error:', downloadError);
        throw downloadError;
      }

      // Create blob URL and trigger download
      const url = URL.createObjectURL(fileData);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Download started');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  const handleDownloadAllDocuments = async () => {
    if (packageDocs.length === 0) {
      toast.error('No documents available to download');
      return;
    }

    try {
      toast.info('Preparing documents for download...');
      const zip = new JSZip();
      
      for (const doc of packageDocs) {
        try {
          const { data, error } = await supabase.storage
            .from('documents')
            .download(doc.file_path);
          
          if (error) throw error;
          if (data) {
            zip.file(doc.document_name, data);
          }
        } catch (err) {
          console.error('Error downloading file:', doc.document_name, err);
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `tender-${tender.tender_id}-documents.zip`);
      toast.success('All documents downloaded successfully');
    } catch (error) {
      console.error('Error creating zip file:', error);
      toast.error('Failed to download all documents');
    }
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      toast.error('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    setParsingExcel(true);
    try {
      // Parse the Excel file
      const parsedData = await BidExcelParser.parseExcelFile(file);

      // Flexible validation based on whether tender has line items
      if (lineItems.length === 0) {
        // Tender has no predefined items - create dynamic line items from Excel
        const dynamicLineItems = parsedData.lineItems.map((item, index) => ({
          id: `excel-${Date.now()}-${index}`,
          tender_id: tender.id,
          line_number: index + 1,
          item_description: item.item_description,
          category: item.category,
          quantity: item.quantity,
          unit_of_measure: item.unit_of_measure,
          specification: item.specification || null,
          unit_price: null,
          total: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        
        setLineItems(dynamicLineItems);

        // Extract section headers from parsed data
        if (parsedData.sectionHeaders && parsedData.sectionHeaders.length > 0) {
          const headers = parsedData.sectionHeaders.map(h => h.title);
          setSectionHeaders(headers);
        } else {
          // Extract from categories
          const uniqueHeaders = Array.from(new Set(dynamicLineItems.map(item => item.category).filter(Boolean)));
          setSectionHeaders(uniqueHeaders as string[]);
        }

        // Set pricing from Excel
        const newPricing: LineItemPricing = {};
        dynamicLineItems.forEach((item, index) => {
          newPricing[item.id] = {
            unit_price: parsedData.lineItems[index].unit_price,
            notes: parsedData.lineItems[index].notes || ''
          };
        });
        setLineItemPricing(newPricing);

        toast.success('Excel uploaded successfully', {
          description: `${parsedData.lineItems.length} line items imported from your quote`
        });
      } else {
        // Tender has predefined items - validate against them
        const validation = BidExcelParser.validateAgainstTender(
          parsedData.lineItems,
          lineItems
        );

        if (!validation.valid) {
          toast.error('Excel validation failed', {
            description: validation.errors.slice(0, 3).join(', ')
          });
          return;
        }

        // Update line item pricing from parsed data
        const newPricing: LineItemPricing = {};
        parsedData.lineItems.forEach(item => {
          // Find matching tender line item
          const tenderLineItem = lineItems.find(li => li.line_number === item.line_number);
          if (tenderLineItem) {
            newPricing[tenderLineItem.id] = {
              unit_price: item.unit_price,
              notes: item.notes || ''
            };
          }
        });

        setLineItemPricing(newPricing);
        
        toast.success('Excel file parsed successfully', {
          description: `${parsedData.lineItems.length} line items imported`
        });
      }
      
      if (parsedData.notes) {
        setBidNotes(parsedData.notes);
      }

      // Upload the Excel file as a bid document
      const uploadedDoc: BidDocument = {
        name: file.name,
        file_path: '', // Will be set after upload
        file_size: file.size,
        uploaded_at: new Date().toISOString()
      };

      // Upload to storage
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

      uploadedDoc.file_path = filePath;
      setBidDocuments([...bidDocuments, uploadedDoc]);

    } catch (error: any) {
      console.error('Error parsing Excel:', error);
      toast.error('Failed to parse Excel file', {
        description: error.message
      });
    } finally {
      setParsingExcel(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleRequestRFI = async (documentId: string, documentName: string) => {
    setRfiDocumentId(documentId);
    setRfiDocumentName(documentName);
    setRfiMessage('');
    setShowRFIDialog(true);
  };

  const handleSubmitRFI = async () => {
    if (!tender || !rfiMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      // Create RFI
      const { error } = await supabase
        .from('rfis')
        .insert({
          project_id: tender.project_id,
          question: rfiMessage,
          subject: `Tender Document Query: ${rfiDocumentName}`,
          rfi_type: 'request_for_information',
          priority: 'medium',
          status: 'open',
          raised_by: user!.id,
          category: 'Tender Document',
          attachments: [{ type: 'tender_document', document_id: rfiDocumentId, document_name: rfiDocumentName, tender_id: tender.id }]
        } as any);

      if (error) throw error;

      toast.success('RFI submitted successfully');
      setShowRFIDialog(false);
      setRfiMessage('');
    } catch (error: any) {
      console.error('Error submitting RFI:', error);
      toast.error('Failed to submit RFI');
    }
  };

  const handleAddManualLineItem = () => {
    if (!manualLineItem.item_description.trim()) {
      toast.error('Please enter item description');
      return;
    }

    const nextLineNumber = lineItems.length > 0 
      ? Math.max(...lineItems.map(li => li.line_number)) + 1 
      : 1;

    // Create a new line item object
    const newLineItem: TenderLineItem = {
      id: `manual-${Date.now()}`,
      tender_id: tender.id,
      line_number: nextLineNumber,
      item_description: manualLineItem.item_description,
      category: manualLineItem.category,
      quantity: manualLineItem.quantity,
      unit_of_measure: null,
      specification: null,
      unit_price: null,
      total: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Add the line item to the lineItems array
    setLineItems(prev => [...prev, newLineItem]);

    // Also add pricing
    setLineItemPricing(prev => ({
      ...prev,
      [newLineItem.id]: {
        unit_price: manualLineItem.unit_price,
        notes: ''
      }
    }));

    toast.success('Manual line item added');
    setShowManualEntryDialog(false);
    
    // Reset form
    setManualLineItem({
      line_number: 0,
      item_description: '',
      quantity: 1,
      unit_price: 0,
      category: 'General'
    });
  };

  const handleDeleteLineItem = (itemId: string) => {
    setLineItems(prev => prev.filter(item => item.id !== itemId));
    setLineItemPricing(prev => {
      const newPricing = { ...prev };
      delete newPricing[itemId];
      return newPricing;
    });
    toast.success('Line item deleted');
  };

  const handleSaveProgress = async () => {
    if (!tender || !user) return;
    
    setSubmitting(true);
    try {
      const totals = calculateTotals();
      let bidId = existingBid?.id;
      
      if (existingBid) {
        await supabase
          .from('tender_bids')
          .update({
            bid_amount: totals.grandTotal,
            builder_margin: includeMargin ? builderMargin : 0,
            attachments: bidDocuments as any,
            status: 'draft',
            updated_at: new Date().toISOString()
          } as any)
          .eq('id', existingBid.id);
      } else {
        const { data: newBid } = await supabase
          .from('tender_bids')
          .insert({
            tender_id: tender.id,
            bidder_id: user.id,
            bid_amount: totals.grandTotal,
            builder_margin: includeMargin ? builderMargin : 0,
            attachments: bidDocuments as any,
            status: 'draft'
          } as any)
          .select()
          .single();
        
        if (newBid) {
          setExistingBid(newBid);
          bidId = newBid.id;
        }
      }

      // Save line item pricing
      if (bidId) {
        // Delete existing line items for this bid
        await supabase
          .from('tender_bid_line_items')
          .delete()
          .eq('bid_id', bidId);

        // Insert updated line items (only for items with real tender_line_item IDs)
        const bidLineItemsData = lineItems
          .filter(item => !item.id.startsWith('excel-') && !item.id.startsWith('manual-'))
          .map(item => {
            const pricing = lineItemPricing[item.id];
            return {
              bid_id: bidId,
              tender_line_item_id: item.id,
              line_number: item.line_number,
              item_description: item.item_description,
              specification: item.specification || '',
              unit_of_measure: item.unit_of_measure || '',
              quantity: item.quantity || 1,
              category: item.category,
              unit_price: pricing?.unit_price || 0,
              total: (item.quantity || 1) * (pricing?.unit_price || 0),
              notes: pricing?.notes || ''
            };
          });

        if (bidLineItemsData.length > 0) {
          await supabase
            .from('tender_bid_line_items')
            .insert(bidLineItemsData);
        }
      }
      
      toast.success('Progress saved');
    } catch (error) {
      console.error('Error saving progress:', error);
      toast.error('Failed to save progress');
    } finally {
      setSubmitting(false);
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
    const marginAmount = includeMargin ? (subtotal * builderMargin) / 100 : 0;
    const subtotalWithMargin = subtotal + marginAmount;
    const gst = subtotalWithMargin * 0.1;
    const grandTotal = subtotalWithMargin + gst;
    
    return { subtotal, marginAmount, subtotalWithMargin, gst, grandTotal };
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
      
      // STEP 1: Create dynamic line items in tender_line_items if they don't exist in DB
      const dynamicItems = lineItems.filter(item => 
        item.id.startsWith('excel-') || item.id.startsWith('manual-')
      );
      
      const lineItemIdMapping: Record<string, string> = {};
      
      if (dynamicItems.length > 0) {
        const itemsToInsert = dynamicItems.map(item => {
          const pricing = lineItemPricing[item.id];
          return {
            tender_id: tender.id,
            line_number: item.line_number,
            item_description: item.item_description,
            category: item.category,
            quantity: item.quantity,
            unit_of_measure: item.unit_of_measure,
            specification: item.specification,
            unit_price: pricing?.unit_price || 0,
            total: (item.quantity || 1) * (pricing?.unit_price || 0)
          };
        });
        
        const { data: createdItems, error: itemsError } = await supabase
          .from('tender_line_items')
          .insert(itemsToInsert)
          .select();
          
        if (itemsError) throw itemsError;
        
        // Map temp IDs to real DB IDs
        dynamicItems.forEach((item, index) => {
          if (createdItems && createdItems[index]) {
            lineItemIdMapping[item.id] = createdItems[index].id;
          }
        });
      }
      
      let bidId = existingBid?.id;

      // STEP 2: Create or update bid
      if (existingBid) {
        // Update existing bid
        const { error: updateError } = await supabase
          .from('tender_bids')
          .update({
            bid_amount: totals.grandTotal,
            builder_margin: includeMargin ? builderMargin : 0,
            attachments: bidDocuments as any,
            status: 'submitted',
            submitted_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as any)
          .eq('id', existingBid.id);

        if (updateError) throw updateError;
      } else {
        // Create new bid
        const { data: newBid, error: createError } = await supabase
          .from('tender_bids')
          .insert({
            tender_id: tender.id,
            bidder_id: user!.id,
            bid_amount: totals.grandTotal,
            builder_margin: includeMargin ? builderMargin : 0,
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

      // STEP 3: Delete existing line items and create new ones with corrected IDs
      await supabase
        .from('tender_bid_line_items')
        .delete()
        .eq('bid_id', bidId);

      const lineItemsToInsert = lineItems.map(item => {
        const realId = lineItemIdMapping[item.id] || item.id;
        const pricing = lineItemPricing[item.id];
        const quantity = item.quantity || 1;
        const total = quantity * pricing.unit_price;

        return {
          bid_id: bidId,
          tender_line_item_id: realId,
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

  if (!tender) {
    return (
      <AppLayout>
        <Card className="max-w-2xl mx-auto mt-8">
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
          <div>
            <h1 className="text-3xl font-bold">{tender.title}</h1>
            <p className="text-muted-foreground">Tender ID: {tender.tender_id}</p>
          </div>
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

          {/* Tender Details Tab */}
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
                  {tender.profiles && (
                    <>
                      <div className="flex items-start gap-3">
                        <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Architect Name</p>
                          <p className="text-sm text-muted-foreground">{tender.profiles.full_name || 'Not specified'}</p>
                        </div>
                      </div>

                      {tender.profiles.companies && (
                        <div className="flex items-start gap-3">
                          <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div>
                            <p className="text-sm font-medium">Architect Company</p>
                            <p className="text-sm text-muted-foreground">{tender.profiles.companies.name || 'Not specified'}</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}

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
                <CardTitle>Tender Documents</CardTitle>
                <CardDescription>Review and download tender package documents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    {packageDocs.length} document(s) available
                  </p>
                  {packageDocs.length > 0 && (
                    <Button onClick={handleDownloadAllDocuments} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download All
                    </Button>
                  )}
                </div>

                {packageDocs.length > 0 && (
                  <div className="space-y-3">
                    {packageDocs.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">{doc.document_name}</p>
                            <p className="text-xs text-muted-foreground">{doc.document_type}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => handleDownloadDocument(doc)} variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                          <Button
                            onClick={() => {
                              setRfiDocumentId(doc.id);
                              setRfiDocumentName(doc.document_name);
                              setShowRFIDialog(true);
                            }}
                            variant="outline"
                            size="sm"
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            RFI
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {packageDocs.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No tender documents available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Submit Bid Tab */}
          <TabsContent value="pricing" className="space-y-6">
            {/* Excel Upload and Manual Entry */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader>
                <CardTitle>Quick Import Options</CardTitle>
                <CardDescription>
                  Upload your completed quote Excel or add line items manually
                </CardDescription>
              </CardHeader>
              <CardContent className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="file"
                    id="excel-upload"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={handleExcelUpload}
                    disabled={parsingExcel || isExpired}
                  />
                  <label htmlFor="excel-upload">
                    <Button
                      asChild
                      variant="outline"
                      className="w-full cursor-pointer"
                      disabled={parsingExcel || isExpired}
                    >
                      <div>
                        {parsingExcel ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Parsing Excel...
                          </>
                        ) : (
                          <>
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            Upload Quote Excel
                          </>
                        )}
                      </div>
                    </Button>
                  </label>
                  <p className="text-xs text-muted-foreground mt-2">
                    Automatically import pricing from your completed quote template
                  </p>
                </div>
                <div className="flex-1">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowManualEntryDialog(true)}
                    disabled={isExpired}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Manual Line Item
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Manually add custom line items to your bid
                  </p>
                </div>
              </CardContent>
            </Card>

            {lineItems.length > 0 && (
              <div className="flex justify-end">
                <Button onClick={handleSaveProgress} variant="outline" disabled={isExpired}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Progress
                </Button>
              </div>
            )}

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
                  <>
                    <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[60px]">#</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="w-[100px]">Qty</TableHead>
                          <TableHead className="w-[140px]">Unit Price</TableHead>
                          <TableHead className="w-[120px]">Total</TableHead>
                          <TableHead className="w-[200px]">Notes</TableHead>
                          <TableHead className="w-[80px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          // Group line items by section header
                          const sections: { [key: string]: typeof lineItems } = {};
                          let currentSection = '';
                          
                          lineItems.forEach(item => {
                            const section = item.category || 'General';
                            if (!sections[section]) {
                              sections[section] = [];
                            }
                            sections[section].push(item);
                          });

                          return Object.entries(sections).flatMap(([sectionName, sectionItems], sectionIdx) => {
                            const rows = [];
                            
                            // Add section header row if it's not "General" or if there are multiple sections
                            if (sectionName !== 'General' || Object.keys(sections).length > 1) {
                              rows.push(
                                <TableRow key={`section-${sectionIdx}`} className="bg-muted/50 hover:bg-muted/50">
                                  <TableCell colSpan={8} className="font-bold text-base py-3">
                                    {sectionName}
                                  </TableCell>
                                </TableRow>
                              );
                            }

                            // Add line items for this section
                            sectionItems.forEach((item) => {
                              const pricing = lineItemPricing[item.id] || { unit_price: 0, notes: '' };
                              const total = (item.quantity || 1) * pricing.unit_price;
                              
                              rows.push(
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
                                  <TableCell>
                                    <Input
                                      type="number"
                                      step="1"
                                      min="1"
                                      value={item.quantity || 1}
                                      onChange={(e) => {
                                        const newQty = parseInt(e.target.value) || 1;
                                        setLineItems(prev => prev.map(li => 
                                          li.id === item.id ? { ...li, quantity: newQty } : li
                                        ));
                                      }}
                                      disabled={isExpired}
                                      className="w-20"
                                    />
                                  </TableCell>
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
                                     <Textarea
                                       placeholder="Additional Notes"
                                       value={pricing.notes || ''}
                                       onChange={(e) => {
                                         setLineItemPricing(prev => ({
                                           ...prev,
                                           [item.id]: { ...prev[item.id], notes: e.target.value }
                                         }));
                                       }}
                                       disabled={isExpired}
                                       className="min-h-[60px]"
                                     />
                                   </TableCell>
                                   <TableCell>
                                     <Button
                                       variant="ghost"
                                       size="icon"
                                       onClick={() => handleDeleteLineItem(item.id)}
                                       disabled={isExpired}
                                     >
                                       <Trash2 className="h-4 w-4 text-destructive" />
                                     </Button>
                                   </TableCell>
                                    </TableRow>
                                );
                            });

                            return rows;
                          });
                        })()}
                      </TableBody>
                    </Table>
                  </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-2">
                      This tender has no predefined line items
                    </p>
                    <p className="text-sm text-muted-foreground">
                      You can upload your Excel quote or add items manually above
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Totals */}
            {lineItems.length > 0 && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex justify-between text-lg">
                      <span className="font-medium">Subtotal:</span>
                      <span className="font-semibold">${totals.subtotal.toFixed(2)}</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="include-margin"
                          checked={includeMargin}
                          onCheckedChange={(checked) => setIncludeMargin(checked as boolean)}
                        />
                        <Label htmlFor="include-margin" className="cursor-pointer">
                          Include Builder Margin
                        </Label>
                      </div>
                      
                      {includeMargin && (
                        <div className="flex items-center gap-2 ml-6">
                          <Input
                            type="number"
                            value={builderMargin}
                            onChange={(e) => setBuilderMargin(parseFloat(e.target.value) || 0)}
                            placeholder="0"
                            className="w-24"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                          <span className="text-sm text-muted-foreground">%</span>
                        </div>
                      )}
                    </div>

                    {includeMargin && builderMargin > 0 && (
                      <>
                        <div className="flex justify-between text-lg">
                          <span className="font-medium">Builder Margin:</span>
                          <span className="font-semibold">${totals.marginAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-lg">
                          <span className="font-medium">Subtotal (incl. margin):</span>
                          <span className="font-semibold">${totals.subtotalWithMargin.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                    
                    <Separator />
                    
                    <div className="flex justify-between text-xl font-bold text-primary">
                      <span>Grand Total (incl. GST):</span>
                      <span>${totals.grandTotal.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-2xl font-bold text-primary">
                      <span>Grand Total (incl. GST):</span>
                      <span>${totals.grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Submit Bid Tab - includes pricing, documents, and submit */}
          <TabsContent value="pricing" className="space-y-6">
            {/* Pricing Section */}
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
                
                {/* Save Documents Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveProgress}
                    disabled={submitting || isExpired}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Documents
                      </>
                    )}
                  </Button>
                </div>
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

      {/* RFI Dialog */}
      <Dialog open={showRFIDialog} onOpenChange={setShowRFIDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request for Information</DialogTitle>
            <DialogDescription>
              Submit an RFI regarding: {rfiDocumentName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rfi-subject">Subject</Label>
              <Input
                id="rfi-subject"
                value={`Tender Document Query: ${rfiDocumentName}`}
                disabled
              />
            </div>
            <div>
              <Label htmlFor="rfi-message">Message</Label>
              <Textarea
                id="rfi-message"
                placeholder="Describe your question or concern..."
                value={rfiMessage}
                onChange={(e) => setRfiMessage(e.target.value)}
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRFIDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitRFI} disabled={!rfiMessage.trim()}>
              <Send className="h-4 w-4 mr-2" />
              Submit RFI
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Line Item Entry Dialog */}
      <Dialog open={showManualEntryDialog} onOpenChange={setShowManualEntryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Manual Line Item</DialogTitle>
            <DialogDescription>
              Add a custom line item to your bid
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manual-desc">Item Description *</Label>
              <Input
                id="manual-desc"
                placeholder="E.g., Additional site clearing"
                value={manualLineItem.item_description}
                onChange={(e) => setManualLineItem(prev => ({
                  ...prev,
                  item_description: e.target.value
                }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manual-qty">Quantity</Label>
                <Input
                  id="manual-qty"
                  type="number"
                  min="0"
                  step="0.01"
                  value={manualLineItem.quantity}
                  onChange={(e) => setManualLineItem(prev => ({
                    ...prev,
                    quantity: parseFloat(e.target.value) || 0
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manual-price">Unit Price ($)</Label>
                <Input
                  id="manual-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={manualLineItem.unit_price}
                  onChange={(e) => setManualLineItem(prev => ({
                    ...prev,
                    unit_price: parseFloat(e.target.value) || 0
                  }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="manual-category">Category</Label>
              <Input
                id="manual-category"
                placeholder="E.g., Preliminaries, Site Works, etc."
                value={manualLineItem.category}
                onChange={(e) => setManualLineItem(prev => ({ ...prev, category: e.target.value }))}
              />
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Total:</span>
                <span className="font-bold">
                  ${(manualLineItem.quantity * manualLineItem.unit_price).toFixed(2)}
                </span>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowManualEntryDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddManualLineItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Line Item
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default TenderBuilder;
