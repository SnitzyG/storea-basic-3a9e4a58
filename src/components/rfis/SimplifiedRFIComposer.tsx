import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { CalendarIcon, X, ChevronDown, Check } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useRFIs } from '@/hooks/useRFIs';
import { useProjectTeam } from '@/hooks/useProjectTeam';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { RFIAttachmentUpload } from './RFIAttachmentUpload';
import { DocumentUploadService } from '@/services/DocumentUploadService';
import { DigitalSignature } from '@/components/ui/digital-signature';

interface SimplifiedRFIComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  replyToRFI?: any; // For reply functionality
}

type RFITypeLabel = 'General Correspondence' | 'Request for Information' | 'General Advice';

export const SimplifiedRFIComposer: React.FC<SimplifiedRFIComposerProps> = ({
  open,
  onOpenChange,
  projectId,
  replyToRFI
}) => {
  const { createRFI, updateRFI } = useRFIs();
  const { teamMembers } = useProjectTeam(projectId);
  const { projects } = useProjects();
  const { profile, user } = useAuth();
  
  const currentProject = projects.find(p => p.id === projectId);
  const isReply = !!replyToRFI;

  const [formData, setFormData] = useState({
    rfi_type: 'General Correspondence' as RFITypeLabel,
    priority: 'medium' as 'low' | 'medium' | 'high',
    recipient_name: '',
    recipient_email: '',
    subject: '',
    message: '',
    notes: '',
    assigned_to: ''
  });
  
  const [requiredResponseDate, setRequiredResponseDate] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<string>('');
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [signature, setSignature] = useState<string | null>(null);
  const [signatureRequired, setSignatureRequired] = useState(false);
  const [selectedCCUsers, setSelectedCCUsers] = useState<string[]>([]);
  const documentUploadService = new DocumentUploadService();

  // Auto-fill project data when dialog opens
  useEffect(() => {
    if (open && currentProject && profile && user) {
      if (isReply) {
        // Pre-fill for reply
        setFormData(prev => ({
          ...prev,
          rfi_type: 'General Correspondence', // Reply defaults to General Correspondence
          recipient_name: replyToRFI.raised_by_profile?.name || '',
          subject: `Re: ${replyToRFI.subject || 'RFI Response'}`,
          message: '',
          notes: ''
        }));
      } else {
        // Reset for new RFI
        setFormData({
          rfi_type: 'General Correspondence',
          priority: 'medium',
          recipient_name: '',
          recipient_email: '',
          subject: '',
          message: '',
          notes: '',
          assigned_to: ''
        });
        setRequiredResponseDate(undefined);
        setSelectedRecipient('');
        setAttachmentFiles([]);
        setSignature(null);
        setSignatureRequired(false);
      }
    }
  }, [open, currentProject, profile, user, isReply, replyToRFI]);

  // Handle recipient selection
  const handleRecipientChange = (value: string) => {
    setSelectedRecipient(value);
    const member = teamMembers.find(m => m.user_id === value);
    if (member) {
      setFormData(prev => ({
        ...prev,
        recipient_name: member.user_profile?.name || '',
        recipient_email: '', // Would need to get from auth if available
        assigned_to: value
      }));
    }
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    if (!formData.subject && !isDraft) return;

    // Check response requirement based on RFI type
    const isResponseRequired = formData.rfi_type === 'Request for Information';
    
    // For new RFIs: message is always required unless saving as draft, response date required only for "Request for Information"
    if (!isReply && !isDraft) {
      if (!formData.message) return;
      if (isResponseRequired && !requiredResponseDate) return;
    }

    // For replies, require message/notes unless saving as draft
    if (isReply && !formData.message && !isDraft) return;

    setLoading(true);
    try {
      if (isReply) {
        // Update existing RFI with response
        await updateRFI(replyToRFI.id, {
          response: formData.message,
          responder_name: profile?.name || '',
          response_date: isDraft ? undefined : new Date().toISOString(),
          status: isDraft ? 'draft' : 'answered',
          signature: signature || undefined,
          cc_list: selectedCCUsers.length > 0 ? selectedCCUsers : undefined
        });
      } else {
        // Create new RFI first
        const isResponseRequired = formData.rfi_type === 'Request for Information';
        
          const rfiResult = await createRFI({
            project_id: projectId,
            question: formData.message,
            priority: formData.priority,
            category: formData.rfi_type, // Map type to category (UI label)
            rfi_type:
              formData.rfi_type === 'General Correspondence'
                ? 'general_correspondence'
                : formData.rfi_type === 'General Advice'
                ? 'general_advice'
                : 'request_for_information',
            assigned_to: formData.assigned_to,
            due_date: isResponseRequired ? requiredResponseDate?.toISOString() : undefined,
            project_name: currentProject?.name || '',
            recipient_name: formData.recipient_name,
            recipient_email: formData.recipient_email,
            sender_name: profile?.name || '',
            sender_email: user?.email || '',
            subject: formData.subject,
            required_response_by: isResponseRequired ? requiredResponseDate?.toISOString() : undefined,
            signature: signature || undefined,
            cc_list: selectedCCUsers
          });

        // Update status if it's a draft
        if (rfiResult && isDraft) {
          await updateRFI(rfiResult.id, {
            status: 'draft'
          });
        }

        // Upload attachments and save to documents if RFI creation was successful
        if (rfiResult && attachmentFiles.length > 0 && user) {
          try {
            const uploadResults = await documentUploadService.uploadFiles(
              attachmentFiles,
              projectId,
              user.id,
              {
                category: 'RFI Attachment',
                visibility: 'project'
              }
            );

            // Store attachment references in RFI
            const attachmentData = uploadResults
              .filter(result => result.status === 'completed')
              .map(result => ({
                document_id: result.document_id,
                name: result.file.name,
                url: result.url,
                type: result.file.type,
                size: result.file.size
              }));

            if (attachmentData.length > 0) {
              // Update RFI with attachment references
              await updateRFI(rfiResult.id, {
                attachments: attachmentData
              });
            }
          } catch (attachmentError) {
            console.error('Error uploading attachments:', attachmentError);
            // RFI is still created, just without attachments
          }
        }
      }

      // Reset form
      setFormData({
        rfi_type: 'General Correspondence',
        priority: 'medium',
        recipient_name: '',
        recipient_email: '',
        subject: '',
        message: '',
        notes: '',
        assigned_to: ''
      });
      setRequiredResponseDate(undefined);
      setSelectedRecipient('');
      setAttachmentFiles([]);
      setSignature(null);
      setSignatureRequired(false);
      setSelectedCCUsers([]);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving RFI:', error);
    } finally {
      setLoading(false);
    }
  };

  const isResponseRequired = formData.rfi_type === 'Request for Information' && !isReply;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isReply ? `Reply to RFI` : 'Create New RFI'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!isReply && (
            <>
              {/* RFI Type */}
              <div>
                <Label htmlFor="rfi-type">Mail Type</Label>
                <Select 
                  value={formData.rfi_type} 
                  onValueChange={(value: RFITypeLabel) => setFormData(prev => ({ ...prev, rfi_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select mail type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General Correspondence">General Correspondence</SelectItem>
                    <SelectItem value="Request for Information">Request for Information</SelectItem>
                    <SelectItem value="General Advice">General Advice</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div>
                <Label htmlFor="priority">Priority *</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value: 'low' | 'medium' | 'high') => setFormData(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Recipient */}
              <div>
                <Label htmlFor="recipient-select">To (Recipient)</Label>
                <Select value={selectedRecipient} onValueChange={handleRecipientChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select recipient" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map(member => (
                      <SelectItem key={member.user_id} value={member.user_id}>
                        {member.user_profile?.name || 'Unknown User'} ({member.user_profile?.role || member.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* CC Selection */}
              <div className="space-y-2">
                <Label>CC</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {selectedCCUsers.length > 0
                        ? `${selectedCCUsers.length} user${selectedCCUsers.length > 1 ? 's' : ''} selected`
                        : "Select CC recipients"}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search team members..." />
                      <CommandEmpty>No team members found.</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-auto">
                        {teamMembers
                          .filter(member => {
                            const excludeId = isReply ? (replyToRFI?.assigned_to || replyToRFI?.raised_by) : selectedRecipient;
                            return member.user_id !== excludeId && member.user_id !== formData.assigned_to;
                          })
                          .map(member => (
                            <CommandItem
                              key={member.user_id}
                              value={`${member.user_profile?.name || 'Unknown User'} ${member.user_profile?.role || member.role}`}
                              onSelect={() => {
                                if (selectedCCUsers.includes(member.user_id)) {
                                  setSelectedCCUsers(prev => prev.filter(id => id !== member.user_id));
                                } else {
                                  setSelectedCCUsers(prev => [...prev, member.user_id]);
                                }
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  selectedCCUsers.includes(member.user_id) ? "opacity-100" : "opacity-0"
                                }`}
                              />
                              {member.user_profile?.name || 'Unknown User'} ({member.user_profile?.role || member.role})
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
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
                            <X
                              className="ml-1 h-3 w-3 cursor-pointer hover:text-destructive"
                              onClick={() => {
                                setSelectedCCUsers(prev => prev.filter(id => id !== userId));
                              }}
                            />
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Response Date (only for Request for Information) */}
              {isResponseRequired && (
                <div>
                  <Label>Required Response By *</Label>
                  
                  {/* Quick Date Selectors */}
                  <div className="flex gap-2 mb-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const date = new Date();
                        date.setDate(date.getDate() + 1);
                        setRequiredResponseDate(date);
                      }}
                    >
                      1 Day
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const date = new Date();
                        date.setDate(date.getDate() + 2);
                        setRequiredResponseDate(date);
                      }}
                    >
                      2 Days
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const date = new Date();
                        date.setDate(date.getDate() + 3);
                        setRequiredResponseDate(date);
                      }}
                    >
                      3 Days
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const date = new Date();
                        date.setDate(date.getDate() + 7);
                        setRequiredResponseDate(date);
                      }}
                    >
                      1 Week
                    </Button>
                  </div>

                  {/* Calendar Picker */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button 
                        variant="outline" 
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !requiredResponseDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {requiredResponseDate ? format(requiredResponseDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar 
                        mode="single" 
                        selected={requiredResponseDate} 
                        onSelect={setRequiredResponseDate} 
                        initialFocus 
                        className="p-3 pointer-events-auto"
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </>
          )}

          {/* Subject */}
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input 
              id="subject" 
              value={formData.subject} 
              onChange={e => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Enter subject line"
              disabled={isReply}
            />
          </div>

          {/* Message */}
          <div>
            <Label htmlFor="message">
              {isReply ? 'Response Message' : 'Message'}
              <span className="text-red-500">*</span>
            </Label>
            <Textarea 
              id="message" 
              placeholder={isReply ? "Enter your response..." : "Enter your message..."}
              value={formData.message} 
              onChange={e => setFormData(prev => ({ ...prev, message: e.target.value }))}
              className="min-h-[120px]" 
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">
              Notes {isReply && <span className="text-red-500">*</span>}
            </Label>
            <Textarea 
              id="notes" 
              placeholder="Additional notes (optional)"
              value={formData.notes} 
              onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="min-h-[80px]" 
            />
          </div>

          {/* Signature Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="add-signature"
                checked={signatureRequired}
                onChange={(e) => setSignatureRequired(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="add-signature" className="text-sm">
                Add my signature to this {isReply ? 'response' : 'RFI'}
              </Label>
            </div>
            
            {signatureRequired && (
              <DigitalSignature
                onSignatureCapture={setSignature}
                label="My Signature"
                required={false}
                disabled={loading}
              />
            )}
          </div>

          {/* Attachments - only for new RFIs */}
          {!isReply && (
            <div>
              <Label>Attachments (Optional)</Label>
              <RFIAttachmentUpload
                onFilesChange={setAttachmentFiles}
                disabled={loading}
              />
            </div>
          )}

        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            variant="outline"
            onClick={() => handleSubmit(true)} 
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save as Draft'}
          </Button>
          <Button 
            onClick={() => handleSubmit(false)} 
            disabled={
              loading || 
              !formData.subject ||
              (!isReply && !formData.message) ||
              (!isReply && formData.rfi_type === 'Request for Information' && !requiredResponseDate) ||
              (isReply && !formData.message)
            }
          >
            {loading ? (isReply ? 'Sending...' : 'Creating...') : (isReply ? 'Send Reply' : 'Send RFI')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};