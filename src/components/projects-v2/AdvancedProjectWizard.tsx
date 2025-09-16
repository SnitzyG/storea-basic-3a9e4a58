import React, { useState } from 'react';
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
const PROJECT_TYPES = [{
  value: 'residential_new',
  label: 'Residential New Build',
  icon: Home
}, {
  value: 'residential_renovation',
  label: 'Home Renovation',
  icon: Home
}, {
  value: 'commercial_new',
  label: 'Commercial New Build',
  icon: Building2
}, {
  value: 'commercial_renovation',
  label: 'Commercial Renovation',
  icon: Building2
}, {
  value: 'industrial',
  label: 'Industrial Project',
  icon: Factory
}, {
  value: 'infrastructure',
  label: 'Infrastructure',
  icon: Building2
}];
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
    toast
  } = useToast();
  const [formData, setFormData] = useState({
    // Step 1: Basic Information
    name: projectToEdit?.name || '',
    description: projectToEdit?.description || '',
    project_type: projectToEdit?.project_type || 'residential_new',
    priority: projectToEdit?.priority || 'medium',
    address: projectToEdit?.address || '',
    // Step 2: Project Details
    budget: projectToEdit?.budget?.toString() || '',
    square_footage: projectToEdit?.square_footage?.toString() || '',
    number_of_floors: projectToEdit?.number_of_floors?.toString() || '',
    estimated_start_date: projectToEdit?.estimated_start_date ? new Date(projectToEdit.estimated_start_date) : undefined as Date | undefined,
    estimated_finish_date: projectToEdit?.estimated_finish_date ? new Date(projectToEdit.estimated_finish_date) : undefined as Date | undefined,
    permit_status: projectToEdit?.permit_status || 'not_required',
    // Step 3: Client Information
    homeowner_name: projectToEdit?.homeowner_name || '',
    homeowner_email: projectToEdit?.homeowner_email || '',
    homeowner_phone: projectToEdit?.homeowner_phone || '',
    // Step 4: Team & Collaborators
    collaborators: [] as CollaboratorData[],
    // Step 5: Additional Settings
    tags: projectToEdit?.tags || [],
    weather_delays: projectToEdit?.weather_delays?.toString() || '0',
    custom_fields: projectToEdit?.custom_fields || {}
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
  const [newTag, setNewTag] = useState('');
  const totalSteps = 4;
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
  const addCollaborator = () => {
    if (newCollaborator.email && newCollaborator.name) {
      setFormData(prev => ({
        ...prev,
        collaborators: [...prev.collaborators, newCollaborator]
      }));
      setNewCollaborator({
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
    }
  };
  const removeCollaborator = (index: number) => {
    setFormData(prev => ({
      ...prev,
      collaborators: prev.collaborators.filter((_, i) => i !== index)
    }));
  };
  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };
  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
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
        return formData.homeowner_name.trim() !== '' && formData.homeowner_email.trim() !== '';
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
        description: formData.description || undefined,
        project_type: formData.project_type,
        priority: formData.priority,
        address: formData.address || undefined,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        square_footage: formData.square_footage ? parseInt(formData.square_footage) : undefined,
        number_of_floors: formData.number_of_floors ? parseInt(formData.number_of_floors) : undefined,
        estimated_start_date: formData.estimated_start_date?.toISOString().split('T')[0],
        estimated_finish_date: formData.estimated_finish_date?.toISOString().split('T')[0],
        permit_status: formData.permit_status,
        homeowner_name: formData.homeowner_name || undefined,
        homeowner_email: formData.homeowner_email || undefined,
        homeowner_phone: formData.homeowner_phone || undefined,
        weather_delays: formData.weather_delays ? parseInt(formData.weather_delays) : undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        custom_fields: Object.keys(formData.custom_fields).length > 0 ? formData.custom_fields : undefined,
        collaborators: formData.collaborators
      };
      if (projectToEdit) {
        await updateProject(projectToEdit.id, projectData);
      } else {
        await createProject(projectData);
      }

      // Reset form
      setFormData({
        name: '',
        description: '',
        project_type: 'residential_new',
        priority: 'medium',
        address: '',
        budget: '',
        square_footage: '',
        number_of_floors: '',
        estimated_start_date: undefined,
        estimated_finish_date: undefined,
        permit_status: 'not_required',
        homeowner_name: '',
        homeowner_email: '',
        homeowner_phone: '',
        collaborators: [],
        tags: [],
        weather_delays: '0',
        custom_fields: {}
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
                  <Label htmlFor="name">Project Name *</Label>
                  <Input id="name" value={formData.name} onChange={e => handleInputChange('name', e.target.value)} placeholder="Enter project name" className="mt-1" />
                </div>

                <div>
                  <Label htmlFor="description">Project Description</Label>
                  <Textarea id="description" value={formData.description} onChange={e => handleInputChange('description', e.target.value)} placeholder="Describe your project" rows={3} className="mt-1" />
                </div>

                <div>
                  <Label>Project Type</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {PROJECT_TYPES.map(type => {
                    const Icon = type.icon;
                    return <Card key={type.value} className={cn("cursor-pointer transition-all hover:shadow-md", formData.project_type === type.value ? "border-primary bg-primary/5" : "")} onClick={() => handleInputChange('project_type', type.value)}>
                          <CardContent className="p-4 flex items-center space-x-3">
                            <Icon className="h-5 w-5 text-primary" />
                            <span className="text-sm font-medium">{type.label}</span>
                          </CardContent>
                        </Card>;
                  })}
                  </div>
                </div>

                

                <div>
                  <Label htmlFor="address">Project Address</Label>
                  <div className="relative mt-1">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="address" value={formData.address} onChange={e => handleInputChange('address', e.target.value)} placeholder="Enter project address" className="pl-10" />
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
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="budget" type="number" step="0.01" value={formData.budget} onChange={e => handleInputChange('budget', e.target.value)} placeholder="Enter budget amount" className="pl-10" />
                  </div>
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
                      <Label>Finish Date *</Label>
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
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formData.estimated_start_date 
                        ? "Select a duration to automatically set the finish date" 
                        : "Please select a start date first"
                      }
                    </p>
                  </div>
                </div>

                
              </div>
            </div>
          </div>;
      case 3:
        return <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Client Information</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="homeowner_name">Client/Homeowner Name *</Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="homeowner_name" value={formData.homeowner_name} onChange={e => handleInputChange('homeowner_name', e.target.value)} placeholder="Enter client name" className="pl-10" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="homeowner_email">Email Address *</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="homeowner_email" type="email" value={formData.homeowner_email} onChange={e => handleInputChange('homeowner_email', e.target.value)} placeholder="Enter email address" className="pl-10" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="homeowner_phone">Phone Number</Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="homeowner_phone" type="tel" value={formData.homeowner_phone} onChange={e => handleInputChange('homeowner_phone', e.target.value)} placeholder="Enter phone number" className="pl-10" />
                  </div>
                </div>
              </div>
            </div>
          </div>;
      case 4:
        return <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Team & Collaborators</h3>
              
              {/* Add New Collaborator */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-4 w-4" />
                    Add Team Member
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="collaborator_email">Email</Label>
                      <Input id="collaborator_email" type="email" value={newCollaborator.email} onChange={e => setNewCollaborator(prev => ({
                      ...prev,
                      email: e.target.value
                    }))} placeholder="Enter email" className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="collaborator_name">Name</Label>
                      <Input id="collaborator_name" value={newCollaborator.name} onChange={e => setNewCollaborator(prev => ({
                      ...prev,
                      name: e.target.value
                    }))} placeholder="Enter name" className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="collaborator_role">Role</Label>
                      <Select value={newCollaborator.role} onValueChange={(value: ProjectUser['role']) => setNewCollaborator(prev => ({
                      ...prev,
                      role: value
                    }))}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map(role => <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button type="button" variant="outline" onClick={addCollaborator} disabled={!newCollaborator.email || !newCollaborator.name} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Team Member
                  </Button>
                </CardContent>
              </Card>

              {/* Existing Collaborators */}
              {formData.collaborators.length > 0 && <div>
                  <Label className="text-base font-medium">Team Members ({formData.collaborators.length})</Label>
                  <div className="space-y-3 mt-3">
                    {formData.collaborators.map((collaborator, index) => <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarFallback>
                                  {collaborator.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{collaborator.name}</div>
                                <div className="text-sm text-muted-foreground">{collaborator.email}</div>
                                <Badge variant="secondary" className="text-xs mt-1">
                                  {ROLES.find(r => r.value === collaborator.role)?.label}
                                </Badge>
                              </div>
                            </div>
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeCollaborator(index)} className="text-destructive hover:text-destructive">
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>)}
                  </div>
                </div>}
            </div>
          </div>;
      case 5:
        return <div className="space-y-6">
            <div>
              
              
              <div className="space-y-4">
                <div>
                  <Label>Project Tags</Label>
                  <div className="flex gap-2 mt-1">
                    <Input value={newTag} onChange={e => setNewTag(e.target.value)} placeholder="Add a tag" onKeyPress={e => e.key === 'Enter' && addTag()} />
                    <Button type="button" variant="outline" onClick={addTag}>
                      Add
                    </Button>
                  </div>
                  {formData.tags.length > 0 && <div className="flex flex-wrap gap-2 mt-3">
                      {formData.tags.map((tag, index) => <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                        </Badge>)}
                    </div>}
                </div>

                

                {/* Project Summary */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Project Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Project Name:</span>
                      <span className="font-medium">{formData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="font-medium">
                        {PROJECT_TYPES.find(t => t.value === formData.project_type)?.label}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Client:</span>
                      <span className="font-medium">{formData.homeowner_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Budget:</span>
                      <span className="font-medium">
                        {formData.budget ? `$${parseFloat(formData.budget).toLocaleString()}` : 'Not specified'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Team Members:</span>
                      <span className="font-medium">{formData.collaborators.length}</span>
                    </div>
                    {formData.estimated_start_date && formData.estimated_finish_date && <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="font-medium">
                          {Math.ceil((formData.estimated_finish_date.getTime() - formData.estimated_start_date.getTime()) / (1000 * 60 * 60 * 24))} days
                        </span>
                      </div>}
                  </CardContent>
                </Card>
              </div>
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