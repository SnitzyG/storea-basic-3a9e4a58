import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Mail } from 'lucide-react';
import { Tender } from '@/hooks/useTenders';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TenderInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tender: Tender | null;
}

export const TenderInviteDialog = ({ open, onOpenChange, tender }: TenderInviteDialogProps) => {
  const [emails, setEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const addEmail = () => {
    const email = newEmail.trim().toLowerCase();
    if (email && email.includes('@') && !emails.includes(email)) {
      setEmails([...emails, email]);
      setNewEmail('');
    }
  };

  const removeEmail = (emailToRemove: string) => {
    setEmails(emails.filter(email => email !== emailToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEmail();
    }
  };

  const handleSendInvitations = async () => {
    if (!tender || emails.length === 0) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-tender-invitation', {
        body: {
          tender_id: tender.id,
          recipient_emails: emails,
          message: message.trim() || undefined
        }
      });

      if (error) throw error;

      toast({
        title: "Invitations Sent",
        description: `Successfully sent ${data.sent} invitation(s) to potential bidders.`,
      });

      // Reset form
      setEmails([]);
      setMessage('');
      onOpenChange(false);

    } catch (error: any) {
      console.error('Error sending invitations:', error);
      toast({
        title: "Error",
        description: "Failed to send invitations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!tender) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Invite Bidders - {tender.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tender Info */}
          <div className="bg-muted/50 p-3 rounded-md">
            <h4 className="font-medium mb-1">{tender.title}</h4>
            <p className="text-sm text-muted-foreground">
              Deadline: {new Date(tender.deadline).toLocaleDateString()}
            </p>
            {tender.budget && (
              <p className="text-sm text-muted-foreground">
                Budget: ${tender.budget.toLocaleString()}
              </p>
            )}
          </div>

          {/* Email Input */}
          <div>
            <Label htmlFor="email">Invite Email Addresses</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="email"
                type="email"
                placeholder="Enter email address..."
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={addEmail}
                disabled={!newEmail.trim() || !newEmail.includes('@')}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Press Enter or click + to add each email address
            </p>
          </div>

          {/* Email List */}
          {emails.length > 0 && (
            <div>
              <Label>Recipients ({emails.length})</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {emails.map((email) => (
                  <Badge key={email} variant="secondary" className="flex items-center gap-1">
                    {email}
                    <X 
                      className="w-3 h-3 cursor-pointer hover:text-destructive" 
                      onClick={() => removeEmail(email)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Personal Message */}
          <div>
            <Label htmlFor="message">Personal Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a personal message to the invitation..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[100px] mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              This message will be included in the invitation email
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>How it works:</strong> Recipients will receive an email with tender details and a secure link. 
              If they don't have an account, they'll be guided through creating one to access the platform and submit bids.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendInvitations}
              disabled={loading || emails.length === 0}
            >
              {loading ? 'Sending...' : `Send ${emails.length} Invitation${emails.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};