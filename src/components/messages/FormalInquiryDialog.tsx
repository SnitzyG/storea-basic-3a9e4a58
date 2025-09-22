import React, { useState, useEffect } from 'react';
import { CheckSquare, Square, User, Calendar, Send, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender_profile?: {
    name: string;
    role: string;
  };
  attachments?: any[];
}

interface FormalInquiryDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (inquiryData: {
    selectedMessages: string[];
    assignedTo: string;
    subject: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    dueDate?: string;
  }) => Promise<void>;
  messages: Message[];
  projectUsers: any[];
  currentUserId?: string;
  companyName?: string;
}

export const FormalInquiryDialog: React.FC<FormalInquiryDialogProps> = ({
  open,
  onClose,
  onSubmit,
  messages,
  projectUsers,
  currentUserId,
  companyName = 'COMPANY'
}) => {
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [dueDate, setDueDate] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Generate RFI number preview
  const generateRFINumber = () => {
    const companyCode = companyName.substring(0, 3).toUpperCase();
    // This would normally come from a sequence, but for preview we'll use a placeholder
    return `${companyCode}-MES-0001`;
  };

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedMessages(new Set());
      setAssignedTo('');
      setSubject('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
    }
  }, [open]);

  // Filter out messages from current user to avoid self-assignment
  const assignableUsers = projectUsers.filter(user => user.user_id !== currentUserId);

  const handleMessageToggle = (messageId: string) => {
    const newSelected = new Set(selectedMessages);
    if (newSelected.has(messageId)) {
      newSelected.delete(messageId);
    } else {
      newSelected.add(messageId);
    }
    setSelectedMessages(newSelected);
  };

  const handleSubmit = async () => {
    if (!assignedTo || !subject.trim() || selectedMessages.size === 0) return;

    setSubmitting(true);
    try {
      await onSubmit({
        selectedMessages: Array.from(selectedMessages),
        assignedTo,
        subject,
        description,
        priority,
        dueDate: dueDate || undefined,
      });
      onClose();
    } catch (error) {
      console.error('Error creating formal inquiry:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Get recent messages (last 20)
  const recentMessages = messages.slice(-20).reverse();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Create Formal Inquiry
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex gap-6 overflow-hidden min-h-[600px]">
          {/* Left Panel - Message Selection */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="mb-4">
              <Label className="text-sm font-medium">Select Messages to Include</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Choose relevant messages that form the basis of your inquiry
              </p>
            </div>

            <Card className="flex-1 overflow-hidden">
              <CardContent className="p-4 h-full">
                <ScrollArea className="h-full">
                  <div className="space-y-3">
                    {recentMessages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex gap-3 p-3 rounded-lg cursor-pointer transition-colors border",
                          selectedMessages.has(message.id)
                            ? "bg-primary/10 border-primary"
                            : "bg-muted/20 border-border hover:bg-muted/40"
                        )}
                        onClick={() => handleMessageToggle(message.id)}
                      >
                        <div className="flex-shrink-0 mt-1">
                          {selectedMessages.has(message.id) ? (
                            <CheckSquare className="h-4 w-4 text-primary" />
                          ) : (
                            <Square className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {message.sender_profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium">
                              {message.sender_profile?.name || 'Unknown'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(message.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-foreground line-clamp-3">
                            {message.content}
                          </p>
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2">
                              <Badge variant="secondary" className="text-xs">
                                {message.attachments.length} attachment(s)
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <div className="mt-3 text-xs text-muted-foreground">
              {selectedMessages.size} message(s) selected
            </div>
          </div>

          <Separator orientation="vertical" className="h-full" />

          {/* Right Panel - RFI Details */}
          <div className="w-96 flex flex-col min-h-[600px]">
            {/* RFI Number Preview */}
            <div className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <Label className="text-sm font-medium">RFI Number</Label>
              <div className="text-lg font-mono text-primary mt-1">
                {generateRFINumber()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {companyName} - MES - Auto-generated
              </p>
            </div>

            <div className="space-y-4 flex-1">
              {/* Assignment */}
              <div>
                <Label className="text-sm font-medium">Assign To *</Label>
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {assignableUsers.map((user) => (
                      <SelectItem key={user.user_id} value={user.user_id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-4 w-4">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {user.user_profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span>{user.user_profile?.name || 'Unknown'}</span>
                          <Badge variant="outline" className="text-xs">
                            {user.user_profile?.role || user.role}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subject */}
              <div>
                <Label className="text-sm font-medium">Subject *</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief description of the inquiry"
                  className="mt-1"
                />
              </div>

              {/* Priority */}
              <div>
                <Label className="text-sm font-medium">Priority</Label>
                <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Due Date */}
              <div>
                <Label className="text-sm font-medium">Response Required By (Optional)</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="mt-1"
                />
              </div>

              {/* Additional Description */}
              <div>
                <Label className="text-sm font-medium">Additional Details</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Any additional context or requirements..."
                  className="mt-1 resize-none"
                  rows={4}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!assignedTo || !subject.trim() || selectedMessages.size === 0 || submitting}
                className="flex-1"
              >
                {submitting ? 'Creating...' : 'Create RFI'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};