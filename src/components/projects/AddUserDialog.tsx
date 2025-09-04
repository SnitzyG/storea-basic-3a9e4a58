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
      // Check if user already exists with this email
      const { data: existingProfiles } = await supabase
        .from('profiles')
        .select('user_id, name')
        .ilike('name', `%${email}%`);

      let addedSuccessfully = false;

      // If we find an existing user, add them directly
      if (existingProfiles && existingProfiles.length > 0) {
        const existingUser = existingProfiles[0];
        
        // Check if user is already in project
        const { data: existingProjectUser } = await supabase
          .from('project_users')
          .select('id')
          .eq('project_id', projectId)
          .eq('user_id', existingUser.user_id)
          .single();

        if (!existingProjectUser) {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          
          const { error: addError } = await supabase
            .from('project_users')
            .insert({
              project_id: projectId,
              user_id: existingUser.user_id,
              role: role,
              invited_by: currentUser?.id,
              joined_at: new Date().toISOString()
            });

          if (!addError) {
            addedSuccessfully = true;
            toast({
              title: "Team member added",
              description: `${existingUser.name} has been added to the project immediately.`
            });
          }
        } else {
          toast({
            title: "User already in project",
            description: `${existingUser.name} is already a member of this project.`,
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
      }

      // If no existing user found, create pending invitation
      if (!addedSuccessfully) {
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
          title: "Invitation sent",
          description: `${name} will be automatically added when they create an account with ${email}.`
        });
      }

      onUserAdded();
      onOpenChange(false);
      setEmail('');
      setName('');
      setRole('contractor');
      
      // Trigger immediate global update for all components
      window.dispatchEvent(new CustomEvent('teamMembersUpdated', { 
        detail: { projectId } 
      }));
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