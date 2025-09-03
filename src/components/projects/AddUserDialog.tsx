import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, Loader2 } from 'lucide-react';

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onUserAdded: () => void;
}

export const AddUserDialog = ({ open, onOpenChange, projectId, onUserAdded }: AddUserDialogProps) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'homeowner' | 'builder' | 'contractor'>('contractor');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name || !role) return;

    setLoading(true);
    try {
      // For now, we'll create pending invitations since we can't directly query auth.users
      // In a real-world scenario, you'd have a user directory or search API
      const existingUser = null; // Always treat as new user for now

      // Always store as pending invitation (simplified for this demo)
      const { data: currentProject } = await supabase
        .from('projects')
        .select('timeline')
        .eq('id', projectId)
        .single();

      const currentTimeline = (currentProject?.timeline as any) || {};
      const pendingCollaborators = currentTimeline.pending_collaborators || [];

      await supabase
        .from('projects')
        .update({
          timeline: {
            ...currentTimeline,
            pending_collaborators: [...pendingCollaborators, { email, name, role }]
          }
        })
        .eq('id', projectId);

      toast({
        title: "Team member added",
        description: `${name} will be automatically added when they create an account with this email.`
      });

      onUserAdded();
      onOpenChange(false);
      setEmail('');
      setName('');
      setRole('contractor');
      
      // Notify other components about team update
      window.dispatchEvent(new CustomEvent('projectTeamUpdated'));
    } catch (error: any) {
      toast({
        title: "Error adding user",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Team Member
          </DialogTitle>
          <DialogDescription>
            Add a new team member to this project. They'll be automatically notified.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(value: any) => setRole(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="homeowner">Homeowner</SelectItem>
                <SelectItem value="builder">Builder</SelectItem>
                <SelectItem value="contractor">Contractor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Member
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};