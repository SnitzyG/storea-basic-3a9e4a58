import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRFIs } from '@/hooks/useRFIs';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';

interface RFIMessageComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  linkedRFI?: any; // RFI to link the message to
}

export const RFIMessageComposer: React.FC<RFIMessageComposerProps> = ({
  open,
  onOpenChange,
  projectId,
  linkedRFI
}) => {
  const { createRFI } = useRFIs();
  const { profile, user } = useAuth();
  const { projects } = useProjects();
  
  const currentProject = projects.find(p => p.id === projectId);

  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);

  // Auto-populate subject from linked RFI
  useEffect(() => {
    if (open && linkedRFI) {
      setFormData(prev => ({
        ...prev,
        subject: linkedRFI.subject || `Message regarding RFI ${linkedRFI.rfi_number || linkedRFI.id.slice(0, 8)}`
      }));
    }
  }, [open, linkedRFI]);

  const handleSubmit = async () => {
    if (!formData.subject || !formData.message) return;

    setLoading(true);
    try {
      // Create new RFI/message linked to existing RFI
      await createRFI({
        project_id: projectId,
        question: formData.message,
        priority: 'medium',
        category: 'General', // Message defaults to General
        rfi_type: 'general_correspondence',
        project_name: currentProject?.name || '',
        sender_name: profile?.name || '',
        sender_email: user?.email || '',
        subject: formData.subject,
        // Link to original RFI if provided
        ...(linkedRFI && {
          other_reference: `Related to RFI ${linkedRFI.rfi_number || linkedRFI.id.slice(0, 8)}`
        })
      });

      // Reset form
      setFormData({
        subject: '',
        message: '',
        notes: ''
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating message:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {linkedRFI ? 'New Message for RFI' : 'New Message'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {linkedRFI && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Linked to: <span className="font-medium">{linkedRFI.subject || 'RFI'}</span>
              </p>
            </div>
          )}

          {/* Subject */}
          <div>
            <Label htmlFor="subject">
              Subject <span className="text-red-500">*</span>
            </Label>
            <Input 
              id="subject" 
              value={formData.subject} 
              onChange={e => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Enter subject line"
            />
          </div>

          {/* Message */}
          <div>
            <Label htmlFor="message">
              Message <span className="text-red-500">*</span>
            </Label>
            <Textarea 
              id="message" 
              placeholder="Enter your message..."
              value={formData.message} 
              onChange={e => setFormData(prev => ({ ...prev, message: e.target.value }))}
              className="min-h-[120px]" 
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
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
            disabled={loading || !formData.subject || !formData.message}
          >
            {loading ? 'Sending...' : 'Send Message'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};