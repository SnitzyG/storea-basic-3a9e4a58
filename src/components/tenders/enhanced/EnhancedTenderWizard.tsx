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
import { ChevronLeft, ChevronRight, FileDown } from 'lucide-react';

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
}

export const EnhancedTenderWizard = ({ open, onOpenChange, projectId }: EnhancedTenderWizardProps) => {
  const [step, setStep] = useState(1);
  const totalSteps = 10;
  const { toast } = useToast();
  const { createTender } = useTenders();

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
  const [contractType, setContractType] = useState('lump_sum');
  const [selectedCompliance, setSelectedCompliance] = useState<string[]>([]);
  const [selectedContractorReqs, setSelectedContractorReqs] = useState<string[]>([]);

  // Step 4 - Budget & Timeline (auto-calculated)
  const [budget, setBudget] = useState('');
  const [estimatedStartDate, setEstimatedStartDate] = useState('');
  const [completionWeeks, setCompletionWeeks] = useState('36');
  const [completionDate, setCompletionDate] = useState('');
  const [selectedEnvironmental, setSelectedEnvironmental] = useState<string[]>([]);
  const [selectedCommunication, setSelectedCommunication] = useState<string[]>([]);
  const [defectRate, setDefectRate] = useState('1');

  const [loading, setLoading] = useState(false);

  // Fetch project data and auto-populate
  useEffect(() => {
    if (open && projectId) {
      fetchProjectData();
    }
  }, [open, projectId]);

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

      // Set estimated start date from project timeline
      const estimatedStart = timeline?.estimated_start_date;
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

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Compile all tender data
      const tenderData = {
        project_id: projectId,
        title,
        description: message,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        estimated_start_date: estimatedStartDate || undefined,
        budget: budget ? parseFloat(budget) : undefined,
        contract_type: contractType,
        requirements: {
          compliance: selectedCompliance,
          contractor: selectedContractorReqs,
          environmental: selectedEnvironmental,
          communication: selectedCommunication
        }
      };

      await createTender(tenderData);
      
      toast({
        title: "Tender created successfully",
        description: "Your tender package is ready"
      });
      
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error creating tender",
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
        // Step 1: Tender Information (auto-populated)
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
            <div>
              <Label>Project Overview</Label>
              <Textarea 
                value={message} 
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Brief description of the project..."
                rows={4}
              />
            </div>
          </div>
        );

      case 2:
        // Step 2: Project Scope (comprehensive checkboxes)
        return (
          <div className="space-y-6">
            {Object.entries(SCOPE_ITEMS).map(([category, items]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="text-lg capitalize">
                    {category.replace(/([A-Z])/g, ' $1').trim()}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {items.map((item) => (
                    <div key={item} className="flex items-center space-x-2">
                      <Checkbox
                        id={`${category}-${item}`}
                        checked={selectedScope[category]?.includes(item) || false}
                        onCheckedChange={() => toggleScopeItem(category, item)}
                      />
                      <Label htmlFor={`${category}-${item}`} className="font-normal cursor-pointer">
                        {item}
                      </Label>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
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
              <CardHeader>
                <CardTitle>Compliance Requirements</CardTitle>
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
              <CardHeader>
                <CardTitle>Contractor Must Provide</CardTitle>
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
        // Step 4: Budget & Timeline
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Budget (AUD)</Label>
                <Input 
                  type="number" 
                  value={budget} 
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="780000"
                />
              </div>
              <div>
                <Label>Defect Rate Target (%)</Label>
                <Input 
                  type="number" 
                  value={defectRate} 
                  onChange={(e) => setDefectRate(e.target.value)}
                  placeholder="1"
                />
              </div>
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

            <Card>
              <CardHeader>
                <CardTitle>Environmental Targets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {ENVIRONMENTAL_TARGETS.map((item) => (
                  <div key={item} className="flex items-center space-x-2">
                    <Checkbox
                      id={`env-${item}`}
                      checked={selectedEnvironmental.includes(item)}
                      onCheckedChange={() => toggleItem(selectedEnvironmental, setSelectedEnvironmental, item)}
                    />
                    <Label htmlFor={`env-${item}`} className="font-normal cursor-pointer">
                      {item}
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Communication & Transparency Objectives</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {COMMUNICATION_OBJECTIVES.map((item) => (
                  <div key={item} className="flex items-center space-x-2">
                    <Checkbox
                      id={`comm-${item}`}
                      checked={selectedCommunication.includes(item)}
                      onCheckedChange={() => toggleItem(selectedCommunication, setSelectedCommunication, item)}
                    />
                    <Label htmlFor={`comm-${item}`} className="font-normal cursor-pointer">
                      {item}
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Steps 5-10 coming soon...</p>
          </div>
        );
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
