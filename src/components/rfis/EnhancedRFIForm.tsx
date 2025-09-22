import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, Save, Send, AlertCircle, CheckCircle, Clock, Users, FileText, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useRFIs } from '@/hooks/useRFIs';
import { useProjectTeam } from '@/hooks/useProjectTeam';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Enhanced validation schema with conditional rules
const rfiFormSchema = z.object({
  // Basic Information
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(100, 'Subject too long'),
  question: z.string().min(10, 'Question must be at least 10 characters').max(2000, 'Question too long'),
  category: z.string().min(1, 'Category is required'),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  
  // Recipient Information
  assigned_to: z.string().optional(),
  recipient_name: z.string().optional(),
  recipient_email: z.string().email('Invalid email').optional().or(z.literal('')),
  
  // Response Requirements
  response_required: z.boolean(),
  required_response_by: z.date().optional(),
  
  // Technical Details
  drawing_no: z.string().optional(),
  specification_section: z.string().optional(),
  contract_clause: z.string().optional(),
  proposed_solution: z.string().optional(),
  
  // Project Information
  project_name: z.string().optional(),
  project_number: z.string().optional(),
}).refine(
  (data) => {
    // If response is required, date must be provided
    if (data.response_required && !data.required_response_by) {
      return false;
    }
    return true;
  },
  {
    message: "Response date is required when response is needed",
    path: ["required_response_by"],
  }
);

type RFIFormData = z.infer<typeof rfiFormSchema>;

interface EnhancedRFIFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  editingRFI?: any;
}

export const EnhancedRFIForm: React.FC<EnhancedRFIFormProps> = ({
  open,
  onOpenChange,
  projectId,
  editingRFI
}) => {
  const { createRFI, updateRFI } = useRFIs();
  const { teamMembers } = useProjectTeam(projectId);
  const { projects } = useProjects();
  const { profile, user } = useAuth();
  const { toast } = useToast();
  
  const currentProject = projects.find(p => p.id === projectId);
  const isEditing = !!editingRFI;
  
  // Form state management
  const [currentStep, setCurrentStep] = useState(1);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [formProgress, setFormProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const form = useForm<RFIFormData>({
    resolver: zodResolver(rfiFormSchema),
    defaultValues: {
      priority: 'medium',
      response_required: true,
      category: '',
      subject: '',
      question: '',
    },
    mode: 'onChange' // Real-time validation
  });

  const { control, handleSubmit, watch, formState: { errors, isValid, isDirty }, reset, getValues } = form;
  const watchedValues = watch();

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    if (!isDirty || isAutoSaving) return;
    
    const values = getValues();
    if (!values.subject && !values.question) return;

    setIsAutoSaving(true);
    try {
      // Save as draft to localStorage or backend
      const draftData = {
        ...values,
        projectId,
        lastSaved: new Date().toISOString(),
      };
      
      localStorage.setItem(`rfi_draft_${projectId}`, JSON.stringify(draftData));
      setLastSaved(new Date());
      
      toast({
        title: "Draft saved",
        description: "Your changes have been automatically saved",
        duration: 2000,
      });
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsAutoSaving(false);
    }
  }, [isDirty, isAutoSaving, getValues, projectId, toast]);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(autoSave, 30000);
    return () => clearInterval(interval);
  }, [autoSave]);

  // Load draft on mount
  useEffect(() => {
    if (open && !isEditing) {
      const draftKey = `rfi_draft_${projectId}`;
      const savedDraft = localStorage.getItem(draftKey);
      
      if (savedDraft) {
        try {
          const draftData = JSON.parse(savedDraft);
          if (draftData.subject || draftData.question) {
            // Show option to restore draft
            const shouldRestore = window.confirm('Found a saved draft. Would you like to restore it?');
            if (shouldRestore) {
              reset({
                ...draftData,
                required_response_by: draftData.required_response_by ? new Date(draftData.required_response_by) : undefined,
              });
              setLastSaved(new Date(draftData.lastSaved));
            }
          }
        } catch (error) {
          console.error('Failed to load draft:', error);
        }
      }
    }
  }, [open, isEditing, projectId, reset]);

  // Initialize form with project data
  useEffect(() => {
    if (open && currentProject && profile && user) {
      if (isEditing) {
        // Load editing data
        reset({
          subject: editingRFI.subject || '',
          question: editingRFI.question || '',
          category: editingRFI.category || '',
          priority: editingRFI.priority || 'medium',
          assigned_to: editingRFI.assigned_to || '',
          response_required: !!editingRFI.required_response_by,
          required_response_by: editingRFI.required_response_by ? new Date(editingRFI.required_response_by) : undefined,
          drawing_no: editingRFI.drawing_no || '',
          specification_section: editingRFI.specification_section || '',
          contract_clause: editingRFI.contract_clause || '',
          proposed_solution: editingRFI.proposed_solution || '',
          project_name: editingRFI.project_name || currentProject.name,
          project_number: editingRFI.project_number || currentProject.id,
        });
      } else {
        // Set defaults for new RFI
        form.setValue('project_name', currentProject.name || '');
        form.setValue('project_number', currentProject.id || '');
      }
    }
  }, [open, currentProject, profile, user, isEditing, editingRFI, reset, form]);

  // Calculate form progress
  useEffect(() => {
    const requiredFields = ['subject', 'question', 'category', 'priority'];
    const filledFields = requiredFields.filter(field => {
      const value = watchedValues[field as keyof RFIFormData];
      return value && value !== '';
    });
    
    const conditionalFields = [];
    if (watchedValues.response_required) {
      conditionalFields.push('required_response_by');
    }
    
    const totalRequired = requiredFields.length + conditionalFields.length;
    const totalFilled = filledFields.length + conditionalFields.filter(field => watchedValues[field as keyof RFIFormData]).length;
    
    setFormProgress((totalFilled / totalRequired) * 100);
  }, [watchedValues]);

  // Handle manual save
  const handleSaveDraft = async () => {
    await autoSave();
  };

  // Handle form submission
  const onSubmit = async (data: RFIFormData) => {
    try {
      if (isEditing) {
        await updateRFI(editingRFI.id, {
          subject: data.subject,
          question: data.question,
          category: data.category,
          priority: data.priority,
          assigned_to: data.assigned_to,
          required_response_by: data.required_response_by?.toISOString(),
          drawing_no: data.drawing_no,
          specification_section: data.specification_section,
          contract_clause: data.contract_clause,
          proposed_solution: data.proposed_solution,
        });
        
        toast({
          title: "RFI updated",
          description: "The RFI has been successfully updated",
        });
      } else {
        await createRFI({
          project_id: projectId,
          question: data.question,
          priority: data.priority,
          category: data.category,
          assigned_to: data.assigned_to,
          rfi_type:
            data.category === 'General Correspondence'
              ? 'general_correspondence'
              : data.category === 'General Advice'
              ? 'general_advice'
              : 'request_for_information',
          required_response_by: data.required_response_by?.toISOString(),
          project_name: data.project_name,
          project_number: data.project_number,
          recipient_name: data.recipient_name,
          recipient_email: data.recipient_email,
          sender_name: profile?.name || '',
          sender_email: user?.email || '',
          subject: data.subject,
          drawing_no: data.drawing_no,
          specification_section: data.specification_section,
          contract_clause: data.contract_clause,
          proposed_solution: data.proposed_solution,
        });
        
        toast({
          title: "RFI created",
          description: "The RFI has been successfully created",
        });
        
        // Clear draft
        localStorage.removeItem(`rfi_draft_${projectId}`);
      }
      
      reset();
      setCurrentStep(1);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving RFI:', error);
      toast({
        title: "Error",
        description: "Failed to save RFI. Please try again.",
        variant: "destructive",
      });
    }
  };

  const steps = [
    { id: 1, name: 'Basic Information', icon: FileText },
    { id: 2, name: 'Recipients & Timeline', icon: Users },
    { id: 3, name: 'Technical Details', icon: Settings },
  ];

  const categories = [
    'General', 'Structural', 'Mechanical', 'Electrical', 
    'Plumbing', 'HVAC', 'Fire Safety', 'Code Compliance', 
    'Materials', 'Schedule', 'Other'
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">
              {isEditing ? 'Edit RFI' : 'Create New RFI'}
            </DialogTitle>
            <div className="flex items-center space-x-2">
              {lastSaved && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  Saved {format(lastSaved, 'HH:mm')}
                </Badge>
              )}
              {isAutoSaving && (
                <Badge variant="secondary" className="text-xs">
                  <Save className="h-3 w-3 mr-1 animate-spin" />
                  Saving...
                </Badge>
              )}
            </div>
          </div>
          
          {/* Progress indicator */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Form Progress</span>
              <span className="text-sm font-medium">{Math.round(formProgress)}%</span>
            </div>
            <Progress value={formProgress} className="h-2" />
          </div>
          
          {/* Step navigation */}
          <div className="flex items-center justify-center mt-4 space-x-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => setCurrentStep(step.id)}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors",
                    currentStep === step.id 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <step.icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{step.name}</span>
                </button>
                {index < steps.length - 1 && (
                  <div className="w-8 h-px bg-border mx-4" />
                )}
              </div>
            ))}
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Basic Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Subject with real-time validation */}
                  <div className="space-y-2">
                    <Label htmlFor="subject">
                      Subject <span className="text-destructive">*</span>
                    </Label>
                    <Controller
                      name="subject"
                      control={control}
                      render={({ field }) => (
                        <div className="space-y-1">
                          <Input
                            {...field}
                            placeholder="Brief description of the RFI"
                            className={cn(errors.subject && "border-destructive")}
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{field.value?.length || 0}/100 characters</span>
                            {errors.subject && (
                              <span className="text-destructive flex items-center">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                {errors.subject.message}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label htmlFor="category">
                      Category <span className="text-destructive">*</span>
                    </Label>
                    <Controller
                      name="category"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className={cn(errors.category && "border-destructive")}>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(category => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.category && (
                      <span className="text-xs text-destructive flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.category.message}
                      </span>
                    )}
                  </div>

                  {/* Priority */}
                  <div className="space-y-2">
                    <Label htmlFor="priority">
                      Priority <span className="text-destructive">*</span>
                    </Label>
                    <Controller
                      name="priority"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                <span>Low</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="medium">
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                <span>Medium</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="high">
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 rounded-full bg-orange-500" />
                                <span>High</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="critical">
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                <span>Critical</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {/* Question with character count */}
                  <div className="space-y-2">
                    <Label htmlFor="question">
                      Question/Request <span className="text-destructive">*</span>
                    </Label>
                    <Controller
                      name="question"
                      control={control}
                      render={({ field }) => (
                        <div className="space-y-1">
                          <Textarea
                            {...field}
                            placeholder="Describe your request or question in detail..."
                            className={cn("min-h-[120px]", errors.question && "border-destructive")}
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{field.value?.length || 0}/2000 characters</span>
                            {errors.question && (
                              <span className="text-destructive flex items-center">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                {errors.question.message}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Recipients & Timeline */}
            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Recipients & Timeline</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Assign to team member */}
                  <div className="space-y-2">
                    <Label htmlFor="assigned_to">Assign To</Label>
                    <Controller
                      name="assigned_to"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select team member" />
                          </SelectTrigger>
                          <SelectContent>
                            {teamMembers.map(member => (
                              <SelectItem key={member.user_id} value={member.user_id}>
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 rounded-full bg-green-500" />
                                  <span>{member.user_profile?.name || 'Unknown User'}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {member.user_profile?.role || member.role}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {/* Response required toggle */}
                  <div className="flex items-center space-x-2">
                    <Controller
                      name="response_required"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="rounded border-gray-300"
                        />
                      )}
                    />
                    <Label>Response Required</Label>
                  </div>

                  {/* Required response date (conditional) */}
                  {watchedValues.response_required && (
                    <div className="space-y-2">
                      <Label>
                        Required Response By <span className="text-destructive">*</span>
                      </Label>
                      <Controller
                        name="required_response_by"
                        control={control}
                        render={({ field }) => (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button 
                                variant="outline" 
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !field.value && "text-muted-foreground",
                                  errors.required_response_by && "border-destructive"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar 
                                mode="single" 
                                selected={field.value} 
                                onSelect={field.onChange} 
                                initialFocus 
                                className="p-3"
                                disabled={(date) => date < new Date()}
                              />
                            </PopoverContent>
                          </Popover>
                        )}
                      />
                      {errors.required_response_by && (
                        <span className="text-xs text-destructive flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {errors.required_response_by.message}
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 3: Technical Details */}
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Technical Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="drawing_no">Drawing Number</Label>
                    <Controller
                      name="drawing_no"
                      control={control}
                      render={({ field }) => (
                        <Input {...field} placeholder="e.g., A-001" />
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="specification_section">Specification Section</Label>
                    <Controller
                      name="specification_section"
                      control={control}
                      render={({ field }) => (
                        <Input {...field} placeholder="e.g., 03 30 00" />
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contract_clause">Contract Clause</Label>
                    <Controller
                      name="contract_clause"
                      control={control}
                      render={({ field }) => (
                        <Input {...field} placeholder="e.g., Section 4.2.1" />
                      )}
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="proposed_solution">Proposed Solution (Optional)</Label>
                    <Controller
                      name="proposed_solution"
                      control={control}
                      render={({ field }) => (
                        <Textarea 
                          {...field} 
                          placeholder="Describe your proposed solution..."
                          className="min-h-[80px]"
                        />
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </form>
        </div>
        
        {/* Footer with navigation and actions */}
        <div className="border-t p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {currentStep > 1 && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCurrentStep(currentStep - 1)}
                >
                  Previous
                </Button>
              )}
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleSaveDraft}
                disabled={isAutoSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              {currentStep < steps.length ? (
                <Button 
                  type="button" 
                  onClick={() => setCurrentStep(currentStep + 1)}
                >
                  Next
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  onClick={handleSubmit(onSubmit)}
                  disabled={!isValid}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isEditing ? 'Update RFI' : 'Create RFI'}
                </Button>
              )}
              
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};