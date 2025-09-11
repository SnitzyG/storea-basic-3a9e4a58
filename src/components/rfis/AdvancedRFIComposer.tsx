import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  CalendarIcon, 
  FileText, 
  Upload, 
  X, 
  Paperclip,
  Settings,
  Eye,
  Save,
  Send,
  ChevronDown,
  Search,
  Info,
  DollarSign,
  Calendar as CalendarDays,
  User,
  Mail,
  Building,
  Phone
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useRFIs } from '@/hooks/useRFIs';
import { useProjectTeam } from '@/hooks/useProjectTeam';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { useDocuments } from '@/hooks/useDocuments';

interface AdvancedRFIComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

const mailTypes = [
  'Action Item', 'Advice', 'Approval', 'Change Request', 'Commercial Query',
  'Daily Site Report', 'Design Query', 'General Correspondence',
  'Initial Incident Report', 'Inspection Report', 'Internal Memorandum',
  'Letter', 'Non Conformance Report', 'Notice', 'Rejection Notice',
  'Request For Information', 'Site Instruction', 'Variation'
];

const instrumentationTypes = [
  'Construction Query', 'Design Clarification', 'Material Specification',
  'Quality Control', 'Safety Inquiry', 'Schedule Information'
];

const disciplines = [
  'Architectural', 'Structural', 'Mechanical', 'Electrical', 
  'Plumbing', 'HVAC', 'Fire Safety', 'Landscaping'
];

export const AdvancedRFIComposer: React.FC<AdvancedRFIComposerProps> = ({
  open,
  onOpenChange,
  projectId
}) => {
  const { createRFI } = useRFIs(projectId);
  const { teamMembers } = useProjectTeam(projectId);
  const { projects } = useProjects();
  const { profile, user } = useAuth();
  const { documents } = useDocuments(projectId);

  const currentProject = projects.find(p => p.id === projectId);
  const [currentStep, setCurrentStep] = useState(1);
  const [isDraft, setIsDraft] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    // Email Configuration
    mailType: 'Request For Information',
    distributionRules: true,
    recipients: [] as string[],
    ccRecipients: [] as string[],
    responseRequired: 'Yes',
    subject: '',

    // Message Composition
    messageContent: '',
    autoTextTemplate: '',
    signature: '',

    // Technical Details
    instrumentationType: '',
    discipline: '',
    question: '',
    scheduleImpact: 'No',
    scheduleDetails: '',
    costImpact: 'No',
    costDetails: '',
    estimatedCost: '',
    estimatedSchedule: '',

    // Project Info
    project_name: '',
    project_number: '',
    sender_name: '',
    sender_email: '',
    recipient_name: '',
    recipient_email: '',
    priority: 'medium' as const,
    category: '',
    assigned_to: '',
    required_response_by: undefined as Date | undefined
  });

  const [selectedRecipient, setSelectedRecipient] = useState<string>('');
  const [recipientSearch, setRecipientSearch] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [characterCount, setCharacterCount] = useState(0);
  const [costCharacterCount, setCostCharacterCount] = useState(0);
  const [scheduleCharacterCount, setScheduleCharacterCount] = useState(0);

  // Auto-save functionality
  useEffect(() => {
    const interval = setInterval(() => {
      if (formData.subject || formData.question) {
        setIsDraft(true);
        // In a real app, you'd save to backend here
        console.log('Auto-saving draft...');
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(interval);
  }, [formData]);

  // Auto-fill project data when dialog opens
  useEffect(() => {
    if (open && currentProject && profile && user) {
      setFormData(prev => ({
        ...prev,
        project_name: currentProject.name || '',
        project_number: currentProject.id || '',
        sender_name: profile.name || '',
        sender_email: user.email || '',
        signature: `${profile.name}\n${profile.role}\n${user.email}`
      }));
    }
  }, [open, currentProject, profile, user]);

  // Update character counts
  useEffect(() => {
    setCharacterCount(formData.question.length);
  }, [formData.question]);

  useEffect(() => {
    setCostCharacterCount(formData.costDetails.length);
  }, [formData.costDetails]);

  useEffect(() => {
    setScheduleCharacterCount(formData.scheduleDetails.length);
  }, [formData.scheduleDetails]);

  const handleRecipientAdd = (recipientId: string) => {
    const member = teamMembers.find(m => m.user_id === recipientId);
    if (member && !formData.recipients.includes(recipientId)) {
      setFormData(prev => ({
        ...prev,
        recipients: [...prev.recipients, recipientId],
        recipient_name: member.user_profile?.name || '',
        assigned_to: recipientId
      }));
    }
  };

  const handleCcAdd = (recipientId: string) => {
    if (!formData.ccRecipients.includes(recipientId)) {
      setFormData(prev => ({
        ...prev,
        ccRecipients: [...prev.ccRecipients, recipientId]
      }));
    }
  };

  const handleRecipientRemove = (recipientId: string) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.filter(id => id !== recipientId)
    }));
  };

  const handleCcRemove = (recipientId: string) => {
    setFormData(prev => ({
      ...prev,
      ccRecipients: prev.ccRecipients.filter(id => id !== recipientId)
    }));
  };

  const handleDocumentSelect = (documentId: string) => {
    if (selectedDocuments.includes(documentId)) {
      setSelectedDocuments(prev => prev.filter(id => id !== documentId));
    } else if (selectedDocuments.length < 6) {
      setSelectedDocuments(prev => [...prev, documentId]);
    }
  };

  const filteredTeamMembers = teamMembers.filter(member =>
    member.user_profile?.name?.toLowerCase().includes(recipientSearch.toLowerCase())
  );

  const handleSaveDraft = () => {
    setIsDraft(true);
    // In a real app, save to backend
    console.log('Saving draft...');
  };

  const handlePreview = () => {
    // Open preview modal/page
    console.log('Opening preview...');
  };

  const handleSubmit = async () => {
    if (!formData.question || !formData.subject) return;

    setLoading(true);
    try {
      await createRFI({
        project_id: projectId,
        question: formData.question,
        priority: formData.priority,
        category: formData.category || formData.discipline,
        assigned_to: formData.assigned_to,
        due_date: formData.required_response_by?.toISOString(),
        project_name: formData.project_name,
        project_number: formData.project_number,
        recipient_name: formData.recipient_name,
        recipient_email: formData.recipient_email,
        sender_name: formData.sender_name,
        sender_email: formData.sender_email,
        subject: formData.subject,
        required_response_by: formData.required_response_by?.toISOString()
      });

      // Reset form
      setFormData({
        mailType: 'Request For Information',
        distributionRules: true,
        recipients: [],
        ccRecipients: [],
        responseRequired: 'Yes',
        subject: '',
        messageContent: '',
        autoTextTemplate: '',
        signature: `${profile?.name}\n${profile?.role}\n${user?.email}`,
        instrumentationType: '',
        discipline: '',
        question: '',
        scheduleImpact: 'No',
        scheduleDetails: '',
        costImpact: 'No',
        costDetails: '',
        estimatedCost: '',
        estimatedSchedule: '',
        project_name: currentProject?.name || '',
        project_number: currentProject?.id || '',
        sender_name: profile?.name || '',
        sender_email: user?.email || '',
        recipient_name: '',
        recipient_email: '',
        priority: 'medium',
        category: '',
        assigned_to: '',
        required_response_by: undefined
      });
      setCurrentStep(1);
      setSelectedDocuments([]);
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating RFI:', error);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.subject && formData.question && formData.instrumentationType && formData.discipline;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">Advanced RFI Composition</DialogTitle>
            <div className="flex items-center space-x-2">
              {isDraft && <Badge variant="secondary">Draft</Badge>}
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Options
              </Button>
            </div>
          </div>
          
          {/* Header Controls */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Paperclip className="h-4 w-4 mr-2" />
                Attach
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
              <Button variant="outline" size="sm" onClick={handlePreview}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button variant="outline" size="sm" onClick={handleSaveDraft}>
                <Save className="h-4 w-4 mr-2" />
                Save To Draft
              </Button>
            </div>
            
            <Button 
              onClick={handleSubmit}
              disabled={loading || !isFormValid}
              className="bg-slate-900 hover:bg-slate-800 text-white"
            >
              <Send className="h-4 w-4 mr-2" />
              {loading ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={`step-${currentStep}`} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger 
                value="step-1" 
                onClick={() => setCurrentStep(1)}
                className="data-[state=active]:bg-slate-900 data-[state=active]:text-white"
              >
                1. Email Configuration
              </TabsTrigger>
              <TabsTrigger 
                value="step-2" 
                onClick={() => setCurrentStep(2)}
                className="data-[state=active]:bg-slate-900 data-[state=active]:text-white"
              >
                2. Message Composition
              </TabsTrigger>
              <TabsTrigger 
                value="step-3" 
                onClick={() => setCurrentStep(3)}
                className="data-[state=active]:bg-slate-900 data-[state=active]:text-white"
              >
                3. Technical Details
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-auto">
              {/* Step 1: Email Configuration */}
              <TabsContent value="step-1" className="space-y-6 mt-0">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="mail-type">Mail Type *</Label>
                      <Select value={formData.mailType} onValueChange={(value) => 
                        setFormData(prev => ({ ...prev, mailType: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select mail type" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {mailTypes.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                      <div className="flex items-center space-x-2">
                        <Info className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Distribution Rules</span>
                      </div>
                      <p className="text-sm text-blue-700 mt-1">
                        Standard distribution rules apply. <button className="underline">Preview link</button>
                      </p>
                    </div>

                    <div>
                      <Label>To Recipients *</Label>
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search contacts..."
                            value={recipientSearch}
                            onChange={(e) => setRecipientSearch(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        
                        {recipientSearch && (
                          <Card className="max-h-40 overflow-y-auto">
                            <CardContent className="p-2">
                              {filteredTeamMembers.map(member => (
                                <div 
                                  key={member.user_id}
                                  className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer"
                                  onClick={() => handleRecipientAdd(member.user_id)}
                                >
                                  <div className="flex items-center space-x-2">
                                    <User className="h-4 w-4" />
                                    <span className="text-sm">{member.user_profile?.name}</span>
                                    <Badge variant="outline" className="text-xs">{member.role}</Badge>
                                  </div>
                                </div>
                              ))}
                            </CardContent>
                          </Card>
                        )}

                        {formData.recipients.length > 0 && (
                          <div className="space-y-1">
                            {formData.recipients.map(recipientId => {
                              const member = teamMembers.find(m => m.user_id === recipientId);
                              return (
                                <div key={recipientId} className="flex items-center justify-between bg-muted p-2 rounded">
                                  <span className="text-sm">{member?.user_profile?.name}</span>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleRecipientRemove(recipientId)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <Button variant="outline" size="sm" className="w-full">
                          <Building className="h-4 w-4 mr-2" />
                          Directory
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Cc Recipients</Label>
                      <div className="space-y-2">
                        <Select onValueChange={handleCcAdd}>
                          <SelectTrigger>
                            <SelectValue placeholder="Add Cc recipients" />
                          </SelectTrigger>
                          <SelectContent>
                            {teamMembers.map(member => (
                              <SelectItem key={member.user_id} value={member.user_id}>
                                {member.user_profile?.name} ({member.role})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {formData.ccRecipients.length > 0 && (
                          <div className="space-y-1">
                            {formData.ccRecipients.map(recipientId => {
                              const member = teamMembers.find(m => m.user_id === recipientId);
                              return (
                                <div key={recipientId} className="flex items-center justify-between bg-muted p-2 rounded">
                                  <span className="text-sm">{member?.user_profile?.name}</span>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleCcRemove(recipientId)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="response-required">Response Required</Label>
                      <Select value={formData.responseRequired} onValueChange={(value) => 
                        setFormData(prev => ({ ...prev, responseRequired: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                          <SelectItem value="For Information Only">For Information Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="subject">Subject *</Label>
                      <Input
                        id="subject"
                        value={formData.subject}
                        onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                        placeholder="Enter subject line"
                        className={!formData.subject ? 'border-red-300' : ''}
                      />
                      {!formData.subject && (
                        <p className="text-red-500 text-sm mt-1">Subject is required</p>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Step 2: Message Composition */}
              <TabsContent value="step-2" className="space-y-6 mt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="message-content">Message Content</Label>
                    <div className="flex items-center space-x-2">
                      <Select onValueChange={(value) => 
                        setFormData(prev => ({ ...prev, autoTextTemplate: value }))}>
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Auto-text templates" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard RFI Template</SelectItem>
                          <SelectItem value="urgent">Urgent RFI Template</SelectItem>
                          <SelectItem value="followup">Follow-up Template</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4 bg-card">
                    <div className="border-b pb-2 mb-4">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <span>Bold</span>
                        <span>Italic</span>
                        <span>Underline</span>
                        <span>Color</span>
                        <span>Lists</span>
                        <span>Tables</span>
                        <span>Alignment</span>
                        <Select>
                          <SelectTrigger className="w-20 h-8">
                            <SelectValue placeholder="More" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="link">Insert Link</SelectItem>
                            <SelectItem value="image">Insert Image</SelectItem>
                            <SelectItem value="code">Code Block</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <Textarea
                      id="message-content"
                      value={formData.messageContent}
                      onChange={(e) => setFormData(prev => ({ ...prev, messageContent: e.target.value }))}
                      placeholder="Compose your message..."
                      className="min-h-[200px] border-0 p-0 resize-none focus-visible:ring-0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="signature">Signature</Label>
                    <Textarea
                      id="signature"
                      value={formData.signature}
                      onChange={(e) => setFormData(prev => ({ ...prev, signature: e.target.value }))}
                      placeholder="Your signature block..."
                      className="min-h-[100px]"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Step 3: Technical Details */}
              <TabsContent value="step-3" className="space-y-6 mt-0">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="instrumentation-type">Instrumentation Type *</Label>
                      <Select value={formData.instrumentationType} onValueChange={(value) => 
                        setFormData(prev => ({ ...prev, instrumentationType: value }))}>
                        <SelectTrigger className={!formData.instrumentationType ? 'border-red-300' : ''}>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {instrumentationTypes.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {!formData.instrumentationType && (
                        <p className="text-red-500 text-sm mt-1">Instrumentation type is required</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="discipline">Discipline *</Label>
                      <Select value={formData.discipline} onValueChange={(value) => 
                        setFormData(prev => ({ ...prev, discipline: value }))}>
                        <SelectTrigger className={!formData.discipline ? 'border-red-300' : ''}>
                          <SelectValue placeholder="Select discipline" />
                        </SelectTrigger>
                        <SelectContent>
                          {disciplines.map(discipline => (
                            <SelectItem key={discipline} value={discipline}>{discipline}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {!formData.discipline && (
                        <p className="text-red-500 text-sm mt-1">Discipline is required</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="question">Question/Description *</Label>
                      <Textarea
                        id="question"
                        value={formData.question}
                        onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                        placeholder="Describe your request or question in detail..."
                        className={cn(
                          "min-h-[150px]",
                          !formData.question ? 'border-red-300' : ''
                        )}
                        maxLength={4000}
                      />
                      <div className="flex justify-between items-center mt-1">
                        {!formData.question && (
                          <p className="text-red-500 text-sm">Question is required</p>
                        )}
                        <p className="text-sm text-muted-foreground ml-auto">
                          {characterCount}/4000 characters
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Schedule Impact</Label>
                      <Select value={formData.scheduleImpact} onValueChange={(value) => 
                        setFormData(prev => ({ ...prev, scheduleImpact: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {formData.scheduleImpact === 'Yes' && (
                        <div className="mt-2">
                          <Textarea
                            value={formData.scheduleDetails}
                            onChange={(e) => setFormData(prev => ({ ...prev, scheduleDetails: e.target.value }))}
                            placeholder="Describe schedule impact details..."
                            className="min-h-[100px]"
                            maxLength={4000}
                          />
                          <p className="text-sm text-muted-foreground mt-1">
                            {scheduleCharacterCount}/4000 characters
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <Label>Cost Impact</Label>
                        <Info className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Select value={formData.costImpact} onValueChange={(value) => 
                        setFormData(prev => ({ ...prev, costImpact: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {formData.costImpact === 'Yes' && (
                        <div className="mt-2">
                          <Textarea
                            value={formData.costDetails}
                            onChange={(e) => setFormData(prev => ({ ...prev, costDetails: e.target.value }))}
                            placeholder="Describe cost impact details..."
                            className="min-h-[100px]"
                            maxLength={4000}
                          />
                          <p className="text-sm text-muted-foreground mt-1">
                            {costCharacterCount}/4000 characters
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="p-4 border rounded-lg bg-muted/50">
                      <div className="flex items-center space-x-2 mb-3">
                        <Info className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Restricted Information</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Only visible to your organization
                      </p>
                      
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="estimated-cost">Estimated Cost</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="estimated-cost"
                              value={formData.estimatedCost}
                              onChange={(e) => setFormData(prev => ({ ...prev, estimatedCost: e.target.value }))}
                              placeholder="0.00"
                              className="pl-10"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="estimated-schedule">Estimated Schedule Adjustment</Label>
                          <div className="relative">
                            <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="estimated-schedule"
                              value={formData.estimatedSchedule}
                              onChange={(e) => setFormData(prev => ({ ...prev, estimatedSchedule: e.target.value }))}
                              placeholder="Number of days"
                              className="pl-10"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Attachments</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Attach up to 6 files
                    </p>
                    <div className="flex justify-center space-x-2">
                      <Button variant="outline" size="sm">
                        Document
                      </Button>
                      <Button variant="outline" size="sm">
                        Project Mail
                      </Button>
                      <Button variant="outline" size="sm">
                        Local File
                      </Button>
                    </div>
                  </div>
                  
                  {selectedDocuments.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <Label className="text-sm">Selected Files ({selectedDocuments.length}/6)</Label>
                      <div className="space-y-1">
                        {selectedDocuments.map(docId => {
                          const doc = documents.find(d => d.id === docId);
                          return (
                            <div key={docId} className="flex items-center justify-between bg-muted p-2 rounded">
                              <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4" />
                                <span className="text-sm">{doc?.name}</span>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleDocumentSelect(docId)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <div className="border-t pt-4 flex justify-between">
          <div className="flex items-center space-x-2">
            {currentStep > 1 && (
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                Previous
              </Button>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {currentStep < 3 ? (
              <Button 
                onClick={() => setCurrentStep(currentStep + 1)}
                className="bg-slate-900 hover:bg-slate-800 text-white"
              >
                Next
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit}
                disabled={loading || !isFormValid}
                className="bg-slate-900 hover:bg-slate-800 text-white"
              >
                <Send className="h-4 w-4 mr-2" />
                {loading ? 'Sending...' : 'Send RFI'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};