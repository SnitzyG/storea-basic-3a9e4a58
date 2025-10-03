import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle, AlertCircle, Download, FileUp, Mail, Clock, Gavel, PenTool } from 'lucide-react';
import { useTenders } from '@/hooks/useTenders';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileSelector } from '@/components/messages/FileSelector';
import { ConstructionItemSelector, BUILDING_SECTIONS } from './ConstructionItemSelector';
import { generateProfessionalQuoteTemplate, getCompanyInfoFromProfile } from '@/utils/tenderExportUtils';

const CONTRACT_TYPES = [
  { value: 'lump_sum', label: 'Lump Sum', description: 'Fixed price for the entire project' },
  { value: 'time_materials', label: 'Time & Materials (T&M)', description: 'Cost based on actual time and materials used' },
  { value: 'unit_price', label: 'Unit Price', description: 'Price per unit of work completed' },
  { value: 'gmp', label: 'Guaranteed Maximum Price (GMP)', description: 'Maximum price with potential cost savings' },
  { value: 'cost_plus', label: 'Cost-Plus', description: 'Actual costs plus a fixed fee or percentage' },
];

const TENDERING_PHASES = [
  { id: 1, title: 'Invitation to Tender', icon: Mail, description: 'Prepare and send tender documents to selected contractors' },
  { id: 2, title: 'Tendering Period', icon: Clock, description: 'Contractors review, clarify, and prepare proposals' },
  { id: 3, title: 'Submission of Proposals', icon: FileUp, description: 'Contractors submit their bids and proposals' },
  { id: 4, title: 'Negotiation & Settlement', icon: Gavel, description: 'Review bids, negotiate, and issue letter of intent' },
  { id: 5, title: 'Final Contract Execution', icon: PenTool, description: 'Sign agreement and notify unsuccessful bidders' },
];
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
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [contractType, setContractType] = useState('');
  const [estimatedStartDate, setEstimatedStartDate] = useState('');
  const [submissionDeadline, setSubmissionDeadline] = useState('');
  const [submissionTime, setSubmissionTime] = useState('17:00');
  
  // Document files
  const [invitationLetter, setInvitationLetter] = useState<Array<{id: string; name: string; path: string; type: string}>>([]);
  const [tenderForm, setTenderForm] = useState<Array<{id: string; name: string; path: string; type: string}>>([]);
  const [preliminaries, setPreliminaries] = useState<Array<{id: string; name: string; path: string; type: string}>>([]);
  const [contractForm, setContractForm] = useState<Array<{id: string; name: string; path: string; type: string}>>([]);
  const [billOfQuantities, setBillOfQuantities] = useState<Array<{id: string; name: string; path: string; type: string}>>([]);
  const [developerInfo, setDeveloperInfo] = useState<Array<{id: string; name: string; path: string; type: string}>>([]);
  const [projectBrief, setProjectBrief] = useState<Array<{id: string; name: string; path: string; type: string}>>([]);
  const [tenderDrawings, setTenderDrawings] = useState<Array<{id: string; name: string; path: string; type: string}>>([]);
  const [specFiles, setSpecFiles] = useState<Array<{id: string; name: string; path: string; type: string}>>([]);
  const [sowFiles, setSowFiles] = useState<Array<{id: string; name: string; path: string; type: string}>>([]);
  
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [builderDetails, setBuilderDetails] = useState({
    companyName: '',
    address: '',
    phone: '',
    contactPerson: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [isReadyForTender, setIsReadyForTender] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(1);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userCompany, setUserCompany] = useState<any>(null);
  const [projectData, setProjectData] = useState<any>(null);
  const {
    createTender
  } = useTenders();
  const {
    toast
  } = useToast();

  // Fetch user profile, company, and project data for export
  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;
      
      // Fetch profile and company
      const {
        data: profile
      } = await supabase.from('profiles').select('*, companies(*)').eq('user_id', user.id).single();
      if (profile) {
        setUserProfile(profile);
        if (profile.company_id) {
          const {
            data: company
          } = await supabase.from('companies').select('*').eq('id', profile.company_id).single();
          setUserCompany(company);
        }
      }

      // Fetch project data
      const {
        data: project
      } = await supabase.from('projects').select('*').eq('id', projectId).single();
      if (project) {
        setProjectData(project);
      }
    };
    if (open) {
      fetchUserData();
    }
  }, [open, projectId]);
  
  // Populate form with existing tender data when editing
  useEffect(() => {
    if (existingTender && open) {
      setTitle(existingTender.title || '');
      setMessage(existingTender.description || '');
      setContractType(existingTender.contract_type || '');
      setEstimatedStartDate(existingTender.estimated_start_date?.split('T')[0] || '');
      setSubmissionDeadline(existingTender.deadline?.split('T')[0] || '');
      setSubmissionTime(existingTender.deadline ? new Date(existingTender.deadline).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : '17:00');
      setBuilderDetails({
        companyName: existingTender.builder_company_name || '',
        address: existingTender.builder_address || '',
        phone: existingTender.builder_phone || '',
        contactPerson: existingTender.builder_contact_person || '',
        email: existingTender.builder_email || ''
      });
      setIsReadyForTender(existingTender.is_ready_for_tender || false);
      if (existingTender.construction_items) {
        const itemIds = existingTender.construction_items.map((item: any) => item.id || item);
        setSelectedItemIds(itemIds);
      }
    }
  }, [existingTender, open]);
  const totalSteps = 7;
  const progress = step / totalSteps * 100;
  const uploadFile = async (file: File, bucket: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${projectId}/${fileName}`;
    const {
      error
    } = await supabase.storage.from(bucket).upload(filePath, file);
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
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    const selectedItems = BUILDING_SECTIONS.filter(item => selectedItemIds.includes(item.id));
    const tenderData: any = {
      project_id: projectId,
      title: title.trim(),
      description: message.trim(),
      estimated_start_date: estimatedStartDate || undefined,
      deadline: submissionDeadline && submissionTime ? `${submissionDeadline}T${submissionTime}:00` : undefined,
      construction_items: selectedItems,
      is_ready_for_tender: false
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
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    const selectedItems = BUILDING_SECTIONS.filter(item => selectedItemIds.includes(item.id));
    const tenderData: any = {
      project_id: projectId,
      title: title.trim(),
      description: message.trim(),
      estimated_start_date: estimatedStartDate || undefined,
      deadline: `${submissionDeadline}T${submissionTime}:00`,
      construction_items: selectedItems,
      builder_company_name: builderDetails.companyName || undefined,
      builder_address: builderDetails.address || undefined,
      builder_phone: builderDetails.phone || undefined,
      builder_contact_person: builderDetails.contactPerson || undefined,
      builder_email: builderDetails.email || undefined,
      is_ready_for_tender: true
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
          tenderId: result.id
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
    setContractType('');
    setEstimatedStartDate('');
    setSubmissionDeadline('');
    setSubmissionTime('17:00');
    setInvitationLetter([]);
    setTenderForm([]);
    setPreliminaries([]);
    setContractForm([]);
    setBillOfQuantities([]);
    setDeveloperInfo([]);
    setProjectBrief([]);
    setTenderDrawings([]);
    setSpecFiles([]);
    setSowFiles([]);
    setSelectedItemIds([]);
    setBuilderDetails({
      companyName: '',
      address: '',
      phone: '',
      contactPerson: '',
      email: ''
    });
    setIsReadyForTender(false);
    setCurrentPhase(1);
  };
  const handleGenerateQuoteTemplate = async () => {
    if (selectedItemIds.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select at least one construction item to include in the quote template",
        variant: "destructive"
      });
      return;
    }
    if (!title.trim()) {
      toast({
        title: "Missing title",
        description: "Please enter a tender title before generating the quote template",
        variant: "destructive"
      });
      return;
    }
    try {
      const companyInfo = getCompanyInfoFromProfile(userProfile, userCompany);
      await generateProfessionalQuoteTemplate({
        tenderTitle: title,
        companyInfo,
        selectedItemIds,
        includeGST: true,
        gstRate: 0.10,
        deadline: submissionDeadline ? `${submissionDeadline} ${submissionTime}` : undefined,
        projectData: projectData ? {
          reference: projectData.project_id || '',
          name: projectData.name || '',
          id: projectData.id || '',
          address: projectData.location || projectData.address || '',
        } : undefined,
      });
      toast({
        title: "Quote template generated",
        description: "Professional XLSX quote template has been downloaded"
      });
    } catch (error) {
      console.error('Error generating quote template:', error);
      toast({
        title: "Error",
        description: "Failed to generate quote template",
        variant: "destructive"
      });
    }
  };
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDeadline = tomorrow.toISOString().split('T')[0];
  const handleFileUpload = (files: File[], setter: React.Dispatch<React.SetStateAction<any[]>>) => {
    if (files.length > 0) {
      const newFiles = files.map(file => ({
        id: Math.random().toString(),
        name: file.name,
        path: URL.createObjectURL(file),
        type: file.type
      }));
      setter(newFiles);
    }
  };

  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Create New Tender - Step {step} of {totalSteps}</DialogTitle>
          <Progress value={progress} className="mt-2" />
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Basic Information & Contract Type */}
          {step === 1 && <div className="space-y-6">
              <Card className="bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Phase 1: Invitation to Tender
                  </CardTitle>
                  <CardDescription>Setup basic tender information and select contract type</CardDescription>
                </CardHeader>
              </Card>

              <div>
                <Label htmlFor="title">Tender Title *</Label>
                <Input id="title" placeholder="e.g., Residential Extension and Renovation" value={title} onChange={e => setTitle(e.target.value)} className="mt-1" />
              </div>

              <div>
                <Label htmlFor="message">Tender Description *</Label>
                <Textarea id="message" placeholder="Describe the project scope, requirements, and objectives..." value={message} onChange={e => setMessage(e.target.value)} className="min-h-[120px] mt-1" />
              </div>

              <div>
                <Label htmlFor="contractType">Contract Type *</Label>
                <Select value={contractType} onValueChange={setContractType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select contract type" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTRACT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{type.label}</span>
                          <span className="text-xs text-muted-foreground">{type.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estimatedStartDate">Estimated Start Date</Label>
                  <Input id="estimatedStartDate" type="date" min={today} value={estimatedStartDate} onChange={e => setEstimatedStartDate(e.target.value)} className="mt-1" />
                </div>

                <div>
                  <Label htmlFor="submissionDeadline">Submission Deadline *</Label>
                  <div className="flex gap-2 mt-1">
                    <Input id="submissionDeadline" type="date" min={minDeadline} value={submissionDeadline} onChange={e => setSubmissionDeadline(e.target.value)} className="flex-1" />
                    <Input type="time" value={submissionTime} onChange={e => setSubmissionTime(e.target.value)} className="w-32" />
                  </div>
                </div>
              </div>
            </div>}

          {/* Step 2: Core Tender Documents */}
          {step === 2 && <div className="space-y-4">
              <Card className="bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-base">Tender Package Documents</CardTitle>
                  <CardDescription>Upload required tender documentation</CardDescription>
                </CardHeader>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Invitation Letter</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FileSelector projectId={projectId} selectedFiles={invitationLetter} onFileSelect={file => setInvitationLetter([file])} onFileRemove={() => setInvitationLetter([])} onUploadNew={files => handleFileUpload(files, setInvitationLetter)} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Tender Form / Statutory Declaration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FileSelector projectId={projectId} selectedFiles={tenderForm} onFileSelect={file => setTenderForm([file])} onFileRemove={() => setTenderForm([])} onUploadNew={files => handleFileUpload(files, setTenderForm)} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Preliminaries (Pre-Construction Info)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FileSelector projectId={projectId} selectedFiles={preliminaries} onFileSelect={file => setPreliminaries([file])} onFileRemove={() => setPreliminaries([])} onUploadNew={files => handleFileUpload(files, setPreliminaries)} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Contract Form with Amendments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FileSelector projectId={projectId} selectedFiles={contractForm} onFileSelect={file => setContractForm([file])} onFileRemove={() => setContractForm([])} onUploadNew={files => handleFileUpload(files, setContractForm)} />
                  </CardContent>
                </Card>
              </div>
            </div>}

          {/* Step 3: Project Documentation */}
          {step === 3 && <div className="space-y-4">
              <Card className="bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-base">Project & Financial Documentation</CardTitle>
                  <CardDescription>Upload project specifications and cost breakdown</CardDescription>
                </CardHeader>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Bill of Quantities / Trade Cost Table</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FileSelector projectId={projectId} selectedFiles={billOfQuantities} onFileSelect={file => setBillOfQuantities([file])} onFileRemove={() => setBillOfQuantities([])} onUploadNew={files => handleFileUpload(files, setBillOfQuantities)} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Developer/Owner Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FileSelector projectId={projectId} selectedFiles={developerInfo} onFileSelect={file => setDeveloperInfo([file])} onFileRemove={() => setDeveloperInfo([])} onUploadNew={files => handleFileUpload(files, setDeveloperInfo)} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Project Brief + Specifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FileSelector projectId={projectId} selectedFiles={projectBrief} onFileSelect={file => setProjectBrief([file])} onFileRemove={() => setProjectBrief([])} onUploadNew={files => handleFileUpload(files, setProjectBrief)} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Tender Drawings</CardTitle>
                    <CardDescription className="text-xs">Architectural, engineering, soil, survey plans</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FileSelector projectId={projectId} selectedFiles={tenderDrawings} onFileSelect={file => setTenderDrawings([file])} onFileRemove={() => setTenderDrawings([])} onUploadNew={files => handleFileUpload(files, setTenderDrawings)} />
                  </CardContent>
                </Card>
              </div>
            </div>}

          {/* Step 4: Construction Items & Quote Template */}
          {step === 4 && <div className="space-y-4">
              <Card className="bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Phase 2: Tendering Period
                  </CardTitle>
                  <CardDescription>Define work items and generate quote template for bidders</CardDescription>
                </CardHeader>
              </Card>

              <ConstructionItemSelector selectedItems={selectedItemIds} onSelectionChange={setSelectedItemIds} />
              
              <div className="flex justify-end">
                <Button type="button" variant="default" onClick={handleGenerateQuoteTemplate} disabled={selectedItemIds.length === 0 || !title.trim()}>
                  <Download className="w-4 h-4 mr-2" />
                  Generate Quote Template for Bidders
                </Button>
              </div>
            </div>}

          {/* Step 5: Contractor/Builder Details */}
          {step === 5 && <div className="space-y-4">
              <Card className="bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileUp className="w-5 h-5" />
                    Phase 3: Invitation to Contractors
                  </CardTitle>
                  <CardDescription>Specify contractor details for tender invitation (optional)</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Builder Details (Optional)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="builderCompany">Company Name</Label>
                    <Input id="builderCompany" value={builderDetails.companyName} onChange={e => setBuilderDetails({
                  ...builderDetails,
                  companyName: e.target.value
                })} className="mt-1" />
                  </div>

                  <div>
                    <Label htmlFor="builderAddress">Address</Label>
                    <Input id="builderAddress" value={builderDetails.address} onChange={e => setBuilderDetails({
                  ...builderDetails,
                  address: e.target.value
                })} className="mt-1" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="builderPhone">Phone</Label>
                      <Input id="builderPhone" type="tel" value={builderDetails.phone} onChange={e => setBuilderDetails({
                    ...builderDetails,
                    phone: e.target.value
                  })} className="mt-1" />
                    </div>

                    <div>
                      <Label htmlFor="builderContact">Contact Person</Label>
                      <Input id="builderContact" value={builderDetails.contactPerson} onChange={e => setBuilderDetails({
                    ...builderDetails,
                    contactPerson: e.target.value
                  })} className="mt-1" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="builderEmail">Email</Label>
                    <Input id="builderEmail" type="email" value={builderDetails.email} onChange={e => setBuilderDetails({
                  ...builderDetails,
                  email: e.target.value
                })} className="mt-1" placeholder="Email to send tender invitation" />
                  </div>
                </CardContent>
              </Card>
            </div>}

          {/* Step 6: Tendering Process Overview */}
          {step === 6 && <div className="space-y-4">
              <Card className="bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-base">5-Step Tendering Process Overview</CardTitle>
                  <CardDescription>Review the complete tendering workflow</CardDescription>
                </CardHeader>
              </Card>

              <div className="space-y-3">
                {TENDERING_PHASES.map((phase, index) => (
                  <Card key={phase.id} className={index < currentPhase - 1 ? 'bg-green-50 border-green-200' : index === currentPhase - 1 ? 'bg-blue-50 border-blue-200' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${index < currentPhase - 1 ? 'bg-green-100' : index === currentPhase - 1 ? 'bg-blue-100' : 'bg-muted'}`}>
                          <phase.icon className={`w-5 h-5 ${index < currentPhase - 1 ? 'text-green-600' : index === currentPhase - 1 ? 'text-blue-600' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">Step {phase.id}: {phase.title}</h4>
                            {index < currentPhase - 1 && <Badge variant="outline" className="bg-green-100 text-green-700">Completed</Badge>}
                            {index === currentPhase - 1 && <Badge variant="outline" className="bg-blue-100 text-blue-700">Current</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">{phase.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>}

          {/* Step 7: Final Confirmation */}
          {step === 7 && <div className="space-y-4">
              <Card className="bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Gavel className="w-5 h-5" />
                    Phase 4 & 5: Ready for Negotiation & Contract Execution
                  </CardTitle>
                  <CardDescription>Confirm tender is complete and ready to publish</CardDescription>
                </CardHeader>
              </Card>
              <Card className={isReadyForTender ? 'border-green-500' : 'border-orange-500'}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    {isReadyForTender ? <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" /> : <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />}
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">
                        {isReadyForTender ? 'Tender Ready' : 'Confirm Tender is Ready'}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Please review all details and confirm this tender is complete and ready to be shared with builders.
                      </p>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="readyCheck" checked={isReadyForTender} onChange={e => setIsReadyForTender(e.target.checked)} className="w-4 h-4" />
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
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Construction Items:</span>
                    <span className="font-medium">{selectedItemIds.length} items selected</span>
                  </div>
                  {builderDetails.email && <div className="flex justify-between">
                      <span className="text-muted-foreground">Builder Email:</span>
                      <span className="font-medium">{builderDetails.email}</span>
                    </div>}
                </CardContent>
              </Card>
            </div>}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1 || loading}>
              Previous
            </Button>

            <div className="flex gap-2">
              {step < totalSteps && <Button type="button" variant="outline" onClick={handleSaveDraft} disabled={loading || !title.trim() || !message.trim()}>
                  Save Draft
                </Button>}
              
              {step < totalSteps ? <Button type="button" onClick={() => {
                setStep(Math.min(totalSteps, step + 1));
                if (step < 6) setCurrentPhase(Math.min(5, currentPhase + 1));
              }} disabled={loading || (step === 1 && (!title.trim() || !message.trim() || !contractType))}>
                  Next
                </Button> : <Button type="button" onClick={handleSubmit} disabled={loading || !isReadyForTender || !title.trim() || !message.trim() || !submissionDeadline}>
                  {loading ? 'Creating...' : 'Create Tender'}
                </Button>}
              
              <Button type="button" variant="outline" onClick={() => {
              resetForm();
              onOpenChange(false);
            }} disabled={loading}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
};