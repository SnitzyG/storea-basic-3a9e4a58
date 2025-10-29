import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Label } from '@/components/ui/label';

interface DocumentCreatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentName: string;
  tenderId: string;
  projectData?: any;
  tenderData?: any;
  existingDocumentId?: string;
  onDocumentSaved: (docData: any) => void;
}

interface DocumentSection {
  id: string;
  title: string;
  content: string;
}

const getTemplateWithData = (docName: string, projectData: any, tenderData: any): DocumentSection[] => {
  const formatDate = (date: string) => {
    if (!date) return '[DATE]';
    return new Date(date).toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const templates: Record<string, DocumentSection[]> = {
    'Notice to Tenderers': [
      { id: '1', title: 'Project Title', content: tenderData?.title || projectData?.name || '[Project Title]' },
      { id: '2', title: 'Project Description', content: tenderData?.description || projectData?.description || '[Brief project description]' },
      { id: '3', title: 'Employer/Client Details', content: `Name: ${tenderData?.client_name || projectData?.client_name || '[Client Name]'}\nAddress: ${tenderData?.project_address || projectData?.address || '[Client Address]'}\nContact: [Contact Number]` },
      { id: '4', title: 'Tender Reference Number', content: tenderData?.tender_reference_no || tenderData?.tender_id || '[Reference Number]' },
      { id: '5', title: 'Scope of Works', content: '[Provide brief overview of works to be undertaken]' },
      { id: '6', title: 'Tender Submission Details', content: `Closing Date: ${formatDate(tenderData?.deadline)}\nClosing Time: ${tenderData?.deadline ? new Date(tenderData.deadline).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '[Time]'}\nSubmission Method: [Email/Physical/Portal]\nNumber of Copies: 1 original + 1 copy` },
      { id: '7', title: 'Tender Validity Period', content: '90 days from closing date' },
      { id: '8', title: 'Pre-Tender Meeting', content: 'Date: [To be advised]\nTime: [To be advised]\nLocation: ' + (tenderData?.project_address || projectData?.address || '[Site Address]') },
      { id: '9', title: 'Site Visit Information', content: 'Site visits can be arranged by appointment.\nContact: [Contact Person]\nPhone: [Phone Number]' },
      { id: '10', title: 'Tender Documents', content: 'The following documents form part of this tender:\n- Notice to Tenderers\n- Conditions of Tendering\n- General Conditions of Contract\n- Contract Schedules\n- Tender Form\n- Technical Specifications\n- Drawings' },
      { id: '11', title: 'Eligibility Criteria', content: '[Specify any licensing, insurance, or experience requirements]' },
      { id: '12', title: 'Language and Currency', content: 'Language: English\nCurrency: Australian Dollars (AUD)' },
      { id: '13', title: 'Tender Security', content: 'Amount: [Specify amount or percentage]\nForm: Bank guarantee or insurance bond\nValidity: Until contract signing + 28 days' },
      { id: '14', title: 'Contact for Queries', content: '[Contact Person Name]\n[Title]\nEmail: [Email]\nPhone: [Phone]' },
      { id: '15', title: 'Evaluation Criteria', content: 'Tenders will be evaluated based on:\n- Price (40%)\n- Experience and capability (30%)\n- Methodology and programme (20%)\n- Resources (10%)' }
    ],
    'Conditions of Tendering': [
      { id: '1', title: 'Definitions and Interpretation', content: 'In these Conditions:\n"Employer" means ' + (tenderData?.client_name || '[Client Name]') + '\n"Project" means ' + (tenderData?.title || '[Project Name]') + '\n"Site" means ' + (tenderData?.project_address || '[Site Address]') },
      { id: '2', title: 'Tender Documents', content: 'The tender documents comprise:\n[List all documents]\n\nOrder of precedence:\n1. Tender Form\n2. Conditions of Tendering\n3. General Conditions\n4. Specifications\n5. Drawings' },
      { id: '3', title: 'Examination of Documents and Site', content: 'Tenderers must:\n- Examine all tender documents\n- Visit and inspect the site\n- Obtain all necessary information\n\nThe Employer assumes no responsibility for errors or omissions by tenderers.' },
      { id: '4', title: 'Tender Pricing', content: `Basis: ${tenderData?.pricing_basis || 'Lump sum'}\nCurrency: Australian Dollars (AUD)\nIncludes: All labour, materials, plant, overheads, and profit\nGST: To be shown separately` },
      { id: '5', title: 'Tender Validity', content: `Tenders remain valid for 90 days from ${formatDate(tenderData?.deadline)}` },
      { id: '6', title: 'Tender Security', content: '[Specify amount, form, and validity period of tender bond/guarantee]' },
      { id: '7', title: 'Submission Requirements', content: `Format: [Electronic/Hard copy/Both]\nCopies: 1 original + 1 copy\nDeadline: ${formatDate(tenderData?.deadline)} at ${tenderData?.deadline ? new Date(tenderData.deadline).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '[Time]'}\nAddress: [Submission address]` },
      { id: '8', title: 'Late Tenders', content: 'Tenders received after the closing time will not be accepted.' },
      { id: '9', title: 'Clarifications and Amendments', content: 'All queries must be submitted in writing by [date].\nAny amendments will be issued as formal addenda.' },
      { id: '10', title: 'Evaluation and Award', content: 'The Employer:\n- Is not bound to accept the lowest or any tender\n- May negotiate with any tenderer\n- May split the work among tenderers\n- Will notify all tenderers of the outcome' }
    ],
    'Tender Form': [
      { id: '1', title: 'Tender Identification', content: `Tender Reference: ${tenderData?.tender_reference_no || tenderData?.tender_id || '[Reference]'}\nProject: ${tenderData?.title || '[Project Name]'}` },
      { id: '2', title: 'Tenderer Details', content: 'Company Name: [Insert name]\nABN: [Insert ABN]\nAddress: [Insert address]\nContact Person: [Insert name]\nPhone: [Insert phone]\nEmail: [Insert email]' },
      { id: '3', title: 'Declaration', content: `I/We hereby tender to execute and complete the works described as:\n${tenderData?.title || '[Project Name]'}\nlocated at ${tenderData?.project_address || '[Site Address]'}\n\nI/We have:\n✓ Received and examined all tender documents\n✓ Visited and inspected the site\n✓ Made all necessary investigations` },
      { id: '4', title: 'Tender Sum', content: `Total Tender Price (excluding GST): $[Insert amount]\nGST: $[Insert GST]\nTotal (including GST): $[Insert total]\n\nBudget Range: ${tenderData?.budget ? '$' + Number(tenderData.budget).toLocaleString() : '[Budget]'}` },
      { id: '5', title: 'Programme', content: `Proposed Commencement: ${formatDate(tenderData?.estimated_start_date)}\nCompletion Period: ${tenderData?.completion_weeks || '[weeks]'} weeks\nProposed Completion: ${tenderData?.estimated_start_date && tenderData?.completion_weeks ? formatDate(new Date(new Date(tenderData.estimated_start_date).getTime() + tenderData.completion_weeks * 7 * 24 * 60 * 60 * 1000).toISOString()) : '[Date]'}` },
      { id: '6', title: 'Tender Validity', content: `This tender remains open for acceptance for 90 days from ${formatDate(tenderData?.deadline)}` },
      { id: '7', title: 'Compliance Statements', content: 'I/We confirm:\n✓ Technical compliance with all requirements\n✓ Financial capacity to complete the works\n✓ Appropriate licenses and insurances' },
      { id: '8', title: 'Declarations', content: 'I/We declare:\n✓ No conflicts of interest\n✓ No collusion with other tenderers\n✓ All information provided is true and correct' },
      { id: '9', title: 'Signature', content: 'Authorized Signatory: ________________\nName: ________________\nPosition: ________________\nDate: ________________\nCompany Seal/Stamp:' }
    ],
    // Add more templates for other document types...
  };

  return templates[docName] || [
    { id: '1', title: 'Section 1', content: 'Enter content here...' }
  ];
};

export function DocumentCreatorDialog({
  open,
  onOpenChange,
  documentName,
  tenderId,
  projectData,
  tenderData,
  existingDocumentId,
  onDocumentSaved
}: DocumentCreatorDialogProps) {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [sections, setSections] = useState<DocumentSection[]>([]);
  const [documentTitle, setDocumentTitle] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (existingDocumentId) {
        loadExistingDocument();
      } else {
        // Initialize with template populated with project/tender data
        setSections(getTemplateWithData(documentName, projectData, tenderData));
        setDocumentTitle(documentName);
      }
    }
  }, [open, existingDocumentId, documentName, projectData, tenderData]);

  const loadExistingDocument = async () => {
    try {
      const { data, error } = await supabase
        .from('tender_package_documents')
        .select('*')
        .eq('id', existingDocumentId)
        .single();

      if (error) throw error;

      if (data.document_content) {
        setSections(JSON.parse(data.document_content));
      }
      setDocumentTitle(data.document_name);
    } catch (error: any) {
      console.error('Error loading document:', error);
      toast({
        title: "Error",
        description: "Failed to load document",
        variant: "destructive"
      });
    }
  };

  const handleAddSection = () => {
    const newSection: DocumentSection = {
      id: Date.now().toString(),
      title: 'New Section',
      content: ''
    };
    setSections([...sections, newSection]);
  };

  const handleUpdateSection = (id: string, field: 'title' | 'content', value: string) => {
    setSections(sections.map(section =>
      section.id === id ? { ...section, [field]: value } : section
    ));
  };

  const handleRemoveSection = (id: string) => {
    setSections(sections.filter(section => section.id !== id));
  };

  const handleSave = async () => {
    if (!tenderId) {
      toast({
        title: "Error",
        description: "Please save the tender first",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const documentContent = JSON.stringify(sections);
      
      if (existingDocumentId) {
        // Update existing document
        const { error } = await supabase
          .from('tender_package_documents')
          .update({
            document_name: documentTitle,
            document_content: documentContent,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingDocumentId);

        if (error) throw error;
      } else {
        // Create new document
        const { data, error } = await supabase
          .from('tender_package_documents')
          .insert({
            tender_id: tenderId,
            document_type: documentName,
            document_name: documentTitle,
            document_content: documentContent,
            file_path: '', // Will be generated when exported
            uploaded_by: profile?.user_id
          })
          .select()
          .single();

        if (error) throw error;
        onDocumentSaved(data);
      }

      toast({
        title: "Document saved",
        description: "Your document has been saved successfully"
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error('Save error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save document",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit {documentName}</DialogTitle>
          <DialogDescription>
            Customize the sections below and save when ready
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mb-4">
          <div>
            <Label htmlFor="docTitle">Document Title</Label>
            <Input
              id="docTitle"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
        
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {sections.map((section, index) => (
              <div key={section.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Input
                    value={section.title}
                    onChange={(e) => handleUpdateSection(section.id, 'title', e.target.value)}
                    className="font-semibold flex-1 mr-2"
                    placeholder="Section title"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveSection(section.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea
                  value={section.content}
                  onChange={(e) => handleUpdateSection(section.id, 'content', e.target.value)}
                  rows={6}
                  placeholder="Section content"
                  className="font-mono text-sm"
                />
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handleAddSection}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Section
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Document'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
