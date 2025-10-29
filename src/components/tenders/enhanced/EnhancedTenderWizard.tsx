import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenders } from '@/hooks/useTenders';
import { useDocuments } from '@/hooks/useDocuments';
import { ChevronLeft, ChevronRight, FileDown, FileText, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DrawingsUploadManager } from '../DrawingsUploadManager';
import { TenderLineItemsDisplay } from '../TenderLineItemsDisplay';

// Comprehensive scope items organized by category
const SCOPE_ITEMS = {
  sitePreparation: [
    'Site clearing and vegetation removal',
    'Excavation and earthworks',
    'Site levelling and grading',
    'Soil testing and classification',
    'Temporary site fencing and hoarding',
    'Site survey and set-out',
    'Tree protection measures',
    'Erosion and sediment control'
  ],
  foundations: [
    'Concrete slab-on-ground',
    'Timber frame construction',
    'Structural steel (if applicable)',
    'Reinforcement and mesh',
    'Footings and foundations',
    'Termite protection',
    'Damp-proof course',
    'Foundation waterproofing'
  ],
  buildingEnvelope: [
    'Brick veneer cladding',
    'Rendered façade finish',
    'Colorbond roofing',
    'Roof insulation (R-value specified)',
    'Wall insulation (R-value specified)',
    'Windows and external doors',
    'Fascia and guttering',
    'Eaves and soffits'
  ],
  internalWorks: [
    'Internal wall framing and lining',
    'Plastering and cornice work',
    'Internal painting (walls and ceilings)',
    'Flooring (timber/vinyl/tiles)',
    'Kitchen cabinetry and benchtops',
    'Kitchen appliances installation',
    'Bathroom fit-out and fixtures',
    'Ensuite and powder room fit-out',
    'Laundry fit-out',
    'Built-in wardrobes and joinery',
    'Internal doors and hardware',
    'Skirting boards and architraves'
  ],
  services: [
    'Electrical installation and wiring',
    'Lighting fixtures and switches',
    'Data cabling and NBN connection',
    'Plumbing installation',
    'Gas fitting and connection',
    'Hot water system installation',
    'HVAC system (split or ducted)',
    'Heating system installation',
    'Smoke alarms and safety switches',
    'Water and sewer connection',
    'Stormwater drainage'
  ],
  externalWorks: [
    'Concrete driveway',
    'Paved pathways and patio',
    'Turf installation',
    'Garden planting and mulching',
    'Boundary fencing',
    'Side gates and access',
    'Letterbox installation',
    'Clothesline installation',
    'External taps and hose reels',
    'Driveway crossover and kerb'
  ]
};

// Compliance requirements based on Victorian standards
const COMPLIANCE_ITEMS = [
  'Victorian Building Authority (VBA) regulations',
  'National Construction Code (NCC 2022 – Volume 2)',
  'Energy efficiency (7-star minimum under NatHERS)',
  'Local Council planning permit conditions',
  'WorkSafe Victoria OH&S compliance',
  'AS 3959 (Bushfire construction standards)',
  'Plumbing Code of Australia',
  'Australian Standards for electrical work'
];

// Contractor requirements
const CONTRACTOR_REQUIREMENTS = [
  'Domestic Builder (Unlimited) registration',
  'Public Liability Insurance ($20M minimum)',
  'Home Warranty Insurance (where required)',
  'WorkSafe Victoria registration',
  'Site Safety Management Plan',
  'Environmental Management Plan',
  'Quality Assurance procedures',
  'Waste Management Plan',
  'Traffic Management Plan (if required)'
];

// Environmental targets
const ENVIRONMENTAL_TARGETS = [
  'Achieve minimum 7-star energy rating',
  'Minimize construction waste (80% recycling target)',
  'Use sustainable and locally sourced materials',
  'Implement water-saving fixtures',
  'Install solar panels (if applicable)',
  'Use low-VOC paints and finishes'
];

// Communication objectives
const COMMUNICATION_OBJECTIVES = [
  'Weekly progress reports with site photos',
  'Fortnightly site meetings with client',
  'Accessible project portal for documentation',
  'Shared construction schedule (updated weekly)',
  'Transparent cost tracking',
  'Prompt response to client queries (within 24 hours)'
];

interface EnhancedTenderWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  existingTender?: any;
}

export const EnhancedTenderWizard = ({ open, onOpenChange, projectId, existingTender }: EnhancedTenderWizardProps) => {
  const [step, setStep] = useState(1);
  const totalSteps = 5; // Streamlined wizard
  const { toast } = useToast();
  const { createTender, updateTender } = useTenders();
  const [currentTenderId, setCurrentTenderId] = useState<string | undefined>(existingTender?.id);

  // Project data
  const [projectData, setProjectData] = useState<any>(null);
  const [companyData, setCompanyData] = useState<any>(null);

  // Step 1 - Tender Information (auto-populated)
  const [title, setTitle] = useState('');
  const [projectAddress, setProjectAddress] = useState('');
  const [clientName, setClientName] = useState('');
  const [tenderReferenceNo, setTenderReferenceNo] = useState('');
  const [message, setMessage] = useState('');

  // Step 2 - Project Scope (checkboxes)
  const [selectedScope, setSelectedScope] = useState<Record<string, string[]>>({
    sitePreparation: [],
    foundations: [],
    buildingEnvelope: [],
    internalWorks: [],
    services: [],
    externalWorks: []
  });

  // Step 3 - Contract & Compliance (checkboxes)
  const [tenderType, setTenderType] = useState<'open' | 'selective' | 'negotiated'>('open');
  const [contractType, setContractType] = useState('lump_sum');
  const [selectedCompliance, setSelectedCompliance] = useState<string[]>([]);
  const [selectedContractorReqs, setSelectedContractorReqs] = useState<string[]>([]);

  // Step 4 - Budget & Timeline (auto-calculated)
  const [budget, setBudget] = useState('');
  const [estimatedStartDate, setEstimatedStartDate] = useState('');
  const [completionWeeks, setCompletionWeeks] = useState('36');
  const [completionDate, setCompletionDate] = useState('');

  // Step 5 - Environmental Targets
  const [selectedEnvironmental, setSelectedEnvironmental] = useState<string[]>([]);
  const [customEnvironmental, setCustomEnvironmental] = useState('');

  // Step 6 - Communication & Transparency
  const [selectedCommunication, setSelectedCommunication] = useState<string[]>([]);
  const [reportingFrequency, setReportingFrequency] = useState('weekly');
  const [preferredFormat, setPreferredFormat] = useState('email');

  // Step 7 - Site Conditions
  const [siteAccess, setSiteAccess] = useState('');
  const [terrain, setTerrain] = useState<string[]>([]);
  const [vegetationDemolition, setVegetationDemolition] = useState('');
  const [existingServices, setExistingServices] = useState<string[]>([]);
  const [neighboringStructures, setNeighboringStructures] = useState('');

  // Step 8 - Attachments (was Step 9)
  const [attachments, setAttachments] = useState<File[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [showDocumentPicker, setShowDocumentPicker] = useState(false);

  const [loading, setLoading] = useState(false);
  
  const { documents } = useDocuments(projectId);

  // Fetch project data and auto-populate
  useEffect(() => {
    if (open && projectId) {
      fetchProjectData();
    }
  }, [open, projectId]);

  // Populate form when editing existing tender
  useEffect(() => {
    if (existingTender && open) {
      setTitle(existingTender.title || '');
      setMessage(existingTender.description || '');
      setBudget(existingTender.budget?.toString() || '');
      setEstimatedStartDate(existingTender.estimated_start_date || '');
      
      const reqs = existingTender.requirements || {};
      setSelectedCompliance(reqs.compliance || []);
      setSelectedContractorReqs(reqs.contractor || []);
      setSelectedEnvironmental(reqs.environmental || []);
      setSelectedCommunication(reqs.communication || []);
      setSelectedScope(reqs.scope || {});
      setTenderType(existingTender.tender_type || 'open');
      
      if (reqs.timeline) {
        setCompletionWeeks(reqs.timeline.completion_weeks || '36');
        setCompletionDate(reqs.timeline.completion_date || '');
      }
      
      if (reqs.site_conditions) {
        setSiteAccess(reqs.site_conditions.access || '');
        setTerrain(reqs.site_conditions.terrain || []);
        setVegetationDemolition(reqs.site_conditions.vegetation_demolition || '');
        setExistingServices(reqs.site_conditions.existing_services || []);
        setNeighboringStructures(reqs.site_conditions.neighboring_structures || '');
      }
      
      if (reqs.communication_details) {
        setReportingFrequency(reqs.communication_details.reporting_frequency || 'weekly');
        setPreferredFormat(reqs.communication_details.preferred_format || 'email');
      }
      
      setCustomEnvironmental(reqs.custom_environmental || '');
      setContractType(reqs.contract_type || 'lump_sum');
    }
  }, [existingTender, open]);

  // Auto-calculate completion date
  useEffect(() => {
    if (estimatedStartDate && completionWeeks) {
      const startDate = new Date(estimatedStartDate);
      const weeksNum = parseInt(completionWeeks);
      if (!isNaN(weeksNum)) {
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + (weeksNum * 7));
        setCompletionDate(endDate.toISOString().split('T')[0]);
      }
    }
  }, [estimatedStartDate, completionWeeks]);

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

      setProjectData(project);

      // Auto-populate fields
      setTitle(project.name || '');
      setProjectAddress(project.address || '');
      setBudget(project.budget?.toString() || '');
      
      // Extract client name from timeline or project creator
      const timeline = project.timeline as any;
      const homeownerData = timeline?.pending_homeowner;
      setClientName(homeownerData?.name || creatorProfile?.name || '');

      // Get company name for tender reference
      setCompanyData({ name: companyName });

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

      // Auto-select default compliance and contractor requirements
      setSelectedCompliance(COMPLIANCE_ITEMS.slice(0, 4)); // Select first 4 by default
      setSelectedContractorReqs(CONTRACTOR_REQUIREMENTS.slice(0, 5)); // Select first 5 by default
      setSelectedEnvironmental(ENVIRONMENTAL_TARGETS.slice(0, 3));
      setSelectedCommunication(COMMUNICATION_OBJECTIVES);

    } catch (error: any) {
      console.error('Error fetching project data:', error);
      toast({
        title: "Error loading project",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const toggleScopeItem = (category: string, item: string) => {
    setSelectedScope(prev => {
      const categoryItems = prev[category] || [];
      const newItems = categoryItems.includes(item)
        ? categoryItems.filter(i => i !== item)
        : [...categoryItems, item];
      return { ...prev, [category]: newItems };
    });
  };

  const toggleItem = (
    items: string[],
    setItems: React.Dispatch<React.SetStateAction<string[]>>,
    item: string
  ) => {
    setItems(prev => 
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const toggleAllInCategory = (category: string) => {
    const categoryItems = SCOPE_ITEMS[category as keyof typeof SCOPE_ITEMS];
    const currentItems = selectedScope[category] || [];
    const allSelected = currentItems.length === categoryItems.length;
    
    setSelectedScope(prev => ({
      ...prev,
      [category]: allSelected ? [] : [...categoryItems]
    }));
  };

  const toggleAllCompliance = () => {
    const allSelected = selectedCompliance.length === COMPLIANCE_ITEMS.length;
    setSelectedCompliance(allSelected ? [] : [...COMPLIANCE_ITEMS]);
  };

  const toggleAllContractorReqs = () => {
    const allSelected = selectedContractorReqs.length === CONTRACTOR_REQUIREMENTS.length;
    setSelectedContractorReqs(allSelected ? [] : [...CONTRACTOR_REQUIREMENTS]);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Compile all tender data
      const tenderData = {
        project_id: projectId,
        title,
        description: message,
        deadline: existingTender?.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        estimated_start_date: estimatedStartDate || undefined,
        budget: budget ? parseFloat(budget) : undefined,
        tender_type: tenderType,
        status: existingTender ? existingTender.status : 'draft',
        requirements: {
          compliance: selectedCompliance,
          contractor: selectedContractorReqs,
          timeline: {
            start_date: estimatedStartDate,
            completion_weeks: completionWeeks,
            completion_date: completionDate
          },
          contract_type: contractType
        }
      };

      let tenderId;
      if (existingTender) {
        // Update existing tender
        const success = await updateTender(existingTender.id, tenderData);
        if (!success) {
          throw new Error('Tender could not be updated. Please try again.');
        }
        tenderId = existingTender.id;
        toast({
          title: "Tender updated successfully",
          description: "Your tender package has been updated"
        });
      } else {
        // Create new tender
        const result = await createTender(tenderData);
        if (!result) {
          throw new Error('Tender could not be saved. Please review required fields and try again.');
        }
        tenderId = result.id;
        setCurrentTenderId(tenderId);
        toast({
          title: "Tender created successfully",
          description: "Your tender package is ready"
        });
      }

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: existingTender ? "Error updating tender" : "Error creating tender",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        // Step 1: Tender Information + Budget & Timeline (consolidated)
        return (
          <div className="space-y-4">
            <div>
              <Label>Project Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label>Project Address</Label>
              <Input value={projectAddress} onChange={(e) => setProjectAddress(e.target.value)} />
            </div>
            <div>
              <Label>Client Name</Label>
              <Input value={clientName} onChange={(e) => setClientName(e.target.value)} />
            </div>
            <div>
              <Label>Tender Reference No.</Label>
              <Input value={tenderReferenceNo} readOnly className="bg-muted" />
            </div>
            
            <div className="border-t pt-4 mt-6">
              <h3 className="text-lg font-semibold mb-4">Budget & Timeline</h3>
              <div className="space-y-4">
                <div>
                  <Label>Budget (AUD)</Label>
                  <Input 
                    type="number" 
                    value={budget} 
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="780000"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Estimated Start Date</Label>
                    <Input 
                      type="date" 
                      value={estimatedStartDate} 
                      onChange={(e) => setEstimatedStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Completion Weeks</Label>
                    <Input 
                      type="number" 
                      value={completionWeeks} 
                      onChange={(e) => setCompletionWeeks(e.target.value)}
                      placeholder="36"
                    />
                  </div>
                </div>

                {completionDate && (
                  <div>
                    <Label>Calculated Completion Date</Label>
                    <Input 
                      type="date" 
                      value={completionDate} 
                      readOnly 
                      className="bg-muted"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        // Step 2: Drawings Upload + Line Items
        return (
          <div className="space-y-6">
            <DrawingsUploadManager 
              projectId={projectId}
              tenderId={currentTenderId}
              onLineItemsImported={(items) => {
                toast({
                  title: "Line items imported",
                  description: `${items.length} line items ready for tender package`
                });
              }}
            />
            
            {currentTenderId && (
              <div className="mt-6">
                <TenderLineItemsDisplay tenderId={currentTenderId} />
              </div>
            )}
          </div>
        );

      case 3:
        // Step 3: Contract & Compliance
        return (
          <div className="space-y-6">
            <div>
              <Label>Contract Type</Label>
              <Select value={contractType} onValueChange={setContractType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lump_sum">Lump Sum</SelectItem>
                  <SelectItem value="time_materials">Time & Materials</SelectItem>
                  <SelectItem value="unit_price">Unit Price</SelectItem>
                  <SelectItem value="gmp">Guaranteed Maximum Price</SelectItem>
                  <SelectItem value="cost_plus">Cost-Plus</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle>Compliance Requirements</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={toggleAllCompliance}
                >
                  {selectedCompliance.length === COMPLIANCE_ITEMS.length ? 'Deselect All' : 'Select All'}
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {COMPLIANCE_ITEMS.map((item) => (
                  <div key={item} className="flex items-center space-x-2">
                    <Checkbox
                      id={`compliance-${item}`}
                      checked={selectedCompliance.includes(item)}
                      onCheckedChange={() => toggleItem(selectedCompliance, setSelectedCompliance, item)}
                    />
                    <Label htmlFor={`compliance-${item}`} className="font-normal cursor-pointer">
                      {item}
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle>Contractor Must Provide</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={toggleAllContractorReqs}
                >
                  {selectedContractorReqs.length === CONTRACTOR_REQUIREMENTS.length ? 'Deselect All' : 'Select All'}
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {CONTRACTOR_REQUIREMENTS.map((item) => (
                  <div key={item} className="flex items-center space-x-2">
                    <Checkbox
                      id={`contractor-${item}`}
                      checked={selectedContractorReqs.includes(item)}
                      onCheckedChange={() => toggleItem(selectedContractorReqs, setSelectedContractorReqs, item)}
                    />
                    <Label htmlFor={`contractor-${item}`} className="font-normal cursor-pointer">
                      {item}
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        );

      case 4:
        // Step 4: Supporting Documents
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Supporting Documents</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowDocumentPicker(!showDocumentPicker)}
              >
                <FileText className="h-4 w-4 mr-2" />
                {showDocumentPicker ? 'Hide' : 'Select from'} Document Register
              </Button>
            </div>

            {showDocumentPicker && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Available Documents</CardTitle>
                </CardHeader>
                <CardContent className="max-h-64 overflow-y-auto space-y-2">
                  {documents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No documents available in the register</p>
                  ) : (
                    documents.map((doc) => (
                      <div key={doc.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`doc-${doc.id}`}
                          checked={selectedDocuments.includes(doc.id)}
                          onCheckedChange={(checked) => {
                            setSelectedDocuments(prev =>
                              checked
                                ? [...prev, doc.id]
                                : prev.filter(id => id !== doc.id)
                            );
                          }}
                        />
                        <Label htmlFor={`doc-${doc.id}`} className="font-normal cursor-pointer text-sm">
                          {doc.name}
                        </Label>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            )}

            {selectedDocuments.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-semibold mb-2">Selected Documents ({selectedDocuments.length})</p>
                <div className="flex flex-wrap gap-2">
                  {selectedDocuments.map(docId => {
                    const doc = documents.find(d => d.id === docId);
                    return doc ? (
                      <Badge key={docId} variant="secondary" className="flex items-center gap-1">
                        {doc.name}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => setSelectedDocuments(prev => prev.filter(id => id !== docId))}
                        />
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        );

      case 5:
        // Step 5: Review Package
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tender Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-semibold">Project:</p>
                  <p className="text-sm text-muted-foreground">{title}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">Reference:</p>
                  <p className="text-sm text-muted-foreground">{tenderReferenceNo}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">Budget:</p>
                  <p className="text-sm text-muted-foreground">${budget ? parseFloat(budget).toLocaleString() : 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">Timeline:</p>
                  <p className="text-sm text-muted-foreground">
                    {estimatedStartDate} to {completionDate} ({completionWeeks} weeks)
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold">Compliance Requirements:</p>
                  <p className="text-sm text-muted-foreground">{selectedCompliance.length} items</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">Supporting Documents:</p>
                  <p className="text-sm text-muted-foreground">{selectedDocuments.length} attached</p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  toast({
                    title: "Package Preview",
                    description: "Preview functionality will be available soon"
                  });
                }}
              >
                <FileDown className="h-4 w-4 mr-2" />
                View Package Preview
              </Button>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground text-center">
                Review your tender package before creating. You can preview and make adjustments before finalizing.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Create New Tender - Step {step} of {totalSteps}</DialogTitle>
        </DialogHeader>

        <Progress value={(step / totalSteps) * 100} className="mb-4" />

        <div className="flex-1 overflow-y-auto px-1">
          {renderStep()}
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {step < totalSteps ? (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Creating...' : 'Create Tender'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
