import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ModernCalendar } from '@/components/ui/modern-calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, FileText, Upload, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useRFIs } from '@/hooks/useRFIs';
import { useProjectTeam } from '@/hooks/useProjectTeam';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { useDocuments } from '@/hooks/useDocuments';
import { Badge } from '@/components/ui/badge';
interface CreateRFIDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}
export const CreateRFIDialog: React.FC<CreateRFIDialogProps> = ({
  open,
  onOpenChange,
  projectId
}) => {
  const {
    createRFI
  } = useRFIs();
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
  const [formData, setFormData] = useState({
    project_name: '',
    project_number: '',
    date: new Date(),
    recipient_name: '',
    recipient_email: '',
    sender_name: '',
    sender_email: '',
    subject: '',
    drawing_no: '',
    specification_section: '',
    contract_clause: '',
    other_reference: '',
    question: '',
    proposed_solution: '',
    required_response_by: undefined as Date | undefined,
    priority: 'medium' as const,
    category: '',
    assigned_to: '',
    rfi_type: 'request_for_information' as const
  });
  const [requiredResponseDate, setRequiredResponseDate] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<string>('');
  const [isOtherRecipient, setIsOtherRecipient] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [documentNames, setDocumentNames] = useState<Record<string, string>>({});
  const [selectedCCUsers, setSelectedCCUsers] = useState<string[]>([]);

  // Auto-fill project data when dialog opens
  useEffect(() => {
    if (open && currentProject && profile && user) {
      setFormData(prev => ({
        ...prev,
        project_name: currentProject.name || '',
        project_number: currentProject.id || '',
        sender_name: profile.name || '',
        sender_email: user.email || ''
      }));
    }
  }, [open, currentProject, profile, user]);
  
  // Map display names to database enum values
  const rfiTypeOptions = [
    { label: 'General Correspondence', value: 'general_correspondence' },
    { label: 'Request for Information', value: 'request_for_information' },
    { label: 'General Advice', value: 'general_advice' }
  ];

  // Handle recipient selection
  const handleRecipientChange = (value: string) => {
    setSelectedRecipient(value);
    if (value === 'other') {
      setIsOtherRecipient(true);
      setFormData(prev => ({
        ...prev,
        recipient_name: '',
        recipient_email: ''
      }));
    } else {
      setIsOtherRecipient(false);
      const member = teamMembers.find(m => m.user_id === value);
      if (member) {
        setFormData(prev => ({
          ...prev,
          recipient_name: member.user_profile?.name || '',
          recipient_email: '',
          // Email needs to be filled manually or from auth
          assigned_to: value
        }));
      }
    }
  };

  // Handle document selection
  const handleDocumentSelect = (documentId: string) => {
    if (selectedDocuments.includes(documentId)) {
      setSelectedDocuments(prev => prev.filter(id => id !== documentId));
      setDocumentNames(prev => {
        const {
          [documentId]: removed,
          ...rest
        } = prev;
        return rest;
      });
    } else {
      const doc = documents.find(d => d.id === documentId);
      if (doc) {
        setSelectedDocuments(prev => [...prev, documentId]);
        setDocumentNames(prev => ({
          ...prev,
          [documentId]: doc.name
        }));
      }
    }
  };
  const handleSubmit = async () => {
    if (!formData.question || !formData.subject) return;

    // Build reference documents string from selected documents
    const referenceDocsFromSelection = selectedDocuments.map(id => documentNames[id]).filter(Boolean).join(', ');
    const otherRef = [formData.other_reference, referenceDocsFromSelection].filter(Boolean).join(', ');
    setLoading(true);
    try {
      await createRFI({
        project_id: projectId,
        question: formData.question,
        priority: formData.priority,
        category: formData.category,
        assigned_to: formData.assigned_to,
        due_date: requiredResponseDate?.toISOString(),
        rfi_type: formData.rfi_type,
        // New structured fields
        project_name: formData.project_name,
        project_number: formData.project_number,
        recipient_name: formData.recipient_name,
        recipient_email: formData.recipient_email,
        sender_name: formData.sender_name,
        sender_email: formData.sender_email,
        subject: formData.subject,
        drawing_no: formData.drawing_no,
        specification_section: formData.specification_section,
        contract_clause: formData.contract_clause,
        other_reference: otherRef,
        proposed_solution: formData.proposed_solution,
        required_response_by: requiredResponseDate?.toISOString(),
        cc_list: selectedCCUsers
      });

      // Reset form
      setFormData({
        project_name: currentProject?.name || '',
        project_number: currentProject?.id || '',
        date: new Date(),
        recipient_name: '',
        recipient_email: '',
        sender_name: profile?.name || '',
        sender_email: user?.email || '',
        subject: '',
        drawing_no: '',
        specification_section: '',
        contract_clause: '',
        other_reference: '',
        question: '',
        proposed_solution: '',
        required_response_by: undefined,
        priority: 'medium',
        category: '',
        assigned_to: '',
        rfi_type: 'request_for_information'
      });
      setRequiredResponseDate(undefined);
      setSelectedRecipient('');
      setIsOtherRecipient(false);
      setSelectedDocuments([]);
      setDocumentNames({});
      setSelectedCCUsers([]);
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating RFI:', error);
    } finally {
      setLoading(false);
    }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New RFI</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="project-name">Project Name</Label>
              <Input id="project-name" value={formData.project_name} onChange={e => setFormData(prev => ({
              ...prev,
              project_name: e.target.value
            }))} />
            </div>

            <div>
              <Label htmlFor="project-number">Project Number</Label>
              <Input id="project-number" value={formData.project_number} onChange={e => setFormData(prev => ({
              ...prev,
              project_number: e.target.value
            }))} />
            </div>

            <div>
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={format(formData.date, 'yyyy-MM-dd')} onChange={e => setFormData(prev => ({
              ...prev,
              date: new Date(e.target.value)
            }))} />
            </div>

            <div>
              <Label htmlFor="recipient-select">To (Recipient)</Label>
              <Select value={selectedRecipient} onValueChange={handleRecipientChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select recipient" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map(member => <SelectItem key={member.user_id} value={member.user_id}>
                      {member.user_profile?.name || 'Unknown User'} ({member.user_profile?.role || member.role})
                    </SelectItem>)}
                  <SelectItem value="other">Other recipient</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isOtherRecipient && <>
                <div>
                  <Label htmlFor="recipient-name">Recipient Name</Label>
                  <Input id="recipient-name" value={formData.recipient_name} onChange={e => setFormData(prev => ({
                ...prev,
                recipient_name: e.target.value
              }))} placeholder="Enter recipient name" />
                </div>

                <div>
                  <Label htmlFor="recipient-email">Recipient Email</Label>
                  <Input id="recipient-email" type="email" value={formData.recipient_email} onChange={e => setFormData(prev => ({
                ...prev,
                recipient_email: e.target.value
              }))} placeholder="recipient@company.com" />
                </div>
              </>}

            <div>
              <Label htmlFor="sender-name">From (Sender Name)</Label>
              <Input id="sender-name" value={formData.sender_name} onChange={e => setFormData(prev => ({
              ...prev,
              sender_name: e.target.value
            }))} />
            </div>

            <div>
              <Label htmlFor="sender-email">From (Sender Email)</Label>
              <Input id="sender-email" type="email" value={formData.sender_email} onChange={e => setFormData(prev => ({
              ...prev,
              sender_email: e.target.value
            }))} placeholder="sender@company.com" />
            </div>

            <div>
              <Label htmlFor="subject">Subject / Title</Label>
              <Input id="subject" value={formData.subject} onChange={e => setFormData(prev => ({
              ...prev,
              subject: e.target.value
            }))} placeholder="Brief description of the RFI" />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div className="space-y-3">
              <Label>Reference Documents</Label>
              
              

              

              

              <div>
                <Label className="text-sm text-muted-foreground">Attach Project Documents</Label>
                {documents.length > 0 ? <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-1">
                    {documents.map(doc => <div key={doc.id} className={cn("flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-muted", selectedDocuments.includes(doc.id) && "bg-primary/10")} onClick={() => handleDocumentSelect(doc.id)}>
                        <FileText className="h-4 w-4" />
                        <span className="text-sm flex-1 truncate">{doc.name}</span>
                        {selectedDocuments.includes(doc.id) && <div className="text-primary">✓</div>}
                      </div>)}
                  </div> : <p className="text-sm text-muted-foreground">No documents available in this project</p>}
                
                {selectedDocuments.length > 0 && <div className="space-y-1">
                    <Label className="text-sm text-muted-foreground">Selected Documents:</Label>
                    {selectedDocuments.map(docId => <div key={docId} className="flex items-center justify-between bg-muted p-2 rounded text-sm">
                        <span className="truncate flex-1">{documentNames[docId]}</span>
                        <Button variant="ghost" size="sm" onClick={() => handleDocumentSelect(docId)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>)}
                  </div>}
              </div>

              
            </div>

            <div>
              <Label htmlFor="rfi-type">Mail Type</Label>
              <Select value={formData.rfi_type} onValueChange={(value: any) => setFormData(prev => ({
              ...prev,
              rfi_type: value
            }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select mail type" />
                </SelectTrigger>
                <SelectContent>
                  {rfiTypeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value: any) => setFormData(prev => ({
              ...prev,
              priority: value
            }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            

            {!isOtherRecipient && <div>
                <Label htmlFor="assigned-to">Assign To</Label>
                <Select value={formData.assigned_to} onValueChange={value => setFormData(prev => ({
              ...prev,
              assigned_to: value
            }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map(member => <SelectItem key={member.user_id} value={member.user_id}>
                        {member.user_profile?.name || 'Unknown User'} ({member.user_profile?.role || member.role})
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>}

            <div>
              <Label>Required Response By</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !requiredResponseDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {requiredResponseDate ? format(requiredResponseDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <ModernCalendar mode="single" selected={requiredResponseDate} onSelect={setRequiredResponseDate} initialFocus className="p-0" />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>CC (Carbon Copy)</Label>
              <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-1">
                {teamMembers
                  .filter(member => member.user_id !== selectedRecipient && member.user_id !== formData.assigned_to)
                  .map(member => (
                    <div 
                      key={member.user_id} 
                      className={cn(
                        "flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-muted",
                        selectedCCUsers.includes(member.user_id) && "bg-primary/10"
                      )}
                      onClick={() => {
                        if (selectedCCUsers.includes(member.user_id)) {
                          setSelectedCCUsers(prev => prev.filter(id => id !== member.user_id));
                        } else {
                          setSelectedCCUsers(prev => [...prev, member.user_id]);
                        }
                      }}
                    >
                      <span className="text-sm flex-1">
                        {member.user_profile?.name || 'Unknown User'} ({member.user_profile?.role || member.role})
                      </span>
                      {selectedCCUsers.includes(member.user_id) && (
                        <div className="text-primary">✓</div>
                      )}
                    </div>
                  ))}
                {teamMembers.filter(m => m.user_id !== selectedRecipient && m.user_id !== formData.assigned_to).length === 0 && (
                  <p className="text-sm text-muted-foreground p-2">No other team members available for CC</p>
                )}
              </div>
              {selectedCCUsers.length > 0 && (
                <div className="mt-2">
                  <Label className="text-sm text-muted-foreground">
                    CC'd Users ({selectedCCUsers.length}):
                  </Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedCCUsers.map(userId => {
                      const member = teamMembers.find(m => m.user_id === userId);
                      return (
                        <Badge key={userId} variant="secondary" className="text-xs">
                          {member?.user_profile?.name || 'Unknown'}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Full width fields */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="question">Request / Question</Label>
            <Textarea id="question" placeholder="Describe your request or question in detail..." value={formData.question} onChange={e => setFormData(prev => ({
            ...prev,
            question: e.target.value
          }))} className="min-h-[100px]" />
          </div>

          
        </div>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !formData.question || !formData.subject}>
            {loading ? 'Creating...' : 'Create RFI'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>;
};