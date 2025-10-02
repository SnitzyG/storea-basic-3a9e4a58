import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RFI } from '@/hooks/useRFIs';
import { RFIStatusBadge, EnhancedRFIStatus } from './RFIStatusBadge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CalendarDays, User, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProjectTeam } from '@/hooks/useProjectTeam';
import { RFIAttachmentUpload } from './RFIAttachmentUpload';
import { DigitalSignature } from '@/components/ui/digital-signature';

interface RFIResponseComposerProps {
  rfi: RFI;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (responseData: {
    response: string;
    responderName?: string;
    responderPosition?: string;
    status?: EnhancedRFIStatus;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    attachments?: File[];
    signature?: string;
    cc_list?: string[];
  }) => Promise<void>;
}

export const RFIResponseComposer = ({ rfi, isOpen, onClose, onSubmit }: RFIResponseComposerProps) => {
  const { profile } = useAuth();
  const { teamMembers } = useProjectTeam(rfi.project_id);
  const [response, setResponse] = useState('');
  const [responderName, setResponderName] = useState('');
  const [responderPosition, setResponderPosition] = useState('');
  const [newStatus, setNewStatus] = useState<EnhancedRFIStatus>(rfi.status as EnhancedRFIStatus);
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | 'critical'>(rfi.priority);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveAsDraft, setSaveAsDraft] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [signature, setSignature] = useState<string | null>(null);
  const [signatureRequired, setSignatureRequired] = useState(false);
  const [selectedCCUsers, setSelectedCCUsers] = useState<string[]>([]);

  // Auto-populate responder details from user profile when dialog opens
  useEffect(() => {
    if (isOpen && profile) {
      setResponderName(profile.name || '');
      setResponderPosition(profile.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : '');
    }
  }, [isOpen, profile]);

  const handleSubmit = async (isDraft: boolean = false) => {
    if (!response.trim() && !isDraft) return;
    
    setIsSubmitting(true);
    setSaveAsDraft(isDraft);
    
    try {
      await onSubmit({
        response: response.trim(),
        responderName: responderName.trim() || undefined,
        responderPosition: responderPosition.trim() || undefined,
        status: newStatus,
        priority: newPriority,
        attachments: attachments.length > 0 ? attachments : undefined,
        signature: signature || undefined,
        cc_list: selectedCCUsers.length > 0 ? selectedCCUsers : undefined,
      });
      
      // Reset form
      setResponse('');
      setResponderName('');
      setResponderPosition('');
      setAttachments([]);
      setSignature(null);
      setSignatureRequired(false);
      setSelectedCCUsers([]);
    } catch (error) {
      console.error('Failed to submit response:', error);
    } finally {
      setIsSubmitting(false);
      setSaveAsDraft(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Create Response - RFI {rfi.rfi_number || rfi.id.slice(0, 8)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Original RFI Summary */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Original RFI</h3>
              <div className="flex items-center gap-2">
                <RFIStatusBadge status={rfi.status} />
                <Badge variant="outline" className="text-xs">
                  {rfi.priority}
                </Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">From:</span>
                  <span>{rfi.raised_by_profile?.name || rfi.sender_name || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Created:</span>
                  <span>{formatDate(rfi.created_at)}</span>
                </div>
              </div>
              <div className="space-y-2">
                {rfi.assigned_to_profile?.name && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">To:</span>
                    <span>{rfi.assigned_to_profile.name}</span>
                  </div>
                )}
                {rfi.due_date && (
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Due:</span>
                    <span>{formatDate(rfi.due_date)}</span>
                  </div>
                )}
              </div>
            </div>

            {rfi.subject && (
              <div>
                <span className="font-medium text-sm">Subject:</span>
                <p className="text-sm mt-1">{rfi.subject}</p>
              </div>
            )}

            <div>
              <span className="font-medium text-sm">Question:</span>
              <p className="text-sm mt-1 bg-background rounded p-3 border">
                {rfi.question}
              </p>
            </div>

            {rfi.proposed_solution && (
              <div>
                <span className="font-medium text-sm">Proposed Solution:</span>
                <p className="text-sm mt-1 bg-background rounded p-3 border">
                  {rfi.proposed_solution}
                </p>
              </div>
            )}
          </div>

          {/* Response Form */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Your Response</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="responderName">Responder Name</Label>
                <Input
                  id="responderName"
                  value={responderName}
                  onChange={(e) => setResponderName(e.target.value)}
                  placeholder="Your name"
                />
                <p className="text-xs text-muted-foreground">
                  Auto-populated from your profile
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="responderPosition">Position/Title</Label>
                <Input
                  id="responderPosition"
                  value={responderPosition}
                  onChange={(e) => setResponderPosition(e.target.value)}
                  placeholder="Your position or title"
                />
                <p className="text-xs text-muted-foreground">
                  Auto-populated from your profile role
                </p>
              </div>
            </div>

            {/* Status and Priority Updates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Update Status</Label>
                <Select value={newStatus} onValueChange={(value: EnhancedRFIStatus) => setNewStatus(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="outstanding">Outstanding</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="answered">Answered</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Update Priority</Label>
                <Select value={newPriority} onValueChange={(value: 'low' | 'medium' | 'high' | 'critical') => setNewPriority(value)}>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="response">Response *</Label>
              <Textarea
                id="response"
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Provide your detailed response to the RFI..."
                className="min-h-[200px]"
                required
              />
              <p className="text-xs text-muted-foreground">
                Provide a clear and comprehensive response addressing the question or request.
              </p>
            </div>


            {/* Attachments */}
            <div className="space-y-2">
              <Label>Attachments (Optional)</Label>
              <RFIAttachmentUpload 
                onFilesChange={setAttachments}
                disabled={isSubmitting}
              />
            </div>

            {/* CC Selection */}
            <div className="space-y-2">
              <Label>CC (Carbon Copy)</Label>
              <div className="max-h-32 overflow-y-auto border rounded-md p-2 space-y-1">
                {teamMembers
                  .filter(member => member.user_id !== rfi.raised_by && member.user_id !== rfi.assigned_to)
                  .map(member => (
                    <div 
                      key={member.user_id} 
                      className={`flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-muted ${
                        selectedCCUsers.includes(member.user_id) ? 'bg-primary/10' : ''
                      }`}
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
                {teamMembers.filter(m => m.user_id !== rfi.raised_by && m.user_id !== rfi.assigned_to).length === 0 && (
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

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting || !response.trim()}
              >
                {isSubmitting && saveAsDraft ? 'Saving...' : 'Save Draft'}
              </Button>
              <Button
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting || !response.trim()}
              >
                {isSubmitting && !saveAsDraft ? 'Submitting...' : 'Submit Response'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};