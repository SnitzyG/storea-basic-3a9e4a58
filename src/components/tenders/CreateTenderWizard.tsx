import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { FileText, Upload, Calendar, DollarSign } from 'lucide-react';
import { useTenders } from '@/hooks/useTenders';
import { useDocuments } from '@/hooks/useDocuments';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DrawingsUploadManager } from './DrawingsUploadManager';
import { generateTenderPackage } from '@/utils/tenderPackageGenerator';
import { TenderPackageTracker } from './TenderPackageTracker';
import { ensureTenderDraft } from '@/utils/ensureTenderDraft';

interface CreateTenderWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  existingTender?: any;
}

export const CreateTenderWizard = ({
  open,
  onOpenChange,
  projectId,
  existingTender
}: CreateTenderWizardProps) => {
  const [step, setStep] = useState(1);
  
  // Step 1: Project Information
  const [title, setTitle] = useState('');
  const [projectAddress, setProjectAddress] = useState('');
  const [clientName, setClientName] = useState('');
  const [tenderReferenceNo, setTenderReferenceNo] = useState('');
  const [submissionDeadline, setSubmissionDeadline] = useState('');
  const [submissionTime, setSubmissionTime] = useState('17:00');
  
  // Step 2: Budget & Timeline
  const [budget, setBudget] = useState('');
  const [estimatedStartDate, setEstimatedStartDate] = useState('');
  const [completionWeeks, setCompletionWeeks] = useState('36');
  const [calculatedCompletionDate, setCalculatedCompletionDate] = useState('');
  
  // Step 3: Documents
  const [supportingDocuments, setSupportingDocuments] = useState<string[]>([]);
  const [packageDocsCount, setPackageDocsCount] = useState(0);
  
  // Common state
  const [loading, setLoading] = useState(false);
  const [tenderId, setTenderId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const { createTender } = useTenders();
  const { documents } = useDocuments(projectId);
  const { toast } = useToast();

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  // Fetch project data and auto-populate on open
  useEffect(() => {
    if (open && projectId && !existingTender) {
      fetchProjectData();
    }
  }, [open, projectId, existingTender]);

  // Auto-create draft tender when entering Step 3
  useEffect(() => {
    const autoCreateDraft = async () => {
      if (step === 3 && !tenderId && !existingTender?.id && title) {
        try {
          const draftId = await ensureTenderDraft({
            projectId,
            title,
            project_address: projectAddress,
            client_name: clientName,
            deadline: submissionDeadline && submissionTime 
              ? `${submissionDeadline}T${submissionTime}:00` 
              : undefined
          });
          setTenderId(draftId);
          toast({
            title: "Draft Created",
            description: "Tender draft created automatically"
          });
        } catch (error: any) {
          console.error('Auto-draft error:', error);
        }
      }
    };
    autoCreateDraft();
  }, [step, tenderId, existingTender, title, projectId, projectAddress, clientName, submissionDeadline, submissionTime]);

  // Calculate completion date when start date or weeks change
  useEffect(() => {
    if (estimatedStartDate && completionWeeks) {
      const startDate = new Date(estimatedStartDate);
      const weeksNum = parseInt(completionWeeks);
      if (!isNaN(weeksNum)) {
        const completionDate = new Date(startDate);
        completionDate.setDate(completionDate.getDate() + (weeksNum * 7));
        setCalculatedCompletionDate(completionDate.toISOString().split('T')[0]);
      }
    }
  }, [estimatedStartDate, completionWeeks]);

  // Populate form with existing tender data when editing
  useEffect(() => {
    if (existingTender && open) {
      setTenderId(existingTender.id);
      setTitle(existingTender.title || '');
      setProjectAddress(existingTender.project_address || '');
      setClientName(existingTender.client_name || '');
      setTenderReferenceNo(existingTender.tender_reference_no || '');
      setBudget(existingTender.budget?.toString() || '');
      setEstimatedStartDate(existingTender.estimated_start_date?.split('T')[0] || '');
      setCompletionWeeks(existingTender.completion_weeks?.toString() || '36');
      setSubmissionDeadline(existingTender.deadline?.split('T')[0] || '');
      setSubmissionTime(existingTender.deadline ? new Date(existingTender.deadline).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : '17:00');
      setSupportingDocuments(existingTender.supporting_documents || []);
    }
  }, [existingTender, open]);

  // Fetch package documents count from tender_package_documents
  useEffect(() => {
    const fetchPackageDocsCount = async () => {
      if (!tenderId && !existingTender?.id) {
        setPackageDocsCount(0);
        return;
      }
      
      const tid = tenderId || existingTender?.id;
      const { count, error } = await supabase
        .from('tender_package_documents')
        .select('*', { count: 'exact', head: true })
        .eq('tender_id', tid);
      
      if (!error && count !== null) {
        setPackageDocsCount(count);
      }
    };
    
    fetchPackageDocsCount();
  }, [tenderId, existingTender?.id, step]);

  const fetchProjectData = async () => {
    try {
      // Fetch project details
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      // Fetch creator profile
      const { data: creatorProfile } = await supabase
        .from('profiles')
        .select('name, company_id')
        .eq('user_id', project.created_by)
        .single();

      // Fetch company if available
      let companyName = 'COMPANY';
      if (creatorProfile?.company_id) {
        const { data: company } = await supabase
          .from('companies')
          .select('name')
          .eq('id', creatorProfile.company_id)
          .single();
        
        if (company) companyName = company.name;
      }

      // Auto-populate fields from project
      setTitle(project.name || '');
      setProjectAddress(project.address || '');
      setBudget(project.budget?.toString() || '');
      
      // Extract client name from timeline or project creator
      const timeline = project.timeline as any;
      const homeownerData = timeline?.pending_homeowner;
      setClientName(homeownerData?.name || creatorProfile?.name || '');

      // Generate tender reference number: COMPANY-PROJECT-TEN-YEAR
      const companyCode = companyName.substring(0, 3).toUpperCase();
      const projectCode = project.name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
      const year = new Date().getFullYear();
      setTenderReferenceNo(`${companyCode}-${projectCode}-TEN-${year}`);

      // Set estimated start date from project timeline or direct field
      const estimatedStart = timeline?.estimated_start_date || project.estimated_start_date;
      if (estimatedStart) {
        setEstimatedStartDate(estimatedStart);
      }

    } catch (error: any) {
      console.error('Error fetching project data:', error);
      toast({
        title: "Error loading project",
        description: error.message,
        variant: "destructive"
      });
    }
  };


  const handleViewPackagePreview = async () => {
    const currentTenderId = tenderId || existingTender?.id;
    
    if (!currentTenderId) {
      toast({
        title: "Please save tender first",
        description: "You need to save the tender before previewing the package",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Fetch the latest tender data
      const { data: tender, error } = await supabase
        .from('tenders')
        .select('*')
        .eq('id', currentTenderId)
        .single();
      
      if (error) throw error;
      
      // Generate the package
      await generateTenderPackage(tender as any);
      
      toast({
        title: "Package Preview Generated",
        description: "Tender package (ZIP with PDF + Excel) has been downloaded",
      });
    } catch (error) {
      console.error('Preview error:', error);
      toast({
        title: "Error",
        description: "Failed to generate package preview",
        variant: "destructive"
      });
    }
  };

  const handlePublishTender = async () => {
    if (!title.trim() || !submissionDeadline) {
      toast({
        title: "Error",
        description: "Please complete project title and deadline date",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      const tenderData: any = {
        project_id: projectId,
        title: title.trim(),
        project_title: title.trim(), // Use the same title as project title
        project_address: projectAddress || undefined,
        client_name: clientName || undefined,
        tender_reference_no: tenderReferenceNo || undefined,
        budget: budget ? parseFloat(budget) : undefined,
        estimated_start_date: estimatedStartDate || undefined,
        deadline: `${submissionDeadline}T${submissionTime}:00`,
        status: 'open'
      };

      if (tenderId) {
        // Update existing tender and publish
        const { error } = await supabase
          .from('tenders')
          .update(tenderData)
          .eq('id', tenderId);
        
        if (error) throw error;
      } else {
        // Create new tender
        const result = await createTender(tenderData);
        if (!result) throw new Error('Failed to create tender');
        setTenderId(result.id);
      }

      toast({
        title: "Tender Published",
        description: "Your tender has been published successfully.",
      });
      
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Publish error:', error);
      toast({
        title: "Error",
        description: "Failed to publish tender",
        variant: "destructive"
      });
    }
    setLoading(false);
  };

  const resetForm = () => {
    setStep(1);
    setTitle('');
    setProjectAddress('');
    setClientName('');
    setTenderReferenceNo('');
    setSubmissionDeadline('');
    setSubmissionTime('17:00');
    setBudget('');
    setEstimatedStartDate('');
    setCompletionWeeks('36');
    setCalculatedCompletionDate('');
    setSupportingDocuments([]);
    setLoading(false);
    setTenderId(null);
    setPreviewOpen(false);
  };

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDeadline = tomorrow.toISOString().split('T')[0];
  
  // Set default deadline to 2 weeks from today
  const twoWeeksFromNow = new Date();
  twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
  const defaultDeadline = twoWeeksFromNow.toISOString().split('T')[0];
  
  // Set default deadline on mount if not already set
  React.useEffect(() => {
    if (!submissionDeadline && !existingTender) {
      setSubmissionDeadline(defaultDeadline);
    }
  }, []);

  const toggleDocument = (docId: string) => {
    setSupportingDocuments(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const complianceCount = 4; // Fixed for now

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Create New Tender - Step {step} of {totalSteps}</DialogTitle>
          <Progress value={progress} className="mt-2" />
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Project Information */}
          {step === 1 && (
            <div className="space-y-6">
              <Card className="bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-base">Project Information</CardTitle>
                  <CardDescription>Basic project details and identification</CardDescription>
                </CardHeader>
              </Card>

              <div>
                <Label htmlFor="title">Project Title *</Label>
                <Input 
                  id="title" 
                  placeholder="RYE" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  className="mt-1" 
                />
              </div>

              <div>
                <Label htmlFor="projectAddress">Project Address *</Label>
                <Input 
                  id="projectAddress" 
                  placeholder="222 Pardoner Road, Rye 3941" 
                  value={projectAddress} 
                  onChange={e => setProjectAddress(e.target.value)} 
                  className="mt-1" 
                />
              </div>

              <div>
                <Label htmlFor="clientName">Client Name *</Label>
                <Input 
                  id="clientName" 
                  placeholder="Richard Goodwin" 
                  value={clientName} 
                  onChange={e => setClientName(e.target.value)} 
                  className="mt-1" 
                />
              </div>

              <div>
                <Label htmlFor="tenderReferenceNo">Tender Reference No.</Label>
                <Input 
                  id="tenderReferenceNo" 
                  placeholder="RG-RYE-TEN-2025" 
                  value={tenderReferenceNo} 
                  onChange={e => setTenderReferenceNo(e.target.value)} 
                  className="mt-1" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="deadline">Deadline Date *</Label>
                  <Input 
                    id="deadline" 
                    type="date" 
                    min={minDeadline}
                    value={submissionDeadline} 
                    onChange={e => setSubmissionDeadline(e.target.value)} 
                    className="mt-1" 
                  />
                </div>
                <div>
                  <Label htmlFor="deadlineTime">Deadline Time</Label>
                  <Input 
                    id="deadlineTime" 
                    type="time" 
                    value={submissionTime} 
                    onChange={e => setSubmissionTime(e.target.value)} 
                    className="mt-1" 
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Budget & Timeline */}
          {step === 2 && (
            <div className="space-y-6">
              <Card className="bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-base">Budget & Timeline</CardTitle>
                  <CardDescription>Financial and scheduling details</CardDescription>
                </CardHeader>
              </Card>

              <div>
                <Label htmlFor="budget">Budget (AUD)</Label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="budget" 
                    type="number"
                    placeholder="1500000"
                    value={budget} 
                    onChange={e => setBudget(e.target.value)} 
                    className="pl-10" 
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="startDate">Estimated Start Date</Label>
                <div className="relative mt-1">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="startDate" 
                    type="date" 
                    min={today}
                    value={estimatedStartDate} 
                    onChange={e => setEstimatedStartDate(e.target.value)} 
                    className="pl-10" 
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="completionWeeks">Completion Weeks</Label>
                <Input 
                  id="completionWeeks" 
                  type="number"
                  placeholder="36"
                  value={completionWeeks} 
                  onChange={e => setCompletionWeeks(e.target.value)} 
                  className="mt-1" 
                />
              </div>

              {calculatedCompletionDate && (
                <div>
                  <Label>Calculated Completion Date</Label>
                  <div className="mt-1 p-3 bg-muted rounded-md">
                    <p className="text-sm font-medium">
                      {new Date(calculatedCompletionDate).toLocaleDateString('en-AU', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Tender Package Tracker */}
          {step === 3 && (
            <div className="space-y-6">
              <Card className="bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-base">Tender Package Tracker</CardTitle>
                  <CardDescription>Upload required documents for the tender package</CardDescription>
                </CardHeader>
              </Card>

              <TenderPackageTracker 
                tenderId={tenderId || existingTender?.id}
                projectData={{ name: title, address: projectAddress, budget }}
                tenderData={{
                  title,
                  project_address: projectAddress,
                  client_name: clientName,
                  tender_reference_no: tenderReferenceNo,
                  tender_id: tenderId,
                  deadline: submissionDeadline ? `${submissionDeadline}T${submissionTime}:00` : undefined,
                  budget: budget ? parseFloat(budget) : undefined,
                  estimated_start_date: estimatedStartDate,
                  completion_weeks: completionWeeks ? parseInt(completionWeeks) : undefined
                }}
              />
              {!tenderId && !existingTender?.id && (
                <p className="text-sm text-muted-foreground mt-2">
                  Tip: Click “Save Draft” to create a tender ID before saving selected line items.
                </p>
              )}

            </div>
          )}

          {/* Step 4: Review & Summary */}
          {step === 4 && (
            <div className="space-y-6">
              <Card className="bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-base">Tender Summary</CardTitle>
                  <CardDescription>Review all details before publishing</CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Project:</p>
                      <p className="font-medium">{title || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Reference:</p>
                      <p className="font-medium">{tenderReferenceNo || 'Not set'}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Budget:</p>
                    <p className="font-medium">
                      {budget ? `$${parseFloat(budget).toLocaleString()}` : 'Not set'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Timeline:</p>
                    <p className="font-medium">
                      {estimatedStartDate && calculatedCompletionDate 
                        ? `${new Date(estimatedStartDate).toLocaleDateString()} to ${new Date(calculatedCompletionDate).toLocaleDateString()} (${completionWeeks} weeks)`
                        : 'Not set'}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Supporting Documents:</p>
                    <p className="font-medium">{packageDocsCount} attached</p>
                  </div>
                </CardContent>
              </Card>

              <Button 
                onClick={handleViewPackagePreview} 
                variant="outline" 
                className="w-full"
                disabled={loading}
              >
                <FileText className="h-4 w-4 mr-2" />
                View Package Preview
              </Button>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <div>
              {step > 1 && (
                <Button 
                  onClick={() => setStep(step - 1)} 
                  variant="outline"
                  disabled={loading}
                >
                  Previous
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              {step < totalSteps ? (
                <Button 
                  onClick={() => setStep(step + 1)}
                  disabled={loading}
                >
                  Next
                </Button>
              ) : (
                <Button 
                  onClick={handlePublishTender}
                  disabled={loading || !title || !submissionDeadline}
                >
                  {loading ? 'Publishing...' : 'Publish Tender'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};