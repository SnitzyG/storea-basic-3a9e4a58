import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileText, 
  X, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle,
  Download,
  Send,
  Save,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import * as XLSX from 'xlsx';

interface EnhancedCreateTenderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

interface TenderFormData {
  title: string;
  project_title: string;
  project_address: string;
  client_name: string;
  tender_reference: string;
  message: string;
  estimated_start_date: string;
  submission_deadline: string;
  submission_deadline_time: string;
  tender_specification_file: File | null;
  scope_of_works_file: File | null;
  upload_documents: File[];
  construction_items: ConstructionItem[];
  builder_details: BuilderDetail[];
}

interface ConstructionItem {
  id: string;
  description: string;
  unit: string;
  quantity: number;
  category: string;
}

interface BuilderDetail {
  id: string;
  company_name: string;
  address: string;
  phone: string;
  contact_person: string;
  email: string;
}

export const EnhancedCreateTenderDialog = ({ open, onOpenChange, projectId }: EnhancedCreateTenderDialogProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<TenderFormData>({
    title: '',
    project_title: '',
    project_address: '',
    client_name: '',
    tender_reference: '',
    message: '',
    estimated_start_date: '',
    submission_deadline: '',
    submission_deadline_time: '17:00',
    tender_specification_file: null,
    scope_of_works_file: null,
    upload_documents: [],
    construction_items: [
      { id: '1', description: 'Excavation and Site Preparation', unit: 'sqm', quantity: 100, category: 'Site Work' },
      { id: '2', description: 'Concrete Foundation', unit: 'cubic meters', quantity: 50, category: 'Foundations' },
      { id: '3', description: 'Structural Steel Frame', unit: 'tonnes', quantity: 25, category: 'Structure' },
      { id: '4', description: 'Roofing Materials and Installation', unit: 'sqm', quantity: 200, category: 'Roofing' },
      { id: '5', description: 'Electrical Installation', unit: 'points', quantity: 30, category: 'Electrical' },
      { id: '6', description: 'Plumbing Installation', unit: 'fixtures', quantity: 15, category: 'Plumbing' }
    ],
    builder_details: []
  });
  const [isReadyForTender, setIsReadyForTender] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();

  // Auto-populate project details when dialog opens
  React.useEffect(() => {
    if (open && projectId) {
      const fetchProjectDetails = async () => {
        const { data: project } = await supabase
          .from('projects')
          .select('name, address')
          .eq('id', projectId)
          .single();

        if (project) {
          // Generate tender reference number
          const tenderRef = `TDR-${Date.now().toString().slice(-8)}`;
          
          setFormData(prev => ({
            ...prev,
            project_title: project.name || '',
            project_address: project.address || '',
            client_name: '', // Will be filled from homeowner profile
            tender_reference: tenderRef
          }));
        }
      };

      fetchProjectDetails();
    }
  }, [open, projectId]);

  const steps = [
    { number: 1, title: 'Basic Details', description: 'Tender information and timeline' },
    { number: 2, title: 'Documents', description: 'Upload specifications and documents' },
    { number: 3, title: 'Construction Items', description: 'Review items to be quoted' },
    { number: 4, title: 'Confirmation', description: 'Review and confirm tender' },
    { number: 5, title: 'Builder Details', description: 'Add builders to invite' },
    { number: 6, title: 'Send Invitations', description: 'Send tender invitations' }
  ];

  const currentStepInfo = steps[currentStep - 1];
  const progress = (currentStep / steps.length) * 100;

  const updateFormData = (field: keyof TenderFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (field: 'tender_specification_file' | 'scope_of_works_file', file: File | null) => {
    updateFormData(field, file);
  };

  const handleDocumentsUpload = (files: FileList) => {
    const newFiles = Array.from(files);
    updateFormData('upload_documents', [...formData.upload_documents, ...newFiles]);
  };

  const removeDocument = (index: number) => {
    const newDocs = formData.upload_documents.filter((_, i) => i !== index);
    updateFormData('upload_documents', newDocs);
  };

  const downloadConstructionItems = () => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(formData.construction_items.map(item => ({
      'Item Description': item.description,
      'Unit': item.unit,
      'Quantity': item.quantity,
      'Category': item.category,
      'Unit Price': '',
      'Total Price': ''
    })));
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Construction Items');
    XLSX.writeFile(workbook, `${formData.title || 'tender'}-construction-items.xlsx`);
    
    toast({
      title: "Download Started",
      description: "Construction items Excel file has been downloaded"
    });
  };

  const addBuilderDetail = () => {
    const newBuilder: BuilderDetail = {
      id: Date.now().toString(),
      company_name: '',
      address: '',
      phone: '',
      contact_person: '',
      email: ''
    };
    updateFormData('builder_details', [...formData.builder_details, newBuilder]);
  };

  const updateBuilderDetail = (id: string, field: keyof BuilderDetail, value: string) => {
    const updatedBuilders = formData.builder_details.map(builder =>
      builder.id === id ? { ...builder, [field]: value } : builder
    );
    updateFormData('builder_details', updatedBuilders);
  };

  const removeBuilderDetail = (id: string) => {
    const updatedBuilders = formData.builder_details.filter(builder => builder.id !== id);
    updateFormData('builder_details', updatedBuilders);
  };

  const saveDraft = async () => {
    setLoading(true);
    try {
      // Upload files to storage if any
      let tenderSpecPath = null;
      let scopeWorksPath = null;
      let documentPaths: string[] = [];

      if (formData.tender_specification_file) {
        const { data, error } = await supabase.storage
          .from('documents')
          .upload(`tenders/${projectId}/specifications/${formData.tender_specification_file.name}`, formData.tender_specification_file);
        if (error) throw error;
        tenderSpecPath = data.path;
      }

      if (formData.scope_of_works_file) {
        const { data, error } = await supabase.storage
          .from('documents')
          .upload(`tenders/${projectId}/scope-of-works/${formData.scope_of_works_file.name}`, formData.scope_of_works_file);
        if (error) throw error;
        scopeWorksPath = data.path;
      }

      // Upload additional documents
      for (const doc of formData.upload_documents) {
        const { data, error } = await supabase.storage
          .from('documents')
          .upload(`tenders/${projectId}/documents/${doc.name}`, doc);
        if (error) throw error;
        documentPaths.push(data.path);
      }

      // Create tender record
      const { error: tenderError } = await supabase
        .from('tenders')
        .insert([{
          project_id: projectId,
          title: formData.title,
          message: formData.message,
          estimated_start_date: formData.estimated_start_date || null,
          deadline: `${formData.submission_deadline}T${formData.submission_deadline_time}:00`,
          tender_specification_path: tenderSpecPath,
          scope_of_works_path: scopeWorksPath,
          documents: documentPaths.map(path => ({ path, name: path.split('/').pop() })) as any,
          construction_items: formData.construction_items as any,
          builder_details: formData.builder_details as any,
          is_draft: true,
          is_ready_for_tender: false,
          issued_by: user?.id,
          status: 'draft'
        }]);

      if (tenderError) throw tenderError;

      toast({
        title: "Draft Saved",
        description: "Tender has been saved as draft"
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const markReadyForTender = async () => {
    if (!isReadyForTender) {
      setIsReadyForTender(true);
      toast({
        title: "Marked as Ready",
        description: "Tender is now ready to be shared with builders"
      });
    }
  };

  const sendInvitations = async () => {
    if (!isReadyForTender || formData.builder_details.length === 0) {
      toast({
        title: "Cannot Send Invitations",
        description: "Tender must be ready and have builders added",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // First save the tender
      await saveDraft();
      
      // Then send invitations via edge function
      for (const builder of formData.builder_details) {
        if (builder.email) {
          const { error } = await supabase.functions.invoke('send-tender-invitation', {
            body: {
              email: builder.email,
              company_name: builder.company_name,
              contact_person: builder.contact_person,
              tender_title: formData.title,
              project_id: projectId,
              submission_deadline: `${formData.submission_deadline} ${formData.submission_deadline_time}`
            }
          });

          if (error) {
            console.error('Error sending invitation:', error);
          }
        }
      }

      toast({
        title: "Invitations Sent",
        description: `Tender invitations sent to ${formData.builder_details.length} builders`
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return formData.title.trim() && formData.message.trim() && formData.submission_deadline;
      case 2:
        return true; // Documents are optional
      case 3:
        return formData.construction_items.length > 0;
      case 4:
        return isReadyForTender;
      case 5:
        return formData.builder_details.length > 0;
      default:
        return true;
    }
  };

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDeadline = tomorrow.toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Create New Tender
            <Badge variant="outline" className="ml-2">
              Step {currentStep} of {steps.length}
            </Badge>
          </DialogTitle>
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground">
              {currentStepInfo.title}: {currentStepInfo.description}
            </p>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Basic Details */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Tender Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="project_title">Project Title *</Label>
                    <Input
                      id="project_title"
                      value={formData.project_title}
                      onChange={(e) => updateFormData('project_title', e.target.value)}
                      className="mt-1"
                      disabled
                    />
                  </div>

                  <div>
                    <Label htmlFor="project_address">Project Address *</Label>
                    <Input
                      id="project_address"
                      value={formData.project_address}
                      onChange={(e) => updateFormData('project_address', e.target.value)}
                      className="mt-1"
                      disabled
                    />
                  </div>

                  <div>
                    <Label htmlFor="client_name">Client Name *</Label>
                    <Input
                      id="client_name"
                      value={formData.client_name}
                      onChange={(e) => updateFormData('client_name', e.target.value)}
                      className="mt-1"
                      disabled
                    />
                  </div>

                  <div>
                    <Label htmlFor="tender_reference">Tender Reference No. *</Label>
                    <Input
                      id="tender_reference"
                      value={formData.tender_reference}
                      onChange={(e) => updateFormData('tender_reference', e.target.value)}
                      className="mt-1"
                      disabled
                    />
                  </div>

                  <Separator className="my-4" />

                  <div>
                    <Label htmlFor="title">Tender Title *</Label>
                    <Input
                      id="title"
                      placeholder="Enter tender title..."
                      value={formData.title}
                      onChange={(e) => updateFormData('title', e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      placeholder="Describe the work, specifications, and expectations..."
                      value={formData.message}
                      onChange={(e) => updateFormData('message', e.target.value)}
                      className="min-h-[120px] mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="estimated_start_date">Estimated Start Date</Label>
                      <Input
                        id="estimated_start_date"
                        type="date"
                        min={today}
                        value={formData.estimated_start_date}
                        onChange={(e) => updateFormData('estimated_start_date', e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Submission Deadline *</Label>
                      <div className="flex gap-2">
                        <Input
                          type="date"
                          min={minDeadline}
                          value={formData.submission_deadline}
                          onChange={(e) => updateFormData('submission_deadline', e.target.value)}
                          className="flex-1"
                        />
                        <Input
                          type="time"
                          value={formData.submission_deadline_time}
                          onChange={(e) => updateFormData('submission_deadline_time', e.target.value)}
                          className="w-24"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Documents */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tender Documents</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Tender Specification */}
                  <div>
                    <Label>Upload Tender Specification</Label>
                    <div className="mt-2 border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleFileUpload('tender_specification_file', e.target.files?.[0] || null)}
                        className="hidden"
                        id="tender-spec-upload"
                      />
                      <label htmlFor="tender-spec-upload" className="cursor-pointer">
                        <div className="text-center">
                          <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                          <p className="mt-2 text-sm text-muted-foreground">
                            {formData.tender_specification_file 
                              ? formData.tender_specification_file.name 
                              : "Click to upload tender specification"}
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Scope of Works */}
                  <div>
                    <Label>Upload Scope of Works</Label>
                    <div className="mt-2 border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => handleFileUpload('scope_of_works_file', e.target.files?.[0] || null)}
                        className="hidden"
                        id="scope-works-upload"
                      />
                      <label htmlFor="scope-works-upload" className="cursor-pointer">
                        <div className="text-center">
                          <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                          <p className="mt-2 text-sm text-muted-foreground">
                            {formData.scope_of_works_file 
                              ? formData.scope_of_works_file.name 
                              : "Click to upload scope of works"}
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Additional Documents */}
                  <div>
                    <Label>Upload Documents</Label>
                    <div className="mt-2 border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                        onChange={(e) => e.target.files && handleDocumentsUpload(e.target.files)}
                        className="hidden"
                        id="docs-upload"
                      />
                      <label htmlFor="docs-upload" className="cursor-pointer">
                        <div className="text-center">
                          <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                          <p className="mt-2 text-sm text-muted-foreground">
                            Click to upload additional documents
                          </p>
                        </div>
                      </label>
                    </div>
                    
                    {formData.upload_documents.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <Label className="text-sm font-medium">Uploaded Documents</Label>
                        {formData.upload_documents.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              <span className="text-sm">{file.name}</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDocument(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Construction Items */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Construction Items to be Quoted</span>
                    <Button onClick={downloadConstructionItems} variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download .xls
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {formData.construction_items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{item.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity} {item.unit} • {item.category}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    Builders will receive an Excel file with these items to provide their quotations.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tender Review & Confirmation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Title</Label>
                      <p className="text-sm">{formData.title}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Submission Deadline</Label>
                      <p className="text-sm">
                        {formData.submission_deadline && format(new Date(formData.submission_deadline), 'PPP')} at {formData.submission_deadline_time}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Estimated Start Date</Label>
                      <p className="text-sm">
                        {formData.estimated_start_date ? format(new Date(formData.estimated_start_date), 'PPP') : 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Construction Items</Label>
                      <p className="text-sm">{formData.construction_items.length} items</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Message</Label>
                    <p className="text-sm text-muted-foreground mt-1">{formData.message}</p>
                  </div>

                  <div className="mt-6 p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      {isReadyForTender ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                      )}
                      <span className="font-medium">
                        {isReadyForTender ? 'Ready for Tender' : 'Confirmation Required'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {isReadyForTender 
                        ? 'This tender is confirmed and ready to be shared with builders.'
                        : 'Please confirm that this tender is ready to be shared with builders.'}
                    </p>
                    {!isReadyForTender && (
                      <Button 
                        onClick={markReadyForTender} 
                        className="mt-3"
                        variant="outline"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Mark as Ready for Tender
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 5: Builder Details */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Builder Details</span>
                    <Button onClick={addBuilderDetail} variant="outline" size="sm">
                      Add Builder
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {formData.builder_details.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No builders added yet</p>
                      <Button onClick={addBuilderDetail} className="mt-2">
                        Add First Builder
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.builder_details.map((builder) => (
                        <Card key={builder.id} className="border-muted">
                          <CardContent className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label className="text-xs">Company Name *</Label>
                                <Input
                                  value={builder.company_name}
                                  onChange={(e) => updateBuilderDetail(builder.id, 'company_name', e.target.value)}
                                  placeholder="Company name"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Contact Person *</Label>
                                <Input
                                  value={builder.contact_person}
                                  onChange={(e) => updateBuilderDetail(builder.id, 'contact_person', e.target.value)}
                                  placeholder="Contact person name"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Email *</Label>
                                <Input
                                  type="email"
                                  value={builder.email}
                                  onChange={(e) => updateBuilderDetail(builder.id, 'email', e.target.value)}
                                  placeholder="email@company.com"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Phone</Label>
                                <Input
                                  value={builder.phone}
                                  onChange={(e) => updateBuilderDetail(builder.id, 'phone', e.target.value)}
                                  placeholder="Phone number"
                                  className="mt-1"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <Label className="text-xs">Address</Label>
                                <Input
                                  value={builder.address}
                                  onChange={(e) => updateBuilderDetail(builder.id, 'address', e.target.value)}
                                  placeholder="Company address"
                                  className="mt-1"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end mt-3">
                              <Button
                                onClick={() => removeBuilderDetail(builder.id)}
                                variant="ghost"
                                size="sm"
                              >
                                <X className="w-4 h-4 mr-1" />
                                Remove
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 6: Send Invitations */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Send Tender Invitations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Ready to send tender invitations to {formData.builder_details.length} builder(s):
                    </p>
                    
                    <div className="space-y-2">
                      {formData.builder_details.map((builder) => (
                        <div key={builder.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{builder.company_name}</p>
                            <p className="text-sm text-muted-foreground">{builder.email}</p>
                          </div>
                          <Badge variant="outline">Ready</Badge>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm">
                        <strong>What happens next:</strong>
                      </p>
                      <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                        <li>• Builders will receive an email invitation with a sign-up link</li>
                        <li>• They can access the tender details and download the construction items file</li>
                        <li>• Builders can submit their bids before the deadline</li>
                        <li>• You'll be notified when bids are received</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation & Actions */}
          <div className="flex justify-between pt-6 border-t">
            <div className="flex gap-2">
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  disabled={loading}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={saveDraft}
                disabled={loading}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              
              {currentStep < steps.length ? (
                <Button
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  disabled={!canProceedToNext() || loading}
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={sendInvitations}
                  disabled={!canProceedToNext() || loading}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {loading ? 'Sending...' : 'Send Invitations'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};