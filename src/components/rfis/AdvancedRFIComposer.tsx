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
import { CalendarIcon, FileText, Upload, X, Paperclip, Eye, Save, Send, ChevronDown, Search, User, Mail, Building, Phone, Bold, Italic, Underline, Palette, List, Table, AlignLeft, Link, Image, Code, Info } from 'lucide-react';
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
const mailTypes = ['Action Item', 'Advice', 'Approval', 'Change Request', 'Commercial Query', 'Daily Site Report', 'Design Query', 'General Correspondence', 'Initial Incident Report', 'Inspection Report', 'Internal Memorandum', 'Letter', 'Non Conformance Report', 'Notice', 'Rejection Notice', 'Request For Information', 'Site Instruction', 'Variation'];
const instrumentationTypes = ['Construction Query', 'Design Clarification', 'Material Specification', 'Quality Control', 'Safety Inquiry', 'Schedule Information'];
const disciplines = ['Architectural', 'Structural', 'Mechanical', 'Electrical', 'Plumbing', 'HVAC', 'Fire Safety', 'Landscaping'];
export const AdvancedRFIComposer: React.FC<AdvancedRFIComposerProps> = ({
  open,
  onOpenChange,
  projectId
}) => {
  const {
    createRFI
  } = useRFIs(projectId);
  const {
    teamMembers
  } = useProjectTeam(projectId);
  const {
    projects
  } = useProjects();
  const {
    profile,
    user
  } = useAuth();
  const {
    documents
  } = useDocuments(projectId);
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
    responseRequiredDate: undefined as Date | undefined,
    subject: '',
    // Message Composition
    messageContent: '',
    autoTextTemplate: '',
    signature: '',
    // Technical Details
    instrumentationType: '',
    discipline: '',
    scheduleImpact: 'No',
    scheduleDetails: '',
    costImpact: 'No',
    costDetails: '',
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
  const [ccSearch, setCcSearch] = useState('');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [costCharacterCount, setCostCharacterCount] = useState(0);
  const [scheduleCharacterCount, setScheduleCharacterCount] = useState(0);
  const [showRichTextToolbar, setShowRichTextToolbar] = useState(false);

  // Auto-save functionality
  useEffect(() => {
    const interval = setInterval(() => {
      if (formData.subject || formData.messageContent) {
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
        signature: `From: ${profile.name || user.email}`
      }));
    }
  }, [open, currentProject, profile, user]);
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
  const filteredTeamMembers = teamMembers.filter(member => member.user_profile?.name?.toLowerCase().includes(recipientSearch.toLowerCase()));
  const filteredCcMembers = teamMembers.filter(member => member.user_profile?.name?.toLowerCase().includes(ccSearch.toLowerCase()));
  const handleSaveDraft = async () => {
    setIsDraft(true);
    setLoading(true);
    try {
      // Create a draft RFI with incomplete data
      await createRFI({
        project_id: projectId,
        question: formData.messageContent || 'Draft RFI',
        priority: formData.priority,
        category: formData.category || formData.discipline || 'Draft',
        assigned_to: formData.assigned_to,
        due_date: formData.responseRequiredDate?.toISOString(),
        project_name: formData.project_name,
        project_number: formData.project_number,
        recipient_name: formData.recipient_name,
        recipient_email: formData.recipient_email,
        sender_name: formData.sender_name,
        sender_email: formData.sender_email,
        subject: formData.subject || 'Draft RFI',
        required_response_by: formData.responseRequiredDate?.toISOString()
        // Remove status as it's not part of the createRFI interface
      });
      console.log('Draft saved successfully');
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      setLoading(false);
    }
  };
  const handlePreview = () => {
    // Create preview content
    const previewContent = `
      <html>
        <head>
          <title>RFI Preview</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .field { margin: 15px 0; }
            .label { font-weight: bold; color: #333; }
            .content { margin-top: 8px; padding: 10px; background: #f9f9f9; border: 1px solid #ddd; border-radius: 4px; }
            .signature { margin-top: 30px; border-top: 1px solid #ccc; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Request for Information - Preview</h1>
            <p><strong>Mail Type:</strong> ${formData.mailType}</p>
            <p><strong>Project:</strong> ${formData.project_name}</p>
          </div>
          
          <div class="field">
            <div class="label">To:</div>
            <div class="content">${formData.recipients.map(id => teamMembers.find(m => m.user_id === id)?.user_profile?.name).join(', ')}</div>
          </div>
          
          ${formData.ccRecipients.length > 0 ? `
          <div class="field">
            <div class="label">CC:</div>
            <div class="content">${formData.ccRecipients.map(id => teamMembers.find(m => m.user_id === id)?.user_profile?.name).join(', ')}</div>
          </div>
          ` : ''}
          
          <div class="field">
            <div class="label">Subject:</div>
            <div class="content">${formData.subject}</div>
          </div>
          
          <div class="field">
            <div class="label">Message:</div>
            <div class="content">${formData.messageContent}</div>
          </div>
          
          <div class="field">
            <div class="label">Response Required:</div>
            <div class="content">${formData.responseRequired}${formData.responseRequiredDate ? ` by ${format(formData.responseRequiredDate, 'MMM dd, yyyy')}` : ''}</div>
          </div>
          
          ${formData.instrumentationType ? `
          <div class="field">
            <div class="label">Instrumentation Type:</div>
            <div class="content">${formData.instrumentationType}</div>
          </div>
          ` : ''}
          
          ${formData.discipline ? `
          <div class="field">
            <div class="label">Discipline:</div>
            <div class="content">${formData.discipline}</div>
          </div>
          ` : ''}
          
          <div class="signature">
            <p>${formData.signature}</p>
          </div>
        </body>
      </html>
    `;
    const previewWindow = window.open('', '_blank', 'width=800,height=600');
    if (previewWindow) {
      previewWindow.document.write(previewContent);
      previewWindow.document.close();
    }
  };
  const handleSubmit = async () => {
    if (!formData.subject || !formData.instrumentationType || !formData.discipline) return;
    setLoading(true);
    try {
      await createRFI({
        project_id: projectId,
        question: formData.messageContent || `${formData.instrumentationType} - ${formData.discipline}`,
        priority: formData.priority,
        category: formData.category || formData.discipline,
        assigned_to: formData.assigned_to,
        due_date: formData.responseRequiredDate?.toISOString(),
        project_name: formData.project_name,
        project_number: formData.project_number,
        recipient_name: formData.recipient_name,
        recipient_email: formData.recipient_email,
        sender_name: formData.sender_name,
        sender_email: formData.sender_email,
        subject: formData.subject,
        required_response_by: formData.responseRequiredDate?.toISOString()
      });

      // Reset form
      setFormData({
        mailType: 'Request For Information',
        distributionRules: true,
        recipients: [],
        ccRecipients: [],
        responseRequired: 'Yes',
        responseRequiredDate: undefined,
        subject: '',
        messageContent: '',
        autoTextTemplate: '',
        signature: `From: ${profile?.name || user?.email}`,
        instrumentationType: '',
        discipline: '',
        scheduleImpact: 'No',
        scheduleDetails: '',
        costImpact: 'No',
        costDetails: '',
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
  const isFormValid = formData.subject && formData.instrumentationType && formData.discipline;
  const handleRichTextAction = (action: string) => {
    const textarea = document.getElementById('message-content') as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    let replacement = selectedText;
    switch (action) {
      case 'bold':
        replacement = `**${selectedText}**`;
        break;
      case 'italic':
        replacement = `*${selectedText}*`;
        break;
      case 'underline':
        replacement = `<u>${selectedText}</u>`;
        break;
      case 'bullet-list':
        replacement = selectedText.split('\n').map(line => `• ${line}`).join('\n');
        break;
      case 'numbered-list':
        replacement = selectedText.split('\n').map((line, index) => `${index + 1}. ${line}`).join('\n');
        break;
      case 'link':
        const url = prompt('Enter URL:');
        if (url) replacement = `[${selectedText || 'Link text'}](${url})`;
        break;
      case 'table':
        replacement = `\n| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |\n`;
        break;
      case 'code':
        replacement = `\`${selectedText}\``;
        break;
      default:
        return;
    }
    const newValue = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
    setFormData(prev => ({
      ...prev,
      messageContent: newValue
    }));

    // Update cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 0);
  };
  const handleDocumentAttach = (type: 'document' | 'project-mail' | 'local-file') => {
    switch (type) {
      case 'document':
        // Show document selector from project documents
        console.log('Attach document from project');
        break;
      case 'project-mail':
        // Show project mail selector
        console.log('Attach from project mail');
        break;
      case 'local-file':
        // Open file picker
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png';
        input.onchange = e => {
          const files = (e.target as HTMLInputElement).files;
          if (files && selectedDocuments.length + files.length <= 6) {
            // Handle file upload logic here
            console.log('Selected files:', files);
          } else {
            alert('Maximum 6 files allowed');
          }
        };
        input.click();
        break;
    }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">Create RFI</DialogTitle>
            <div className="flex items-center space-x-2">
              {isDraft && <Badge variant="secondary">Draft</Badge>}
            </div>
          </div>
          
          {/* Header Controls */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center space-x-2">
              <Popover>
                <PopoverTrigger asChild>
                  
                </PopoverTrigger>
                <PopoverContent className="w-40">
                  <div className="space-y-2">
                    <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => handleDocumentAttach('document')}>
                      Document
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => handleDocumentAttach('project-mail')}>
                      Project Mail
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => handleDocumentAttach('local-file')}>
                      Local File
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              <Button variant="outline" size="sm" onClick={handlePreview}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              
            </div>
            
            <Button onClick={handleSubmit} disabled={loading || !isFormValid} className="bg-slate-900 hover:bg-slate-800 text-white">
              <Send className="h-4 w-4 mr-2" />
              {loading ? 'Sending...' : 'Send RFI'}
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={`step-${currentStep}`} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="step-1" onClick={() => setCurrentStep(1)} className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">1. Recipients</TabsTrigger>
              <TabsTrigger value="step-2" onClick={() => setCurrentStep(2)} className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                2. Message Composition
              </TabsTrigger>
              <TabsTrigger value="step-3" onClick={() => setCurrentStep(3)} className="data-[state=active]:bg-slate-900 data-[state=active]:text-white">3. Attachments</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-auto">
              {/* Step 1: Email Configuration */}
              <TabsContent value="step-1" className="space-y-6 mt-0">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="mail-type">Mail Type *</Label>
                      <Select value={formData.mailType} onValueChange={value => setFormData(prev => ({
                      ...prev,
                      mailType: value
                    }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select mail type" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {mailTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    

                    <div>
                      <Label>To Recipients *</Label>
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="Search contacts..." value={recipientSearch} onChange={e => setRecipientSearch(e.target.value)} className="pl-10" />
                        </div>
                        
                        {recipientSearch && <Card className="max-h-40 overflow-y-auto">
                            <CardContent className="p-2">
                              {filteredTeamMembers.map(member => <div key={member.user_id} className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer" onClick={() => handleRecipientAdd(member.user_id)}>
                                  <div className="flex items-center space-x-2">
                                    <User className="h-4 w-4" />
                                    <span className="text-sm">{member.user_profile?.name}</span>
                                    <Badge variant="outline" className="text-xs">{member.role}</Badge>
                                  </div>
                                </div>)}
                            </CardContent>
                          </Card>}

                        {formData.recipients.length > 0 && <div className="space-y-1">
                            {formData.recipients.map(recipientId => {
                          const member = teamMembers.find(m => m.user_id === recipientId);
                          return <div key={recipientId} className="flex items-center justify-between bg-muted p-2 rounded">
                                  <span className="text-sm">{member?.user_profile?.name}</span>
                                  <Button variant="ghost" size="sm" onClick={() => handleRecipientRemove(recipientId)}>
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>;
                        })}
                          </div>}

                        <div className="space-y-2">
                          <Input placeholder="Add email manually..." onKeyPress={e => {
                          if (e.key === 'Enter' && e.currentTarget.value) {
                            const email = e.currentTarget.value;
                            setFormData(prev => ({
                              ...prev,
                              recipients: [...prev.recipients, email]
                            }));
                            e.currentTarget.value = '';
                          }
                        }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Cc Recipients</Label>
                      <div className="space-y-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="Search Cc contacts..." value={ccSearch} onChange={e => setCcSearch(e.target.value)} className="pl-10" />
                        </div>
                        
                        {ccSearch && <Card className="max-h-40 overflow-y-auto">
                            <CardContent className="p-2">
                              {filteredCcMembers.map(member => <div key={member.user_id} className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer" onClick={() => handleCcAdd(member.user_id)}>
                                  <div className="flex items-center space-x-2">
                                    <User className="h-4 w-4" />
                                    <span className="text-sm">{member.user_profile?.name}</span>
                                    <Badge variant="outline" className="text-xs">{member.role}</Badge>
                                  </div>
                                </div>)}
                            </CardContent>
                          </Card>}

                        {formData.ccRecipients.length > 0 && <div className="space-y-1">
                            {formData.ccRecipients.map(recipientId => {
                          const member = teamMembers.find(m => m.user_id === recipientId);
                          return <div key={recipientId} className="flex items-center justify-between bg-muted p-2 rounded">
                                  <span className="text-sm">{member?.user_profile?.name}</span>
                                  <Button variant="ghost" size="sm" onClick={() => handleCcRemove(recipientId)}>
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>;
                        })}
                          </div>}

                        <div className="space-y-2">
                          <Input placeholder="Add Cc email manually..." onKeyPress={e => {
                          if (e.key === 'Enter' && e.currentTarget.value) {
                            const email = e.currentTarget.value;
                            setFormData(prev => ({
                              ...prev,
                              ccRecipients: [...prev.ccRecipients, email]
                            }));
                            e.currentTarget.value = '';
                          }
                        }} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="response-required">Response Required</Label>
                      <Select value={formData.responseRequired} onValueChange={value => setFormData(prev => ({
                      ...prev,
                      responseRequired: value
                    }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Yes">Yes</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                          <SelectItem value="For Information Only">For Information Only</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {formData.responseRequired === 'Yes' && <div className="mt-2">
                          <Label>Response Required By</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.responseRequiredDate && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {formData.responseRequiredDate ? format(formData.responseRequiredDate, "PPP") : <span>Pick a date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar mode="single" selected={formData.responseRequiredDate} onSelect={date => setFormData(prev => ({
                            ...prev,
                            responseRequiredDate: date
                          }))} initialFocus className="pointer-events-auto" />
                            </PopoverContent>
                          </Popover>
                        </div>}
                    </div>

                    <div>
                      <Label htmlFor="subject">Subject *</Label>
                      <Input id="subject" value={formData.subject} onChange={e => setFormData(prev => ({
                      ...prev,
                      subject: e.target.value
                    }))} placeholder="Enter subject line" className={!formData.subject ? 'border-red-300' : ''} />
                      {!formData.subject && <p className="text-red-500 text-sm mt-1">Subject is required</p>}
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
                      <Select onValueChange={value => setFormData(prev => ({
                      ...prev,
                      autoTextTemplate: value
                    }))}>
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
                          <div className="flex items-center space-x-2 flex-wrap gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleRichTextAction('bold')} className="h-8 px-2">
                              <Bold className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleRichTextAction('italic')} className="h-8 px-2">
                              <Italic className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleRichTextAction('underline')} className="h-8 px-2">
                              <Underline className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => {
                        const color = prompt('Enter color (e.g., red, #ff0000):');
                        if (color) {
                          const textarea = document.getElementById('message-content') as HTMLTextAreaElement;
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const selectedText = textarea.value.substring(start, end);
                          const replacement = `<span style="color: ${color}">${selectedText}</span>`;
                          const newValue = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
                          setFormData(prev => ({
                            ...prev,
                            messageContent: newValue
                          }));
                        }
                      }} className="h-8 px-2">
                              <Palette className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleRichTextAction('bullet-list')} className="h-8 px-2">
                              <List className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleRichTextAction('table')} className="h-8 px-2">
                              <Table className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => {
                        const textarea = document.getElementById('message-content') as HTMLTextAreaElement;
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const selectedText = textarea.value.substring(start, end);
                        const alignment = prompt('Enter alignment (left, center, right):') || 'left';
                        const replacement = `<div style="text-align: ${alignment}">${selectedText}</div>`;
                        const newValue = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
                        setFormData(prev => ({
                          ...prev,
                          messageContent: newValue
                        }));
                      }} className="h-8 px-2">
                              <AlignLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleRichTextAction('link')} className="h-8 px-2">
                              <Link className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => {
                        const url = prompt('Enter image URL:');
                        if (url) {
                          const textarea = document.getElementById('message-content') as HTMLTextAreaElement;
                          const start = textarea.selectionStart;
                          const replacement = `![Image](${url})`;
                          const newValue = textarea.value.substring(0, start) + replacement + textarea.value.substring(start);
                          setFormData(prev => ({
                            ...prev,
                            messageContent: newValue
                          }));
                        }
                      }} className="h-8 px-2">
                              <Image className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleRichTextAction('code')} className="h-8 px-2">
                              <Code className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                    
                    <Textarea id="message-content" value={formData.messageContent} onChange={e => setFormData(prev => ({
                    ...prev,
                    messageContent: e.target.value
                  }))} placeholder="Compose your message..." className="min-h-[200px] border-0 p-0 resize-none focus-visible:ring-0" />
                  </div>

                  <div>
                    <Label htmlFor="signature">Signature</Label>
                    <Textarea id="signature" value={formData.signature} onChange={e => setFormData(prev => ({
                    ...prev,
                    signature: e.target.value
                  }))} placeholder="Your signature block..." className="min-h-[100px]" />
                  </div>
                </div>
              </TabsContent>

              {/* Step 3: Technical Details */}
              <TabsContent value="step-3" className="space-y-6 mt-0">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    

                    

                  </div>

                  
                </div>

                <div className="max-h-60 overflow-y-auto">
                  <Label>Attachments</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center">
                    <FileText className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Attach up to 6 files
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      
                      
                      <Button variant="outline" size="sm" onClick={() => handleDocumentAttach('local-file')}>
                        Local File
                      </Button>
                    </div>
                  </div>
                  
                  {selectedDocuments.length > 0 && <div className="mt-4 space-y-2">
                      <Label className="text-sm">Selected Files ({selectedDocuments.length}/6)</Label>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {selectedDocuments.map(docId => {
                      const doc = documents.find(d => d.id === docId);
                      return <div key={docId} className="flex items-center justify-between bg-muted p-2 rounded">
                              <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4" />
                                <span className="text-sm">{doc?.name}</span>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => handleDocumentSelect(docId)}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>;
                    })}
                      </div>
                    </div>}
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <div className="border-t pt-4 flex justify-between">
          <div className="flex items-center space-x-2">
            {currentStep > 1 && <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                Previous
              </Button>}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {currentStep < 3 ? <Button onClick={() => setCurrentStep(currentStep + 1)} className="bg-slate-900 hover:bg-slate-800 text-white">
                Next
              </Button> : <Button onClick={handleSubmit} disabled={loading || !isFormValid} className="bg-slate-900 hover:bg-slate-800 text-white">
                <Send className="h-4 w-4 mr-2" />
                {loading ? 'Sending...' : 'Send RFI'}
              </Button>}
          </div>
        </div>
      </DialogContent>
    </Dialog>;
};