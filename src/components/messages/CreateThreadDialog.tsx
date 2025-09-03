import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useProjects } from '@/hooks/useProjects';

interface CreateThreadDialogProps {
  projectId: string;
  onCreateThread: (title: string, participants: string[]) => Promise<void>;
  children: React.ReactNode;
}

export const CreateThreadDialog: React.FC<CreateThreadDialogProps> = ({
  projectId,
  onCreateThread,
  children
}) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [participantEmail, setParticipantEmail] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { getProjectUsers } = useProjects();

  const addParticipant = () => {
    if (participantEmail && !participants.includes(participantEmail)) {
      setParticipants([...participants, participantEmail]);
      setParticipantEmail('');
    }
  };

  const removeParticipant = (email: string) => {
    setParticipants(participants.filter(p => p !== email));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      await onCreateThread(title, participants);
      setTitle('');
      setParticipants([]);
      setParticipantEmail('');
      setOpen(false);
    } catch (error) {
      console.error('Error creating thread:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Thread</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Thread Title</Label>
            <Input
              id="title"
              placeholder="Enter thread title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="participants">Add Participants</Label>
            <div className="flex gap-2">
              <Input
                id="participants"
                placeholder="Enter email address..."
                value={participantEmail}
                onChange={(e) => setParticipantEmail(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addParticipant();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addParticipant}
                disabled={!participantEmail}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {participants.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {participants.map((email) => (
                  <Badge key={email} variant="secondary" className="flex items-center gap-1">
                    {email}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => removeParticipant(email)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || loading}>
              {loading ? 'Creating...' : 'Create Thread'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};