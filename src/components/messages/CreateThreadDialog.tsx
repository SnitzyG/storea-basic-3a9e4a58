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
import { useProjectTeam } from '@/hooks/useProjectTeam';

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
  
  const { teamMembers: projectUsers } = useProjectTeam(projectId);

  const addParticipant = () => {
    if (participantEmail.trim() && !participants.includes(participantEmail.trim())) {
      setParticipants([...participants, participantEmail.trim()]);
      setParticipantEmail('');
    }
  };

  const removeParticipant = (participantId: string) => {
    setParticipants(participants.filter(p => p !== participantId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (participants.length === 0) {
      alert('Please select at least one participant from the project team.');
      return;
    }

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
            
            {/* Project Users List */}
            {projectUsers.length > 0 && (
              <div className="border rounded-lg p-2 max-h-40 overflow-y-auto">
                <p className="text-xs text-muted-foreground mb-2">Project Team Members:</p>
                <div className="space-y-1">
                  {projectUsers.map((user) => (
                    <div
                      key={user.user_id}
                      className="flex items-center justify-between p-1 rounded hover:bg-muted/50 cursor-pointer"
                      onClick={() => {
                        if (!participants.includes(user.user_id)) {
                          setParticipants([...participants, user.user_id]);
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs">
                            {user.user_profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{user.user_profile?.name || 'Unknown User'}</p>
                          <p className="text-xs text-muted-foreground capitalize">{user.user_profile?.role || user.role}</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!participants.includes(user.user_id)) {
                            setParticipants([...participants, user.user_id]);
                          }
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            
            {participants.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {participants.map((participantId) => {
                  const user = projectUsers.find(u => u.user_id === participantId);
                  const displayName = user?.user_profile?.name || (
                    // For manual entries, show the email/name as entered
                    participantId.includes('@') ? participantId : `User ${participantId.slice(0, 8)}`
                  );
                  
                  return (
                    <Badge key={participantId} variant="secondary" className="flex items-center gap-1">
                      {displayName}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => removeParticipant(participantId)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  );
                })}
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