import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Mail, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PendingInvitationsDialog } from './PendingInvitationsDialog';
import { useProjectTeam } from '@/hooks/useProjectTeam';

interface AddTeamMemberDialogProps {
  projectId: string;
  projectName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMemberAdded: (email?: string, role?: string, projectName?: string) => Promise<boolean>;
}

const roleOptions = [
  { value: 'architect', label: 'Architect' },
  { value: 'builder', label: 'Builder' },
  { value: 'contractor', label: 'Contractor' },
  { value: 'homeowner', label: 'Homeowner' },
  { value: 'consultant', label: 'Consultant' },
  { value: 'project_manager', label: 'Project Manager' }
];

export function AddTeamMemberDialog({ projectId, projectName, open, onOpenChange, onMemberAdded }: AddTeamMemberDialogProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPendingInvitations, setShowPendingInvitations] = useState(false);
  const { addMember } = useProjectTeam(projectId);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !role) {
      return;
    }

    if (!validateEmail(email)) {
      return;
    }

    setLoading(true);
    try {
      const success = await addMember(email, role, projectName);
      if (success) {
        setEmail('');
        setRole('');
        onOpenChange(false);
        await onMemberAdded(email, role, projectName);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setRole('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Send an email invitation to add a new member to your project team. They'll receive a secure link to join the project.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Alert className="border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Invitation emails may take a few minutes to arrive. The recipient will need to check their spam folder if they don't receive it.
            </AlertDescription>
          </Alert>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPendingInvitations(true)}
              className="flex-1"
            >
              <Mail className="h-4 w-4 mr-2" />
              View Pending
            </Button>
            <Button
              type="submit"
              disabled={!email || !role || !validateEmail(email) || loading}
              className="flex-1"
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {loading ? 'Sending Invitation...' : 'Send Invitation'}
            </Button>
          </div>
        </form>
      </DialogContent>

      <PendingInvitationsDialog
        projectId={projectId}
        open={showPendingInvitations}
        onOpenChange={setShowPendingInvitations}
      />
    </Dialog>
  );
}