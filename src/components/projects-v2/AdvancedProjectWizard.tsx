import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

  // Parse existing address into structured fields when editing
  useEffect(() => {
    if (projectToEdit?.address) {
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
  }, [projectToEdit?.address]);
  const {
    createProject,
    updateProject
  } = useAdvancedProjects();
  const {
    toast
  } = useToast();
  const [formData, setFormData] = useState({
    // Step 1: Basic Information
    project_reference_number: projectToEdit?.project_reference_number || '',
    name: projectToEdit?.name || '',
    description: projectToEdit?.description || '',
    project_category: projectToEdit?.project_type || 'new_construction',
    project_type: projectToEdit?.project_type || 'detached_home',
    priority: projectToEdit?.priority || 'medium',
    street_number: '',
    street_name: '',
    suburb: '',
    postcode: '',
    // Step 2: Project Details
    budget: projectToEdit?.budget?.toString() || '',
    square_footage: projectToEdit?.square_footage?.toString() || '',
    number_of_floors: projectToEdit?.number_of_floors?.toString() || '',
    estimated_start_date: projectToEdit?.estimated_start_date ? new Date(projectToEdit.estimated_start_date) : undefined as Date | undefined,
    estimated_finish_date: projectToEdit?.estimated_finish_date ? new Date(projectToEdit.estimated_finish_date) : undefined as Date | undefined,
    // Step 3: Client Information
    homeowners: projectToEdit?.homeowner_name ? [{
      name: projectToEdit.homeowner_name,
      email: projectToEdit.homeowner_email || '',
      phone: projectToEdit.homeowner_phone || ''
    }] : [] as HomeownerData[],
  });
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
  const totalSteps = 3;
  const progressPercentage = currentStep / totalSteps * 100;
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const setProjectDuration = (months: number) => {
    if (formData.estimated_start_date) {
      const finishDate = addMonths(formData.estimated_start_date, months);
      handleInputChange('estimated_finish_date', finishDate);
    }
  };

  const addHomeowner = () => {
    if (newHomeowner.name.trim() && newHomeowner.email.trim()) {
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
  
  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };
  const removeHomeowner = (index: number) => {
    setFormData(prev => ({
      ...prev,
      homeowners: prev.homeowners.filter((_, i) => i !== index)
    }));
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
        return true; // No mandatory fields for homeowners
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
        budget: formData.budget ? convertBudgetStringToNumber(formData.budget) : undefined,
        square_footage: formData.square_footage ? parseInt(formData.square_footage) : undefined,
        number_of_floors: formData.number_of_floors ? parseInt(formData.number_of_floors) : undefined,
        estimated_start_date: formData.estimated_start_date?.toISOString().split('T')[0],
        estimated_finish_date: formData.estimated_finish_date?.toISOString().split('T')[0],
        homeowner_name: formData.homeowners.length > 0 ? formData.homeowners[0].name : undefined,
        homeowner_email: formData.homeowners.length > 0 ? formData.homeowners[0].email : undefined,
        homeowner_phone: formData.homeowners.length > 0 ? formData.homeowners[0].phone : undefined,
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
        budget: '',
        square_footage: '',
        number_of_floors: '',
        estimated_start_date: undefined,
        estimated_finish_date: undefined,
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
              <h3 className="text-lg font-semibold mb-4">Basic Project Information</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="project_reference_number">Project Reference</Label>
                  <Input 
                    id="project_reference_number" 
                    value={formData.project_reference_number} 
                    onChange={e => handleInputChange('project_reference_number', e.target.value)} 
                    placeholder="e.g. PRJ-2024-001, BUILD-A, Site#123 (optional)" 
                    className="mt-1" 
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Your internal reference code (numbers, letters, symbols)
                  </p>
                </div>

                <div>
                  <Label htmlFor="name">Project Name *</Label>
                  <Input id="name" value={formData.name} onChange={e => handleInputChange('name', e.target.value)} placeholder="Enter project name" className="mt-1" />
                </div>


                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    value={formData.description} 
                    onChange={e => handleInputChange('description', e.target.value)} 
                    placeholder="Enter project description..." 
                    rows={3} 
                    className="mt-1" 
                  />
                </div>

                <div>
                  <Label htmlFor="project_type">Project Type</Label>
                  <Select value={formData.project_type} onValueChange={(value) => handleInputChange('project_type', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select project type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="detached_home">Detached Home</SelectItem>
                      <SelectItem value="duplex">Duplex</SelectItem>
                      <SelectItem value="townhouse">Townhouse</SelectItem>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="villa">Villa</SelectItem>
                      <SelectItem value="renovation">Renovation</SelectItem>
                      <SelectItem value="extension">Extension</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                

                <div className="space-y-4">
                  <h4 className="text-md font-medium">Project Address</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="street_number">Street Number</Label>
                      <Input
                        id="street_number"
                        value={formData.street_number}
                        onChange={(e) => handleInputChange('street_number', e.target.value)}
                        placeholder="123"
                        className="mt-1"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="street_name">Street Name</Label>
                      <Input
                        id="street_name"
                        value={formData.street_name}
                        onChange={(e) => handleInputChange('street_name', e.target.value)}
                        placeholder="Main Street"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="suburb">Suburb</Label>
                      <Input
                        id="suburb"
                        value={formData.suburb}
                        onChange={(e) => handleInputChange('suburb', e.target.value)}
                        placeholder="Sydney"
                        className="mt-1"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="postcode">Postcode</Label>
                      <Input
                        id="postcode"
                        value={formData.postcode}
                        onChange={(e) => handleInputChange('postcode', e.target.value)}
                        placeholder="2000"
                        className="mt-1"
                      />
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
                <div>
                  <Label htmlFor="budget">Project Budget</Label>
                  <Select value={formData.budget} onValueChange={(value) => handleInputChange('budget', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select budget range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="< $100,000">&lt; $100,000</SelectItem>
                      <SelectItem value="$100,000 – $200,000">$100,000 – $200,000</SelectItem>
                      <SelectItem value="$200,000 – $300,000">$200,000 – $300,000</SelectItem>
                      <SelectItem value="$300,000 – $400,000">$300,000 – $400,000</SelectItem>
                      <SelectItem value="$400,000 – $500,000">$400,000 – $500,000</SelectItem>
                      <SelectItem value="$500,000 – $750,000">$500,000 – $750,000</SelectItem>
                      <SelectItem value="$750,000 – $1,000,000">$750,000 – $1,000,000</SelectItem>
                      <SelectItem value="$1,000,000 – $1,500,000">$1,000,000 – $1,500,000</SelectItem>
                      <SelectItem value="$1,500,000 – $2,000,000">$1,500,000 – $2,000,000</SelectItem>
                      <SelectItem value="$2,000,000 – $2,500,000">$2,000,000 – $2,500,000</SelectItem>
                      <SelectItem value="$2,500,000+">$2,500,000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="square_footage">Square Metres </Label>
                    <Input id="square_footage" type="number" value={formData.square_footage} onChange={e => handleInputChange('square_footage', e.target.value)} placeholder="Sq Metres" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="number_of_floors">Number of Floors</Label>
                    <Input id="number_of_floors" type="number" value={formData.number_of_floors} onChange={e => handleInputChange('number_of_floors', e.target.value)} placeholder="Floors" className="mt-1" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Start Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.estimated_start_date && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.estimated_start_date ? format(formData.estimated_start_date, "PPP") : <span>Pick start date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar 
                            mode="single" 
                            selected={formData.estimated_start_date} 
                            onSelect={date => handleInputChange('estimated_start_date', date)} 
                            initialFocus 
                            className="pointer-events-auto" 
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>Estimated Finish Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.estimated_finish_date && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.estimated_finish_date ? format(formData.estimated_finish_date, "PPP") : <span>Pick finish date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar 
                            mode="single" 
                            selected={formData.estimated_finish_date} 
                            onSelect={date => handleInputChange('estimated_finish_date', date)} 
                            disabled={date => formData.estimated_start_date ? date < formData.estimated_start_date : false} 
                            initialFocus 
                            className="pointer-events-auto" 
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Quick Duration Buttons */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Quick Duration Setup</Label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline" 
                        size="sm"
                        onClick={() => setProjectDuration(2)}
                        disabled={!formData.estimated_start_date}
                        className="flex items-center gap-1"
                      >
                        <Clock className="h-3 w-3" />
                        2 Months
                      </Button>
                      <Button
                        type="button"
                        variant="outline" 
                        size="sm"
                        onClick={() => setProjectDuration(2)}
                        disabled={!formData.estimated_start_date}
                        className="flex items-center gap-1"
                      >
                        <Clock className="h-3 w-3" />
                        2 Months
                      </Button>
                      <Button
                        type="button"
                        variant="outline" 
                        size="sm"
                        onClick={() => setProjectDuration(3)}
                        disabled={!formData.estimated_start_date}
                        className="flex items-center gap-1"
                      >
                        <Clock className="h-3 w-3" />
                        3 Months
                      </Button>
                      <Button
                        type="button"
                        variant="outline" 
                        size="sm"
                        onClick={() => setProjectDuration(6)}
                        disabled={!formData.estimated_start_date}
                        className="flex items-center gap-1"
                      >
                        <Clock className="h-3 w-3" />
                        6 Months
                      </Button>
                      <Button
                        type="button"
                        variant="outline" 
                        size="sm"
                        onClick={() => setProjectDuration(12)}
                        disabled={!formData.estimated_start_date}
                        className="flex items-center gap-1"
                      >
                        <Clock className="h-3 w-3" />
                        12 Months
                      </Button>
                      <Button
                        type="button"
                        variant="outline" 
                        size="sm"
                        onClick={() => setProjectDuration(18)}
                        disabled={!formData.estimated_start_date}
                        className="flex items-center gap-1"
                      >
                        <Clock className="h-3 w-3" />
                        18 Months
                      </Button>
                      <Button
                        type="button"
                        variant="outline" 
                        size="sm"
                        onClick={() => setProjectDuration(24)}
                        disabled={!formData.estimated_start_date}
                        className="flex items-center gap-1"
                      >
                        <Clock className="h-3 w-3" />
                        24 Months
                      </Button>
                    </div>
                  </div>
                </div>

                
              </div>
            </div>
          </div>;
      case 3:
        return <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Client Information</h3>
              
              {/* Existing Homeowners */}
              {formData.homeowners.length > 0 && (
                <div className="space-y-4 mb-6">
                  <Label className="text-sm font-medium">Homeowners/Clients</Label>
                  {formData.homeowners.map((homeowner, index) => (
                    <Card key={index} className="p-4">
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
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeHomeowner(index)}
                          className="text-red-600 hover:text-red-700 ml-2"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Add New Homeowner */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="h-4 w-4" />
                    {formData.homeowners.length === 0 ? 'Add Homeowner/Client' : 'Add Another Homeowner'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="new_homeowner_name">Name</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="new_homeowner_name" 
                        value={newHomeowner.name} 
                        onChange={e => setNewHomeowner(prev => ({ ...prev, name: e.target.value }))} 
                        placeholder="Enter client name" 
                        className="pl-10" 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="new_homeowner_phone">Phone Number (Optional)</Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="new_homeowner_phone" 
                        type="tel" 
                        value={newHomeowner.phone} 
                        onChange={e => setNewHomeowner(prev => ({ ...prev, phone: e.target.value }))} 
                        placeholder="Enter phone number" 
                        className="pl-10" 
                      />
                    </div>
                  </div>

                  <Button 
                    type="button"
                    onClick={addHomeowner}
                    disabled={!newHomeowner.name.trim()}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Homeowner
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>;
      default:
        return null;
    }
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
