import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { useTenders } from '@/hooks/useTenders';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { FileSelector } from '@/components/messages/FileSelector';

interface CreateTenderWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export const CreateTenderWizard = ({ open, onOpenChange, projectId }: CreateTenderWizardProps) => {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [estimatedStartDate, setEstimatedStartDate] = useState('');
  const [submissionDeadline, setSubmissionDeadline] = useState('');
  const [submissionTime, setSubmissionTime] = useState('17:00');
  const [specFiles, setSpecFiles] = useState<Array<{ id: string; name: string; path: string; type: string }>>([]);
  const [sowFiles, setSowFiles] = useState<Array<{ id: string; name: string; path: string; type: string }>>([]);
  const [constructionItems, setConstructionItems] = useState<any[]>([]);
  const [builderDetails, setBuilderDetails] = useState({
    companyName: '',
    address: '',
    phone: '',
    contactPerson: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [isReadyForTender, setIsReadyForTender] = useState(false);

  const { createTender } = useTenders();
  const { toast } = useToast();

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  const uploadFile = async (file: File, bucket: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${projectId}/${fileName}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    return filePath;
  };

  const handleSaveDraft = async () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: "Error",
        description: "Title and message are required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    const tenderData: any = {
      project_id: projectId,
      title: title.trim(),
      description: message.trim(),
      estimated_start_date: estimatedStartDate || undefined,
      deadline: submissionDeadline && submissionTime 
        ? `${submissionDeadline}T${submissionTime}:00` 
        : undefined,
      construction_items: constructionItems,
      is_ready_for_tender: false,
    };

    if (specFiles.length > 0) {
      tenderData.tender_specification_path = specFiles[0].path;
    }

    if (sowFiles.length > 0) {
      tenderData.scope_of_works_path = sowFiles[0].path;
    }

    await createTender(tenderData);
    resetForm();
    onOpenChange(false);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !message.trim() || !submissionDeadline || !isReadyForTender) {
      toast({
        title: "Error",
        description: "Please complete all required fields and confirm tender is ready",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const tenderData: any = {
      project_id: projectId,
      title: title.trim(),
      description: message.trim(),
      estimated_start_date: estimatedStartDate || undefined,
      deadline: `${submissionDeadline}T${submissionTime}:00`,
      construction_items: constructionItems,
      builder_company_name: builderDetails.companyName || undefined,
      builder_address: builderDetails.address || undefined,
      builder_phone: builderDetails.phone || undefined,
      builder_contact_person: builderDetails.contactPerson || undefined,
      builder_email: builderDetails.email || undefined,
      is_ready_for_tender: true,
    };

    if (specFiles.length > 0) {
      tenderData.tender_specification_path = specFiles[0].path;
    }

    if (sowFiles.length > 0) {
      tenderData.scope_of_works_path = sowFiles[0].path;
    }

    const result = await createTender(tenderData);
    
    if (result && builderDetails.email) {
      // Send invitation email
      await supabase.functions.invoke('send-tender-invitation', {
        body: {
          tenderTitle: title,
          builderEmail: builderDetails.email,
          builderName: builderDetails.contactPerson || builderDetails.companyName,
          projectId: projectId,
          tenderId: result.id,
        }
      });
    }

    resetForm();
    onOpenChange(false);
    setLoading(false);
  };

  const resetForm = () => {
    setStep(1);
    setTitle('');
    setMessage('');
    setEstimatedStartDate('');
    setSubmissionDeadline('');
    setSubmissionTime('17:00');
    setSpecFiles([]);
    setSowFiles([]);
    setConstructionItems([]);
    setBuilderDetails({
      companyName: '',
      address: '',
      phone: '',
      contactPerson: '',
      email: ''
    });
    setIsReadyForTender(false);
  };

  const handleExportConstructionItems = () => {
    const worksheet = XLSX.utils.json_to_sheet(constructionItems.length > 0 ? constructionItems : [
      { Item: 'Example: Foundation Works', Quantity: 1, Unit: 'LS', Description: 'Complete foundation system' }
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Construction Items');
    XLSX.writeFile(workbook, `${title || 'tender'}-construction-items.xlsx`);
  };

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDeadline = tomorrow.toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Tender - Step {step} of {totalSteps}</DialogTitle>
          <Progress value={progress} className="mt-2" />
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter tender title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  placeholder="Describe the tender scope and requirements..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[120px] mt-1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estimatedStartDate">Estimated Start Date</Label>
                  <Input
                    id="estimatedStartDate"
                    type="date"
                    min={today}
                    value={estimatedStartDate}
                    onChange={(e) => setEstimatedStartDate(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="submissionDeadline">Submission Deadline *</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="submissionDeadline"
                      type="date"
                      min={minDeadline}
                      value={submissionDeadline}
                      onChange={(e) => setSubmissionDeadline(e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="time"
                      value={submissionTime}
                      onChange={(e) => setSubmissionTime(e.target.value)}
                      className="w-32"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Documents */}
          {step === 2 && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tender Specification</CardTitle>
                </CardHeader>
                <CardContent>
                  <FileSelector
                    projectId={projectId}
                    selectedFiles={specFiles}
                    onFileSelect={(file) => setSpecFiles([file])}
                    onFileRemove={(fileId) => setSpecFiles([])}
                    onUploadNew={(files) => {
                      if (files.length > 0) {
                        const newFile = {
                          id: Math.random().toString(),
                          name: files[0].name,
                          path: URL.createObjectURL(files[0]),
                          type: files[0].type
                        };
                        setSpecFiles([newFile]);
                      }
                    }}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Scope of Works</CardTitle>
                </CardHeader>
                <CardContent>
                  <FileSelector
                    projectId={projectId}
                    selectedFiles={sowFiles}
                    onFileSelect={(file) => setSowFiles([file])}
                    onFileRemove={(fileId) => setSowFiles([])}
                    onUploadNew={(files) => {
                      if (files.length > 0) {
                        const newFile = {
                          id: Math.random().toString(),
                          name: files[0].name,
                          path: URL.createObjectURL(files[0]),
                          type: files[0].type
                        };
                        setSowFiles([newFile]);
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Construction Items */}
          {step === 3 && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>Construction Items to Quote</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleExportConstructionItems}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export .xls
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Construction items can be exported as an Excel file for builder quoting.
                    You can add specific items here or upload them with your tender specification.
                  </p>
                  <Textarea
                    placeholder="Enter construction items (optional)&#10;Example:&#10;Foundation Works - Complete foundation system&#10;Structural Frame - Steel framework installation"
                    className="min-h-[150px]"
                    onChange={(e) => {
                      const items = e.target.value.split('\n').filter(line => line.trim()).map((line, idx) => ({
                        id: idx + 1,
                        description: line.trim()
                      }));
                      setConstructionItems(items);
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 4: Builder Details */}
          {step === 4 && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Builder Details (Optional)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="builderCompany">Company Name</Label>
                    <Input
                      id="builderCompany"
                      value={builderDetails.companyName}
                      onChange={(e) => setBuilderDetails({...builderDetails, companyName: e.target.value})}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="builderAddress">Address</Label>
                    <Input
                      id="builderAddress"
                      value={builderDetails.address}
                      onChange={(e) => setBuilderDetails({...builderDetails, address: e.target.value})}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="builderPhone">Phone</Label>
                      <Input
                        id="builderPhone"
                        type="tel"
                        value={builderDetails.phone}
                        onChange={(e) => setBuilderDetails({...builderDetails, phone: e.target.value})}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="builderContact">Contact Person</Label>
                      <Input
                        id="builderContact"
                        value={builderDetails.contactPerson}
                        onChange={(e) => setBuilderDetails({...builderDetails, contactPerson: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="builderEmail">Email</Label>
                    <Input
                      id="builderEmail"
                      type="email"
                      value={builderDetails.email}
                      onChange={(e) => setBuilderDetails({...builderDetails, email: e.target.value})}
                      className="mt-1"
                      placeholder="Email to send tender invitation"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 5: Confirmation */}
          {step === 5 && (
            <div className="space-y-4">
              <Card className={isReadyForTender ? 'border-green-500' : 'border-orange-500'}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    {isReadyForTender ? (
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">
                        {isReadyForTender ? 'Tender Ready' : 'Confirm Tender is Ready'}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Please review all details and confirm this tender is complete and ready to be shared with builders.
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="readyCheck"
                          checked={isReadyForTender}
                          onChange={(e) => setIsReadyForTender(e.target.checked)}
                          className="w-4 h-4"
                        />
                        <Label htmlFor="readyCheck" className="cursor-pointer">
                          I confirm this tender is ready for submission
                        </Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tender Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Title:</span>
                    <span className="font-medium">{title || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deadline:</span>
                    <span className="font-medium">
                      {submissionDeadline ? `${submissionDeadline} ${submissionTime}` : 'Not set'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Specification:</span>
                    <span className="font-medium">{specFiles.length > 0 ? '✓ Uploaded' : 'Not uploaded'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Scope of Works:</span>
                    <span className="font-medium">{sowFiles.length > 0 ? '✓ Uploaded' : 'Not uploaded'}</span>
                  </div>
                  {builderDetails.email && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Builder Email:</span>
                      <span className="font-medium">{builderDetails.email}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <div className="flex gap-2">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  disabled={loading}
                >
                  Previous
                </Button>
              )}
              {step < totalSteps && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={loading || !title.trim() || !message.trim()}
                >
                  Save Draft
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm();
                  onOpenChange(false);
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              
              {step < totalSteps ? (
                <Button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  disabled={loading || (step === 1 && (!title.trim() || !message.trim()))}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || !isReadyForTender || !title.trim() || !message.trim() || !submissionDeadline}
                >
                  {loading ? 'Creating...' : 'Create Tender'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};