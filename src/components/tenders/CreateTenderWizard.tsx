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
  
  // Project Overview
  const [title, setTitle] = useState('');
  const [projectAddress, setProjectAddress] = useState('');
  const [clientName, setClientName] = useState('');
  const [tenderReferenceNo, setTenderReferenceNo] = useState('');
  
  // Project Scope
  const [message, setMessage] = useState('');
  const [scopeDetails, setScopeDetails] = useState({
    sitePreparation: {
      clearing: false,
      excavation: false,
      levelling: false,
      soilTesting: false,
      temporaryFencing: false,
      custom: ''
    },
    foundations: {
      concreteSlab: false,
      timberFraming: false,
      structuralSteel: false,
      custom: ''
    },
    buildingEnvelope: {
      brickVeneer: false,
      rendering: false,
      colorbondRoofing: false,
      insulation: false,
      custom: ''
    },
    internalWorks: {
      plastering: false,
      painting: false,
      flooring: false,
      kitchenCabinetry: false,
      bathroomFitout: false,
      builtInJoinery: false,
      custom: ''
    },
    services: {
      electrical: false,
      plumbing: false,
      gasFitting: false,
      hvac: false,
      dataCabling: false,
      custom: ''
    },
    externalWorks: {
      concreteDriveway: false,
      pavedPathways: false,
      turf: false,
      planting: false,
      fencing: false,
      custom: ''
    }
  });
  
  // Requirements
  const [contractType, setContractType] = useState('');
  const [complianceRequirements, setComplianceRequirements] = useState('');
  const [contractorRequirements, setContractorRequirements] = useState('');
  
  // Objectives
  const [budget, setBudget] = useState('');
  const [estimatedStartDate, setEstimatedStartDate] = useState('');
  const [completionWeeks, setCompletionWeeks] = useState('');
  const [environmentalTargets, setEnvironmentalTargets] = useState('');
  const [communicationObjectives, setCommunicationObjectives] = useState('');
  const [defectRate, setDefectRate] = useState('1');
  
  // Deliverables
  const [deliverables, setDeliverables] = useState({
    drawings: true,
    engineeringReports: true,
    constructionProgram: true,
    progressReports: true,
    qaChecklists: true,
    occupancyPermit: true
  });
  
  // Milestones
  const [milestones, setMilestones] = useState<Array<{id: string; title: string; description: string; duration: string}>>([]);
  
  // Site Conditions
  const [siteConditions, setSiteConditions] = useState({
    soilClassification: '',
    servicesAvailable: '',
    accessDetails: '',
    workingHours: '7:00 AM – 6:00 PM, Monday to Saturday'
  });
  
  // Submission Requirements
  const [submissionRequirements, setSubmissionRequirements] = useState({
    companyProfile: true,
    projectExperience: true,
    priceBreakdown: true,
    methodology: true,
    managementPlans: true,
    subcontractorList: true,
    warrantyTerms: true
  });
  
  // Evaluation Criteria
  const [evaluationCriteria, setEvaluationCriteria] = useState('');
  
  // Communication
  const [contactPerson, setContactPerson] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [submissionDeadline, setSubmissionDeadline] = useState('');
  const [submissionTime, setSubmissionTime] = useState('17:00');
  const [clarificationDeadline, setClarificationDeadline] = useState('');
  
  // Conditions
  const [tenderValidity, setTenderValidity] = useState('60');
  const [additionalConditions, setAdditionalConditions] = useState('');
  
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
  const totalSteps = 10;
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
    
    // Sync budget to project_budgets table if budget is set
    if (result && budget && parseFloat(budget) > 0) {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Check if budget already exists
      const { data: existingBudget } = await supabase
        .from('project_budgets')
        .select('id')
        .eq('project_id', projectId)
        .single();
      
      if (existingBudget) {
        // Update existing budget
        await supabase
          .from('project_budgets')
          .update({
            original_budget: parseFloat(budget),
            revised_budget: parseFloat(budget)
          })
          .eq('id', existingBudget.id);
      } else {
        // Create new budget
        await supabase
          .from('project_budgets')
          .insert({
            project_id: projectId,
            original_budget: parseFloat(budget),
            revised_budget: parseFloat(budget),
            created_by: user?.id
          });
      }
    }
    
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
    setProjectAddress('');
    setClientName('');
    setTenderReferenceNo('');
    setMessage('');
    setScopeDetails({
      sitePreparation: {
        clearing: false,
        excavation: false,
        levelling: false,
        soilTesting: false,
        temporaryFencing: false,
        custom: ''
      },
      foundations: {
        concreteSlab: false,
        timberFraming: false,
        structuralSteel: false,
        custom: ''
      },
      buildingEnvelope: {
        brickVeneer: false,
        rendering: false,
        colorbondRoofing: false,
        insulation: false,
        custom: ''
      },
      internalWorks: {
        plastering: false,
        painting: false,
        flooring: false,
        kitchenCabinetry: false,
        bathroomFitout: false,
        builtInJoinery: false,
        custom: ''
      },
      services: {
        electrical: false,
        plumbing: false,
        gasFitting: false,
        hvac: false,
        dataCabling: false,
        custom: ''
      },
      externalWorks: {
        concreteDriveway: false,
        pavedPathways: false,
        turf: false,
        planting: false,
        fencing: false,
        custom: ''
      }
    });
    setContractType('');
    setComplianceRequirements('');
    setContractorRequirements('');
    setBudget('');
    setEstimatedStartDate('');
    setCompletionWeeks('');
    setEnvironmentalTargets('');
    setCommunicationObjectives('');
    setDefectRate('1');
    setDeliverables({
      drawings: true,
      engineeringReports: true,
      constructionProgram: true,
      progressReports: true,
      qaChecklists: true,
      occupancyPermit: true
    });
    setMilestones([]);
    setSiteConditions({
      soilClassification: '',
      servicesAvailable: '',
      accessDetails: '',
      workingHours: '7:00 AM – 6:00 PM, Monday to Saturday'
    });
    setSubmissionRequirements({
      companyProfile: true,
      projectExperience: true,
      priceBreakdown: true,
      methodology: true,
      managementPlans: true,
      subcontractorList: true,
      warrantyTerms: true
    });
    setEvaluationCriteria('');
    setContactPerson('');
    setContactEmail('');
    setContactPhone('');
    setSubmissionDeadline('');
    setSubmissionTime('17:00');
    setClarificationDeadline('');
    setTenderValidity('60');
    setAdditionalConditions('');
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
    if (!title.trim()) {
      toast({
        title: "Missing title",
        description: "Please enter a tender title before generating the quote template",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Fetch line items from the tender if it exists
      let lineItems: any[] = [];
      
      if (existingTender?.id) {
        const { data, error } = await supabase
          .from('tender_line_items')
          .select('*')
          .eq('tender_id', existingTender.id)
          .order('line_number', { ascending: true });
        
        if (error) throw error;
        lineItems = data || [];
      }
      
      // If no line items from tender, fall back to selected construction items
      if (lineItems.length === 0 && selectedItemIds.length > 0) {
        const selectedItems = BUILDING_SECTIONS.filter(item => selectedItemIds.includes(item.id));
        lineItems = selectedItems.map((item, index) => ({
          lineNumber: index + 1,
          itemDescription: item.item,
          specification: item.description,
          unitOfMeasure: item.unit,
          category: item.section,
          quantity: null
        }));
      }
      
      if (lineItems.length === 0) {
        toast({
          title: "No items available",
          description: "Please upload drawings to extract line items or select construction items",
          variant: "destructive"
        });
        return;
      }
      
      const companyInfo = getCompanyInfoFromProfile(userProfile, userCompany);
      await generateProfessionalQuoteTemplate({
        tenderTitle: title,
        companyInfo,
        lineItems: lineItems.map(item => ({
          itemDescription: item.item_description || item.itemDescription,
          specification: item.specification,
          unitOfMeasure: item.unit_of_measure || item.unitOfMeasure,
          quantity: item.quantity,
          category: item.category
        })),
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
        description: "Professional XLSX quote template has been downloaded with all line items"
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Create New Tender - Step {step} of {totalSteps}</DialogTitle>
          <Progress value={progress} className="mt-2" />
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Project Overview */}
          {step === 1 && <div className="space-y-6">
              <Card className="bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-base">Project Overview</CardTitle>
                  <CardDescription>Basic project information and identification</CardDescription>
                </CardHeader>
              </Card>

              <div>
                <Label htmlFor="title">Project Title *</Label>
                <Input id="title" placeholder="e.g., Construction of New Single-Storey Residential Dwelling" value={title} onChange={e => setTitle(e.target.value)} className="mt-1" />
              </div>

              <div>
                <Label htmlFor="projectAddress">Project Address *</Label>
                <Input id="projectAddress" placeholder="e.g., 45 Elmwood Drive, Glen Iris, VIC 3146" value={projectAddress} onChange={e => setProjectAddress(e.target.value)} className="mt-1" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientName">Client Name *</Label>
                  <Input id="clientName" placeholder="Client or Owner Name" value={clientName} onChange={e => setClientName(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="tenderReferenceNo">Tender Reference No.</Label>
                  <Input id="tenderReferenceNo" placeholder="e.g., TND-2025-001" value={tenderReferenceNo} onChange={e => setTenderReferenceNo(e.target.value)} className="mt-1" />
                </div>
              </div>

              <div>
                <Label htmlFor="message">Project Overview *</Label>
                <Textarea id="message" placeholder="Brief overview of the project..." value={message} onChange={e => setMessage(e.target.value)} className="min-h-[100px] mt-1" />
              </div>
            </div>}

          {/* Step 2: Project Scope */}
          {step === 2 && <div className="space-y-6">
              <Card className="bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-base">Project Scope</CardTitle>
                  <CardDescription>Select applicable items and add custom details</CardDescription>
                </CardHeader>
              </Card>

              <div className="space-y-6">
                {/* Site Preparation */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Site Preparation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={scopeDetails.sitePreparation.clearing} onChange={e => setScopeDetails({...scopeDetails, sitePreparation: {...scopeDetails.sitePreparation, clearing: e.target.checked}})} className="w-4 h-4" />
                        <span className="text-sm">Clearing</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={scopeDetails.sitePreparation.excavation} onChange={e => setScopeDetails({...scopeDetails, sitePreparation: {...scopeDetails.sitePreparation, excavation: e.target.checked}})} className="w-4 h-4" />
                        <span className="text-sm">Excavation</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={scopeDetails.sitePreparation.levelling} onChange={e => setScopeDetails({...scopeDetails, sitePreparation: {...scopeDetails.sitePreparation, levelling: e.target.checked}})} className="w-4 h-4" />
                        <span className="text-sm">Levelling</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={scopeDetails.sitePreparation.soilTesting} onChange={e => setScopeDetails({...scopeDetails, sitePreparation: {...scopeDetails.sitePreparation, soilTesting: e.target.checked}})} className="w-4 h-4" />
                        <span className="text-sm">Soil Testing</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={scopeDetails.sitePreparation.temporaryFencing} onChange={e => setScopeDetails({...scopeDetails, sitePreparation: {...scopeDetails.sitePreparation, temporaryFencing: e.target.checked}})} className="w-4 h-4" />
                        <span className="text-sm">Temporary Fencing</span>
                      </label>
                    </div>
                    <div>
                      <Label htmlFor="sitePreparationCustom" className="text-xs">Additional Details</Label>
                      <Textarea id="sitePreparationCustom" placeholder="Add any custom site preparation details..." value={scopeDetails.sitePreparation.custom} onChange={e => setScopeDetails({...scopeDetails, sitePreparation: {...scopeDetails.sitePreparation, custom: e.target.value}})} className="min-h-[50px] mt-1" />
                    </div>
                  </CardContent>
                </Card>

                {/* Foundations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Foundations & Structure</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={scopeDetails.foundations.concreteSlab} onChange={e => setScopeDetails({...scopeDetails, foundations: {...scopeDetails.foundations, concreteSlab: e.target.checked}})} className="w-4 h-4" />
                        <span className="text-sm">Concrete Slab</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={scopeDetails.foundations.timberFraming} onChange={e => setScopeDetails({...scopeDetails, foundations: {...scopeDetails.foundations, timberFraming: e.target.checked}})} className="w-4 h-4" />
                        <span className="text-sm">Timber Framing</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={scopeDetails.foundations.structuralSteel} onChange={e => setScopeDetails({...scopeDetails, foundations: {...scopeDetails.foundations, structuralSteel: e.target.checked}})} className="w-4 h-4" />
                        <span className="text-sm">Structural Steel</span>
                      </label>
                    </div>
                    <div>
                      <Label htmlFor="foundationsCustom" className="text-xs">Additional Details</Label>
                      <Textarea id="foundationsCustom" placeholder="Add any custom foundation details..." value={scopeDetails.foundations.custom} onChange={e => setScopeDetails({...scopeDetails, foundations: {...scopeDetails.foundations, custom: e.target.value}})} className="min-h-[50px] mt-1" />
                    </div>
                  </CardContent>
                </Card>

                {/* Building Envelope */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Building Envelope</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={scopeDetails.buildingEnvelope.brickVeneer} onChange={e => setScopeDetails({...scopeDetails, buildingEnvelope: {...scopeDetails.buildingEnvelope, brickVeneer: e.target.checked}})} className="w-4 h-4" />
                        <span className="text-sm">Brick Veneer</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={scopeDetails.buildingEnvelope.rendering} onChange={e => setScopeDetails({...scopeDetails, buildingEnvelope: {...scopeDetails.buildingEnvelope, rendering: e.target.checked}})} className="w-4 h-4" />
                        <span className="text-sm">Rendering</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={scopeDetails.buildingEnvelope.colorbondRoofing} onChange={e => setScopeDetails({...scopeDetails, buildingEnvelope: {...scopeDetails.buildingEnvelope, colorbondRoofing: e.target.checked}})} className="w-4 h-4" />
                        <span className="text-sm">Colorbond Roofing</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={scopeDetails.buildingEnvelope.insulation} onChange={e => setScopeDetails({...scopeDetails, buildingEnvelope: {...scopeDetails.buildingEnvelope, insulation: e.target.checked}})} className="w-4 h-4" />
                        <span className="text-sm">Insulation</span>
                      </label>
                    </div>
                    <div>
                      <Label htmlFor="buildingEnvelopeCustom" className="text-xs">Additional Details</Label>
                      <Textarea id="buildingEnvelopeCustom" placeholder="Add any custom building envelope details..." value={scopeDetails.buildingEnvelope.custom} onChange={e => setScopeDetails({...scopeDetails, buildingEnvelope: {...scopeDetails.buildingEnvelope, custom: e.target.value}})} className="min-h-[50px] mt-1" />
                    </div>
                  </CardContent>
                </Card>

                {/* Internal Works */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Internal Works</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={scopeDetails.internalWorks.plastering} onChange={e => setScopeDetails({...scopeDetails, internalWorks: {...scopeDetails.internalWorks, plastering: e.target.checked}})} className="w-4 h-4" />
                        <span className="text-sm">Plastering</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={scopeDetails.internalWorks.painting} onChange={e => setScopeDetails({...scopeDetails, internalWorks: {...scopeDetails.internalWorks, painting: e.target.checked}})} className="w-4 h-4" />
                        <span className="text-sm">Painting</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={scopeDetails.internalWorks.flooring} onChange={e => setScopeDetails({...scopeDetails, internalWorks: {...scopeDetails.internalWorks, flooring: e.target.checked}})} className="w-4 h-4" />
                        <span className="text-sm">Flooring</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={scopeDetails.internalWorks.kitchenCabinetry} onChange={e => setScopeDetails({...scopeDetails, internalWorks: {...scopeDetails.internalWorks, kitchenCabinetry: e.target.checked}})} className="w-4 h-4" />
                        <span className="text-sm">Kitchen Cabinetry</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={scopeDetails.internalWorks.bathroomFitout} onChange={e => setScopeDetails({...scopeDetails, internalWorks: {...scopeDetails.internalWorks, bathroomFitout: e.target.checked}})} className="w-4 h-4" />
                        <span className="text-sm">Bathroom Fitout</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={scopeDetails.internalWorks.builtInJoinery} onChange={e => setScopeDetails({...scopeDetails, internalWorks: {...scopeDetails.internalWorks, builtInJoinery: e.target.checked}})} className="w-4 h-4" />
                        <span className="text-sm">Built-in Joinery</span>
                      </label>
                    </div>
                    <div>
                      <Label htmlFor="internalWorksCustom" className="text-xs">Additional Details</Label>
                      <Textarea id="internalWorksCustom" placeholder="Add any custom internal works details..." value={scopeDetails.internalWorks.custom} onChange={e => setScopeDetails({...scopeDetails, internalWorks: {...scopeDetails.internalWorks, custom: e.target.value}})} className="min-h-[50px] mt-1" />
                    </div>
                  </CardContent>
                </Card>

                {/* Services */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Services</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={scopeDetails.services.electrical} onChange={e => setScopeDetails({...scopeDetails, services: {...scopeDetails.services, electrical: e.target.checked}})} className="w-4 h-4" />
                        <span className="text-sm">Electrical</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={scopeDetails.services.plumbing} onChange={e => setScopeDetails({...scopeDetails, services: {...scopeDetails.services, plumbing: e.target.checked}})} className="w-4 h-4" />
                        <span className="text-sm">Plumbing</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={scopeDetails.services.gasFitting} onChange={e => setScopeDetails({...scopeDetails, services: {...scopeDetails.services, gasFitting: e.target.checked}})} className="w-4 h-4" />
                        <span className="text-sm">Gas Fitting</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={scopeDetails.services.hvac} onChange={e => setScopeDetails({...scopeDetails, services: {...scopeDetails.services, hvac: e.target.checked}})} className="w-4 h-4" />
                        <span className="text-sm">HVAC</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={scopeDetails.services.dataCabling} onChange={e => setScopeDetails({...scopeDetails, services: {...scopeDetails.services, dataCabling: e.target.checked}})} className="w-4 h-4" />
                        <span className="text-sm">Data Cabling</span>
                      </label>
                    </div>
                    <div>
                      <Label htmlFor="servicesCustom" className="text-xs">Additional Details</Label>
                      <Textarea id="servicesCustom" placeholder="Add any custom services details..." value={scopeDetails.services.custom} onChange={e => setScopeDetails({...scopeDetails, services: {...scopeDetails.services, custom: e.target.value}})} className="min-h-[50px] mt-1" />
                    </div>
                  </CardContent>
                </Card>

                {/* External Works */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">External Works</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={scopeDetails.externalWorks.concreteDriveway} onChange={e => setScopeDetails({...scopeDetails, externalWorks: {...scopeDetails.externalWorks, concreteDriveway: e.target.checked}})} className="w-4 h-4" />
                        <span className="text-sm">Concrete Driveway</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={scopeDetails.externalWorks.pavedPathways} onChange={e => setScopeDetails({...scopeDetails, externalWorks: {...scopeDetails.externalWorks, pavedPathways: e.target.checked}})} className="w-4 h-4" />
                        <span className="text-sm">Paved Pathways</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={scopeDetails.externalWorks.turf} onChange={e => setScopeDetails({...scopeDetails, externalWorks: {...scopeDetails.externalWorks, turf: e.target.checked}})} className="w-4 h-4" />
                        <span className="text-sm">Turf</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={scopeDetails.externalWorks.planting} onChange={e => setScopeDetails({...scopeDetails, externalWorks: {...scopeDetails.externalWorks, planting: e.target.checked}})} className="w-4 h-4" />
                        <span className="text-sm">Planting</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={scopeDetails.externalWorks.fencing} onChange={e => setScopeDetails({...scopeDetails, externalWorks: {...scopeDetails.externalWorks, fencing: e.target.checked}})} className="w-4 h-4" />
                        <span className="text-sm">Fencing</span>
                      </label>
                    </div>
                    <div>
                      <Label htmlFor="externalWorksCustom" className="text-xs">Additional Details</Label>
                      <Textarea id="externalWorksCustom" placeholder="Add any custom external works details..." value={scopeDetails.externalWorks.custom} onChange={e => setScopeDetails({...scopeDetails, externalWorks: {...scopeDetails.externalWorks, custom: e.target.value}})} className="min-h-[50px] mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>}

          {/* Step 3: Requirements & Contract Type */}
          {step === 3 && <div className="space-y-6">
              <Card className="bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-base">Project Requirements</CardTitle>
                  <CardDescription>Compliance, contractor requirements, and contract type</CardDescription>
                </CardHeader>
              </Card>

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

              <div>
                <Label htmlFor="complianceRequirements">Compliance Requirements</Label>
                <Textarea id="complianceRequirements" placeholder="e.g., NCC 2022 Volume 2, Victorian Building Regulations, Council permits..." value={complianceRequirements} onChange={e => setComplianceRequirements(e.target.value)} className="min-h-[100px] mt-1" />
              </div>

              <div>
                <Label htmlFor="contractorRequirements">Contractor Must Provide</Label>
                <Textarea id="contractorRequirements" placeholder="e.g., VBA registration, insurance, warranties, safety plans..." value={contractorRequirements} onChange={e => setContractorRequirements(e.target.value)} className="min-h-[100px] mt-1" />
              </div>
            </div>}

          {/* Step 4: Project Objectives */}
          {step === 4 && <div className="space-y-6">
              <Card className="bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-base">Project Objectives</CardTitle>
                  <CardDescription>Budget, timeline, and quality targets</CardDescription>
                </CardHeader>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budget">Budget (excl. GST)</Label>
                  <Input id="budget" type="number" placeholder="780000" value={budget} onChange={e => setBudget(e.target.value)} className="mt-1" />
                </div>

                <div>
                  <Label htmlFor="completionWeeks">Completion Timeline (weeks)</Label>
                  <Input id="completionWeeks" type="number" placeholder="36" value={completionWeeks} onChange={e => setCompletionWeeks(e.target.value)} className="mt-1" />
                </div>

                <div>
                  <Label htmlFor="estimatedStartDate">Estimated Start Date</Label>
                  <Input id="estimatedStartDate" type="date" min={today} value={estimatedStartDate} onChange={e => setEstimatedStartDate(e.target.value)} className="mt-1" />
                </div>

                <div>
                  <Label htmlFor="defectRate">Target Defect Rate (%)</Label>
                  <Input id="defectRate" type="number" step="0.1" placeholder="1" value={defectRate} onChange={e => setDefectRate(e.target.value)} className="mt-1" />
                </div>
              </div>

              <div>
                <Label htmlFor="environmentalTargets">Environmental Targets</Label>
                <Textarea id="environmentalTargets" placeholder="e.g., 80% material recycling rate, energy efficiency targets..." value={environmentalTargets} onChange={e => setEnvironmentalTargets(e.target.value)} className="min-h-[80px] mt-1" />
              </div>

              <div>
                <Label htmlFor="communicationObjectives">Communication & Transparency Objectives</Label>
                <Textarea id="communicationObjectives" placeholder="e.g., Weekly progress meetings, transparent reporting..." value={communicationObjectives} onChange={e => setCommunicationObjectives(e.target.value)} className="min-h-[80px] mt-1" />
              </div>
            </div>}

          {/* Step 5: Site Conditions */}
          {step === 5 && <div className="space-y-6">
              <Card className="bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-base">Site Conditions</CardTitle>
                  <CardDescription>Physical site details and access information</CardDescription>
                </CardHeader>
              </Card>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="soilClassification">Soil Classification</Label>
                  <Input id="soilClassification" placeholder="e.g., Class M - moderately reactive clay" value={siteConditions.soilClassification} onChange={e => setSiteConditions({...siteConditions, soilClassification: e.target.value})} className="mt-1" />
                </div>

                <div>
                  <Label htmlFor="servicesAvailable">Services Available</Label>
                  <Textarea id="servicesAvailable" placeholder="e.g., Water, gas, electricity available to boundary..." value={siteConditions.servicesAvailable} onChange={e => setSiteConditions({...siteConditions, servicesAvailable: e.target.value})} className="min-h-[60px] mt-1" />
                </div>

                <div>
                  <Label htmlFor="accessDetails">Site Access Details</Label>
                  <Textarea id="accessDetails" placeholder="e.g., Access via residential street, parking restrictions..." value={siteConditions.accessDetails} onChange={e => setSiteConditions({...siteConditions, accessDetails: e.target.value})} className="min-h-[60px] mt-1" />
                </div>

                <div>
                  <Label htmlFor="workingHours">Working Hours</Label>
                  <Input id="workingHours" placeholder="7:00 AM – 6:00 PM, Monday to Saturday" value={siteConditions.workingHours} onChange={e => setSiteConditions({...siteConditions, workingHours: e.target.value})} className="mt-1" />
                </div>
              </div>
            </div>}

          {/* Step 6: Tender Documents */}
          {step === 6 && <div className="space-y-4">
              <Card className="bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-base">Tender Package Documents</CardTitle>
                  <CardDescription>Upload all required tender documentation</CardDescription>
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

          {/* Step 7: Submission Requirements & Evaluation */}
          {step === 7 && <div className="space-y-6">
              <Card className="bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-base">Tender Submission Requirements</CardTitle>
                  <CardDescription>What tenderers must submit and evaluation criteria</CardDescription>
                </CardHeader>
              </Card>

              <div>
                <Label>Required Submissions</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={submissionRequirements.companyProfile} onChange={(e) => setSubmissionRequirements({...submissionRequirements, companyProfile: e.target.checked})} />
                    <span className="text-sm">Company profile and current builder registration</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={submissionRequirements.projectExperience} onChange={(e) => setSubmissionRequirements({...submissionRequirements, projectExperience: e.target.checked})} />
                    <span className="text-sm">Relevant project experience (3 examples)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={submissionRequirements.priceBreakdown} onChange={(e) => setSubmissionRequirements({...submissionRequirements, priceBreakdown: e.target.checked})} />
                    <span className="text-sm">Detailed price breakdown</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={submissionRequirements.methodology} onChange={(e) => setSubmissionRequirements({...submissionRequirements, methodology: e.target.checked})} />
                    <span className="text-sm">Construction methodology and program</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={submissionRequirements.managementPlans} onChange={(e) => setSubmissionRequirements({...submissionRequirements, managementPlans: e.target.checked})} />
                    <span className="text-sm">Quality, safety, and environmental management plans</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={submissionRequirements.subcontractorList} onChange={(e) => setSubmissionRequirements({...submissionRequirements, subcontractorList: e.target.checked})} />
                    <span className="text-sm">Proposed subcontractor and supplier list</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={submissionRequirements.warrantyTerms} onChange={(e) => setSubmissionRequirements({...submissionRequirements, warrantyTerms: e.target.checked})} />
                    <span className="text-sm">Warranty and defect liability terms</span>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="evaluationCriteria">Evaluation Criteria</Label>
                <Textarea id="evaluationCriteria" placeholder="e.g., Compliance with specs, experience, price competitiveness, timeline, quality assurance..." value={evaluationCriteria} onChange={e => setEvaluationCriteria(e.target.value)} className="min-h-[120px] mt-1" />
              </div>
            </div>}

          {/* Step 8: Construction Items & Quote Template */}
          {step === 8 && <div className="space-y-4">
              <Card className="bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Construction Work Items
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

          {/* Step 9: Communication & Deadlines */}
          {step === 9 && <div className="space-y-6">
              <Card className="bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-base">Communication & Deadlines</CardTitle>
                  <CardDescription>Contact details and important dates</CardDescription>
                </CardHeader>
              </Card>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  <Input id="contactPerson" placeholder="Project Manager Name" value={contactPerson} onChange={e => setContactPerson(e.target.value)} className="mt-1" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactEmail">Contact Email *</Label>
                    <Input id="contactEmail" type="email" placeholder="contact@example.com" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="mt-1" />
                  </div>

                  <div>
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input id="contactPhone" type="tel" placeholder="+61 xxx xxx xxx" value={contactPhone} onChange={e => setContactPhone(e.target.value)} className="mt-1" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clarificationDeadline">Clarification Questions Close</Label>
                    <Input id="clarificationDeadline" type="date" min={today} value={clarificationDeadline} onChange={e => setClarificationDeadline(e.target.value)} className="mt-1" />
                  </div>

                  <div>
                    <Label htmlFor="submissionDeadline">Tender Submission Deadline *</Label>
                    <div className="flex gap-2 mt-1">
                      <Input id="submissionDeadline" type="date" min={minDeadline} value={submissionDeadline} onChange={e => setSubmissionDeadline(e.target.value)} className="flex-1" />
                      <Input type="time" value={submissionTime} onChange={e => setSubmissionTime(e.target.value)} className="w-32" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tenderValidity">Tender Validity Period (days)</Label>
                    <Input id="tenderValidity" type="number" placeholder="60" value={tenderValidity} onChange={e => setTenderValidity(e.target.value)} className="mt-1" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="additionalConditions">Additional Conditions</Label>
                  <Textarea id="additionalConditions" placeholder="Any special conditions or requirements..." value={additionalConditions} onChange={e => setAdditionalConditions(e.target.value)} className="min-h-[80px] mt-1" />
                </div>
              </div>
            </div>}

          {/* Step 10: Contractor Invitation (Optional) */}
          {step === 10 && <div className="space-y-4">
              <Card className="bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileUp className="w-5 h-5" />
                    Contractor Invitation (Optional)
                  </CardTitle>
                  <CardDescription>Specify contractor details to send tender invitation via email</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Builder Details</CardTitle>
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

              <div className="mt-6">
                <Card className={isReadyForTender ? 'border-green-500' : ''}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="readyCheck" 
                        checked={isReadyForTender} 
                        onChange={e => setIsReadyForTender(e.target.checked)} 
                        className="w-4 h-4" 
                      />
                      <Label htmlFor="readyCheck" className="cursor-pointer">
                        I confirm this tender package is complete and ready
                      </Label>
                    </div>
                  </CardContent>
                </Card>
              </div>
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
              }} disabled={loading || (step === 1 && !title.trim())}>
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
    </Dialog>
  );
}