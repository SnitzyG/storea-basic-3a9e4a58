import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RFI } from '@/hooks/useRFIs';
import { RFIStatusBadge } from './RFIStatusBadge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CalendarDays, User, FileText } from 'lucide-react';

interface RFIResponseComposerProps {
  rfi: RFI;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (responseData: {
    response: string;
    responderName?: string;
    responderPosition?: string;
  }) => Promise<void>;
}

export const RFIResponseComposer = ({ rfi, isOpen, onClose, onSubmit }: RFIResponseComposerProps) => {
  const [response, setResponse] = useState('');
  const [responderName, setResponderName] = useState('');
  const [responderPosition, setResponderPosition] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveAsDraft, setSaveAsDraft] = useState(false);

  const handleSubmit = async (isDraft: boolean = false) => {
    if (!response.trim() && !isDraft) return;
    
    setIsSubmitting(true);
    setSaveAsDraft(isDraft);
    
    try {
      await onSubmit({
        response: response.trim(),
        responderName: responderName.trim() || undefined,
        responderPosition: responderPosition.trim() || undefined,
      });
      
      // Reset form
      setResponse('');
      setResponderName('');
      setResponderPosition('');
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
                <Label htmlFor="responderName">Responder Name (Optional)</Label>
                <Input
                  id="responderName"
                  value={responderName}
                  onChange={(e) => setResponderName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="responderPosition">Position/Title (Optional)</Label>
                <Input
                  id="responderPosition"
                  value={responderPosition}
                  onChange={(e) => setResponderPosition(e.target.value)}
                  placeholder="Your position or title"
                />
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