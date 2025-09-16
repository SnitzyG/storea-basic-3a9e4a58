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
  const { createRFI, updateRFI } = useRFIs(projectId);
  const { teamMembers } = useProjectTeam(projectId);
  const { projects } = useProjects();
  const { profile, user } = useAuth();
  
  const currentProject = projects.find(p => p.id === projectId);
  const isReply = !!replyToRFI;

  const [formData, setFormData] = useState({
    rfi_type: 'General' as RFIType,
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
          recipient_name: '',
          recipient_email: '',
          subject: '',
          message: '',
          notes: '',
          assigned_to: ''
        });
        setRequiredResponseDate(undefined);
        setSelectedRecipient('');
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
    if (!formData.message || !formData.subject) return;

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
          status: 'responded'
        });
      } else {
        // Create new RFI
        const isResponseRequired = formData.rfi_type === 'Request for Information';
        
        await createRFI({
          project_id: projectId,
          question: formData.message,
          priority: 'medium', // Default priority
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
      }

      // Reset form
      setFormData({
        rfi_type: 'General',
        recipient_name: '',
        recipient_email: '',
        subject: '',
        message: '',
        notes: '',
        assigned_to: ''
      });
      setRequiredResponseDate(undefined);
      setSelectedRecipient('');
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
                        {member.user_profile?.name || 'Unknown User'} ({member.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Response Date (only for Request for Information) */}
              {isResponseRequired && (
                <div>
                  <Label>Required Response By</Label>
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
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={
              loading || 
              !formData.message || 
              !formData.subject ||
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