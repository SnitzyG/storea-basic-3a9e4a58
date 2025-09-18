import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useRFIs } from '@/hooks/useRFIs';
import { useProjectTeam } from '@/hooks/useProjectTeam';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { RFIAttachmentUpload } from './RFIAttachmentUpload';
import { DocumentUploadService } from '@/services/DocumentUploadService';

interface SimplifiedRFIComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  replyToRFI?: any; // For reply functionality
}

type RFIType = 'General' | 'Request for Information' | 'Advice';

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
    rfi_type: 'General' as RFIType,
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
  const documentUploadService = new DocumentUploadService();

  // Auto-fill project data when dialog opens
  useEffect(() => {
    if (open && currentProject && profile && user) {
      if (isReply) {
        // Pre-fill for reply
        setFormData(prev => ({
          ...prev,
          rfi_type: 'General', // Reply defaults to General
          recipient_name: replyToRFI.raised_by_profile?.name || '',
          subject: `Re: ${replyToRFI.subject || 'RFI Response'}`,
          message: '',
          notes: ''
        }));
      } else {
        // Reset for new RFI
        setFormData({
          rfi_type: 'General',
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

  const handleSubmit = async () => {
    if (!formData.subject) return;

    // Check response requirement based on RFI type
    const isResponseRequired = formData.rfi_type === 'Request for Information';
    
    // For new RFIs: message is always required, response date required only for "Request for Information"
    if (!isReply) {
      if (!formData.message) return;
      if (isResponseRequired && !requiredResponseDate) return;
    }

    // For replies, require message/notes
    if (isReply && !formData.message) return;

    setLoading(true);
    try {
      if (isReply) {
        // Update existing RFI with response
        await updateRFI(replyToRFI.id, {
          response: formData.message,
          responder_name: profile?.name || '',
          response_date: new Date().toISOString(),
          status: 'answered'
        });
      } else {
        // Create new RFI first
        const isResponseRequired = formData.rfi_type === 'Request for Information';
        
        const rfiResult = await createRFI({
          project_id: projectId,
          question: formData.message,
          priority: formData.priority,
          category: formData.rfi_type, // Map type to category
          assigned_to: formData.assigned_to,
          due_date: isResponseRequired ? requiredResponseDate?.toISOString() : undefined,
          project_name: currentProject?.name || '',
          recipient_name: formData.recipient_name,
          recipient_email: formData.recipient_email,
          sender_name: profile?.name || '',
          sender_email: user?.email || '',
          subject: formData.subject,
          required_response_by: isResponseRequired ? requiredResponseDate?.toISOString() : undefined
        });

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
        rfi_type: 'General',
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
                <Label htmlFor="rfi-type">RFI Type</Label>
                <Select 
                  value={formData.rfi_type} 
                  onValueChange={(value: RFIType) => setFormData(prev => ({ ...prev, rfi_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select RFI type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Request for Information">Request for Information</SelectItem>
                    <SelectItem value="Advice">Advice</SelectItem>
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
            onClick={handleSubmit} 
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