import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar as CalendarIcon, MapPin, DollarSign, Home, Building2, Factory, Plus, X, ChevronRight, ChevronLeft, Check, Users, Mail, Phone, User, Briefcase, Settings, FileText, Target, Clock } from 'lucide-react';
import { format, addMonths } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAdvancedProjects, AdvancedProject, ProjectUser } from '@/hooks/useAdvancedProjects';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
interface AdvancedProjectWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectToEdit?: AdvancedProject | null;
}
interface CollaboratorData {
  email: string;
  name: string;
  role: ProjectUser['role'];
  permissions?: Partial<ProjectUser['permissions']>;
}
interface HomeownerData {
  name: string;
  email: string;
  phone?: string;
}

// Helper function to convert budget range strings to numbers for database storage
const convertBudgetStringToNumber = (budgetString: string): number => {
  const budgetMap: Record<string, number> = {
    "< $100,000": 50000,
    "$100,000 – $200,000": 150000,
    "$200,000 – $300,000": 250000,
    "$300,000 – $400,000": 350000,
    "$400,000 – $500,000": 450000,
    "$500,000 – $750,000": 625000,
    "$750,000 – $1,000,000": 875000,
    "$1,000,000 – $1,500,000": 1250000,
    "$1,500,000 – $2,000,000": 1750000,
    "$2,000,000 – $2,500,000": 2250000,
    "$2,500,000+": 3000000
  };
  return budgetMap[budgetString] || 0;
};
const PRIORITY_LEVELS = [{
  value: 'low',
  label: 'Low Priority',
  color: 'bg-gray-100 text-gray-800'
}, {
  value: 'medium',
  label: 'Medium Priority',
  color: 'bg-blue-100 text-blue-800'
}, {
  value: 'high',
  label: 'High Priority',
  color: 'bg-orange-100 text-orange-800'
}, {
  value: 'urgent',
  label: 'Urgent',
  color: 'bg-red-100 text-red-800'
}];
const ROLES = [{
  value: 'architect',
  label: 'Architect'
}, {
  value: 'project_manager',
  label: 'Project Manager'
}, {
  value: 'contractor',
  label: 'Contractor'
}, {
  value: 'subcontractor',
  label: 'Subcontractor'
}, {
  value: 'consultant',
  label: 'Consultant'
}, {
  value: 'homeowner',
  label: 'Homeowner'
}, {
  value: 'client',
  label: 'Client'
}];
export const AdvancedProjectWizard = ({
  open,
  onOpenChange,
  projectToEdit
}: AdvancedProjectWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const {
    createProject,
    updateProject
  } = useAdvancedProjects();
  const {
    profile
  } = useAuth();
  const {
    toast
  } = useToast();

  // Check if user is architect to show architectural fees step
  const isArchitect = profile?.role === 'architect';
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [formData, setFormData] = useState({
    // Step 1: Basic Information
    project_reference_number: '',
    name: '',
    description: '',
    project_category: 'new_construction',
    project_type: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    street_number: '',
    street_name: '',
    suburb: '',
    postcode: '',
    // Step 2: Project Details
    budget: 100000,
    square_footage: '',
    number_of_floors: '',
    estimated_start_date: undefined as Date | undefined,
    estimated_finish_date: undefined as Date | undefined,
    // Step 3: Architectural Fees (Architect only)
    architectural_fees: undefined,
    // Step 4: Client Information (Step 3 for non-architects)
    homeowners: [] as HomeownerData[]
  });

  // Reset and populate form data when dialog opens or projectToEdit changes
  useEffect(() => {
    if (open) {
      if (projectToEdit) {
        // Editing mode - populate with existing project data
        setFormData({
          project_reference_number: projectToEdit.project_reference_number || '',
          name: projectToEdit.name || '',
          description: projectToEdit.description || '',
          project_category: projectToEdit.project_type || 'new_construction',
          project_type: projectToEdit.project_type || '',
          priority: projectToEdit.priority || 'medium' as 'low' | 'medium' | 'high' | 'urgent',
          street_number: '',
          street_name: '',
          suburb: '',
          postcode: '',
          budget: projectToEdit.budget || 100000,
          square_footage: projectToEdit.square_footage?.toString() || '',
          number_of_floors: projectToEdit.number_of_floors?.toString() || '',
          estimated_start_date: projectToEdit.estimated_start_date ? new Date(projectToEdit.estimated_start_date) : undefined,
          estimated_finish_date: projectToEdit.estimated_finish_date ? new Date(projectToEdit.estimated_finish_date) : undefined,
          architectural_fees: projectToEdit.architectural_fees || undefined,
          homeowners: projectToEdit.homeowner_name ? [{
            name: projectToEdit.homeowner_name,
            email: projectToEdit.homeowner_email || '',
            phone: projectToEdit.homeowner_phone || ''
          }] : []
        });
      } else {
        // Create mode - reset to default values
        setFormData({
          project_reference_number: '',
          name: '',
          description: '',
          project_category: 'new_construction',
          project_type: '',
          priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
          street_number: '',
          street_name: '',
          suburb: '',
          postcode: '',
          budget: 100000,
          square_footage: '',
          number_of_floors: '',
          estimated_start_date: undefined,
          estimated_finish_date: undefined,
          architectural_fees: undefined,
          homeowners: []
        });
      }
      setCurrentStep(1);
    }
  }, [open, projectToEdit]);
  const [newHomeowner, setNewHomeowner] = useState<HomeownerData>({
    name: '',
    email: '',
    phone: ''
  });
  const [newCollaborator, setNewCollaborator] = useState<CollaboratorData>({
    email: '',
    name: '',
    role: 'contractor',
    permissions: {
      can_edit_project: false,
      can_manage_team: false,
      can_view_budget: true,
      can_edit_budget: false,
      can_approve_changes: false,
      can_view_documents: true,
      can_upload_documents: false
    }
  });

  // Parse existing address into structured fields when editing
  useEffect(() => {
    if (projectToEdit?.address && open) {
      const addressParts = projectToEdit.address.split(',');
      if (addressParts.length >= 2) {
        const streetParts = addressParts[0].trim().split(' ');
        const streetNumber = streetParts[0] || '';
        const streetName = streetParts.slice(1).join(' ') || '';
        const locationParts = addressParts[1].trim().split(' ');
        const suburb = locationParts.slice(0, -1).join(' ') || '';
        const postcode = locationParts[locationParts.length - 1] || '';
        setFormData(prev => ({
          ...prev,
          street_number: streetNumber,
          street_name: streetName,
          suburb: suburb,
          postcode: postcode
        }));
      }
    }
  }, [projectToEdit?.address, open]);
  const totalSteps = isArchitect ? 4 : 3;
  const progressPercentage = currentStep / totalSteps * 100;
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  const handleBudgetChange = (value: number[]) => {
    handleInputChange('budget', value[0]);
  };
  const handleBudgetInputChange = (value: string) => {
    // Allow only numeric characters and decimal point
    const sanitized = value.replace(/[^0-9.]/g, '');
    const num = parseFloat(sanitized);
    if (!isNaN(num) && num > 0) {
      // Keep in sync with slider range
      const clamped = Math.max(50000, Math.min(num, 5000000));
      handleInputChange('budget', clamped);
    }
  };
  const startEditingBudget = () => {
    setBudgetInput(formData.budget?.toString() || '');
    setEditingBudget(true);
  };
  const saveBudgetEdit = () => {
    const num = parseFloat(budgetInput.replace(/[^0-9.]/g, ''));
    if (!isNaN(num) && num >= 50000 && num <= 5000000) {
      handleInputChange('budget', num);
    }
    setEditingBudget(false);
  };
  const cancelBudgetEdit = () => {
    setEditingBudget(false);
    setBudgetInput('');
  };
  const formatBudgetLabel = (value: number) => {
    if (value < 100000) return "Under $100K";
    if (value >= 5000000) return "$5M+";
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    return `$${(value / 1000).toFixed(0)}K`;
  };
  const setProjectDuration = (months: number) => {
    if (formData.estimated_start_date) {
      let finishDate: Date;
      if (months < 1) {
        // Handle weeks
        const weeks = months * 4; // Convert months to weeks
        finishDate = new Date(formData.estimated_start_date);
        finishDate.setDate(finishDate.getDate() + weeks * 7);
      } else {
        // Handle months
        finishDate = addMonths(formData.estimated_start_date, months);
      }
      handleInputChange('estimated_finish_date', finishDate);
    }
  };
  const addHomeowner = () => {
    if (newHomeowner.name.trim()) {
      setFormData(prev => ({
        ...prev,
        homeowners: [...prev.homeowners, newHomeowner]
      }));
      setNewHomeowner({
        name: '',
        email: '',
        phone: ''
      });
    }
  };
  const removeHomeowner = (index: number) => {
    setFormData(prev => ({
      ...prev,
      homeowners: prev.homeowners.filter((_, i) => i !== index)
    }));
  };
  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return formData.name.trim() !== '';
      case 2:
        return formData.estimated_start_date && formData.estimated_finish_date;
      case 3:
        // For architects: Architectural fees step (no mandatory validation)
        // For non-architects: Client information step (no mandatory fields)
        return true;
      case 4:
        // Client information step for architects (no mandatory fields)
        return true;
      default:
        return true;
    }
  };
  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      const projectData = {
        name: formData.name,
        project_reference_number: formData.project_reference_number || undefined,
        description: formData.description || undefined,
        project_type: formData.project_type as any,
        priority: formData.priority,
        address: `${formData.street_number} ${formData.street_name}, ${formData.suburb} ${formData.postcode}`.trim() || undefined,
        budget: formData.budget,
        square_footage: formData.square_footage ? parseInt(formData.square_footage) : undefined,
        number_of_floors: formData.number_of_floors ? parseInt(formData.number_of_floors) : undefined,
        estimated_start_date: formData.estimated_start_date?.toISOString().split('T')[0],
        estimated_finish_date: formData.estimated_finish_date?.toISOString().split('T')[0],
        homeowner_name: formData.homeowners.length > 0 ? formData.homeowners[0].name : undefined,
        homeowner_email: formData.homeowners.length > 0 ? formData.homeowners[0].email : undefined,
        homeowner_phone: formData.homeowners.length > 0 ? formData.homeowners[0].phone : undefined,
        architectural_fees: isArchitect ? formData.architectural_fees : undefined,
        additional_homeowners: formData.homeowners.length > 1 ? formData.homeowners.slice(1) : undefined
      };
      if (projectToEdit) {
        await updateProject(projectToEdit.id, projectData);
      } else {
        await createProject(projectData);
      }

      // Reset form
      setFormData({
        project_reference_number: '',
        name: '',
        description: '',
        project_category: 'new_construction',
        project_type: 'detached_home',
        priority: 'medium',
        street_number: '',
        street_name: '',
        suburb: '',
        postcode: '',
        budget: 100000,
        square_footage: '',
        number_of_floors: '',
        estimated_start_date: undefined,
        estimated_finish_date: undefined,
        architectural_fees: undefined,
        homeowners: []
      });
      setCurrentStep(1);
      onOpenChange(false);
    } catch (error) {
      // Error handled in hook
    } finally {
      setLoading(false);
    }
  };
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Project Information</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="project_reference_number">Project Reference</Label>
                  <Input id="project_reference_number" value={formData.project_reference_number} onChange={e => handleInputChange('project_reference_number', e.target.value)} placeholder="e.g. PRJ-2024-001, BUILD-A, Site#123 (optional)" className="mt-1" />
                </div>

                <div>
                  <Label htmlFor="name">Project Name *</Label>
                  <Input id="name" value={formData.name} onChange={e => handleInputChange('name', e.target.value)} placeholder="Enter project name" className="mt-1" />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={formData.description} onChange={e => handleInputChange('description', e.target.value)} placeholder="Enter project description" rows={3} className="mt-1" />
                </div>

                <div>
                  <Label htmlFor="project_type">Project Type</Label>
                  <Select value={formData.project_type} onValueChange={value => handleInputChange('project_type', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Choose project type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new_build">New Build</SelectItem>
                      <SelectItem value="alterations_addition">Alterations & Addition</SelectItem>
                      <SelectItem value="renovation">Renovation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <h4 className="text-md font-medium">Project Address</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="street_number">Street Number</Label>
                      <Input id="street_number" value={formData.street_number} onChange={e => handleInputChange('street_number', e.target.value)} placeholder="123" className="mt-1" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="street_name">Street Name</Label>
                      <Input id="street_name" value={formData.street_name} onChange={e => handleInputChange('street_name', e.target.value)} placeholder="Main Street" className="mt-1" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="suburb">Suburb</Label>
                      <Input id="suburb" value={formData.suburb} onChange={e => handleInputChange('suburb', e.target.value)} placeholder="Sydney" className="mt-1" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="postcode">Postcode</Label>
                      <Input id="postcode" value={formData.postcode} onChange={e => handleInputChange('postcode', e.target.value)} placeholder="2000" className="mt-1" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>;
      case 2:
        return <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Project Details & Timeline</h3>
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="budget">Project Budget</Label>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      {editingBudget ? <div className="flex items-center gap-2 flex-1">
                          <span className="text-xl font-bold">$</span>
                          <Input type="text" inputMode="numeric" value={budgetInput} onChange={e => setBudgetInput(e.target.value)} onKeyDown={e => {
                        if (e.key === 'Enter') saveBudgetEdit();
                        if (e.key === 'Escape') cancelBudgetEdit();
                      }} onBlur={saveBudgetEdit} className="text-xl font-bold w-48" autoFocus placeholder="Enter amount" />
                          <Button size="sm" variant="ghost" onClick={saveBudgetEdit}>✓</Button>
                          <Button size="sm" variant="ghost" onClick={cancelBudgetEdit}>✕</Button>
                        </div> : <div className="text-xl font-bold cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors" onClick={startEditingBudget} title="Click to edit exact amount">
                          ${formData.budget?.toLocaleString()}
                        </div>}
                      <div className="text-sm text-muted-foreground">{formatBudgetLabel(formData.budget || 100000)}</div>
                    </div>
                    
                    <Slider value={[formData.budget || 100000]} onValueChange={handleBudgetChange} max={5000000} min={50000} step={25000} className="w-full" />
                    
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Under $100K</span>
                      <span>$5M+</span>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">Use the slider or click the amount above to set an exact budget.</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="square_footage">Square Metres</Label>
                    <Input id="square_footage" type="number" value={formData.square_footage} onChange={e => handleInputChange('square_footage', e.target.value)} placeholder="Sq Metres" className="mt-1" />
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Date Selection Section */}
              <div className="space-y-6">
                <h4 className="text-md font-medium">Project Timeline</h4>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Start Date */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Start Date *</Label>
                    <Input type="date" value={formData.estimated_start_date ? format(formData.estimated_start_date, 'yyyy-MM-dd') : ''} onChange={e => {
                    const date = e.target.value ? new Date(e.target.value) : undefined;
                    handleInputChange('estimated_start_date', date);
                  }} className="h-11" placeholder="YYYY-MM-DD" />
                  </div>

                  {/* Estimated Finish Date */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Estimated Finish Date *</Label>
                    <Input type="date" value={formData.estimated_finish_date ? format(formData.estimated_finish_date, 'yyyy-MM-dd') : ''} onChange={e => {
                    const date = e.target.value ? new Date(e.target.value) : undefined;
                    handleInputChange('estimated_finish_date', date);
                  }} className="h-11" placeholder="YYYY-MM-DD" />
                  </div>
                </div>

              </div>
            </div>
          </div>;
      case 3:
        if (!isArchitect) {
          // For non-architects, this is the client information step
          return renderClientInformationStep();
        }

        // Architectural Fees Step for Architects
        return <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Architectural Fees</h3>
              <p className="text-muted-foreground mb-6">Set your professional fees for this project.</p>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="architectural_fees">Architectural Fees</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-3 text-muted-foreground">$</span>
                    <Input id="architectural_fees" type="number" min="0" step="0.01" value={formData.architectural_fees || ''} onChange={e => handleInputChange('architectural_fees', e.target.value ? parseFloat(e.target.value) : undefined)} placeholder="0.00" className="pl-8" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1"> This information is private and only visible to you.</p>
                </div>
                
                <Card className="bg-muted/30 border-dashed">
                  
                </Card>
              </div>
            </div>
          </div>;
      case 4:
        // Client Information Step for Architects (step 4)
        return renderClientInformationStep();
      default:
        return null;
    }
  };
  const renderClientInformationStep = () => {
    return <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Client Information</h3>
          
          {/* Existing Homeowners */}
          {formData.homeowners.length > 0 && <div className="space-y-4 mb-6">
              <Label className="text-sm font-medium">Homeowners/Clients</Label>
              {formData.homeowners.map((homeowner, index) => <Card key={index} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                      <div>
                        <Label className="text-xs text-muted-foreground">Name</Label>
                        <p className="font-medium">{homeowner.name}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Phone</Label>
                        <p className="text-sm">{homeowner.phone || 'Not provided'}</p>
                      </div>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeHomeowner(index)} className="text-red-600 hover:text-red-700 ml-2">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>)}
            </div>}

          {/* Add New Homeowner */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" />
                {formData.homeowners.length === 0 ? 'Add Client' : 'Add Another Client'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="new_homeowner_name">Name</Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="new_homeowner_name" value={newHomeowner.name} onChange={e => setNewHomeowner(prev => ({
                  ...prev,
                  name: e.target.value
                }))} placeholder="Enter client name" className="pl-10" />
                </div>
              </div>
              
              <div>
                <Label htmlFor="new_homeowner_phone">Phone Number (Optional)</Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="new_homeowner_phone" type="tel" value={newHomeowner.phone} onChange={e => setNewHomeowner(prev => ({
                  ...prev,
                  phone: e.target.value
                }))} placeholder="Enter phone number" className="pl-10" />
                </div>
              </div>

              <Button type="button" onClick={addHomeowner} disabled={!newHomeowner.name.trim()} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>;
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {projectToEdit ? 'Edit Project' : 'Create New Project'}
          </DialogTitle>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(progressPercentage)}% Complete
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Step Content */}
        <div className="mb-6">
          {renderStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button type="button" variant="outline" onClick={prevStep} disabled={currentStep === 1}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {Array.from({
            length: totalSteps
          }, (_, i) => <div key={i} className={cn("w-2 h-2 rounded-full", i + 1 <= currentStep ? "bg-primary" : "bg-muted")} />)}
          </div>

          {currentStep < totalSteps ? <Button type="button" onClick={nextStep} disabled={!validateCurrentStep()}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button> : <Button type="button" onClick={handleSubmit} disabled={loading || !validateCurrentStep()}>
              {loading ? <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  {projectToEdit ? 'Updating...' : 'Creating...'}
                </> : <>
                  <Check className="h-4 w-4 mr-2" />
                  {projectToEdit ? 'Update Project' : 'Create Project'}
                </>}
            </Button>}
        </div>
      </DialogContent>
    </Dialog>;
};
export default AdvancedProjectWizard;