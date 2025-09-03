import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRFIs } from '@/hooks/useRFIs';
import { useProjects } from '@/hooks/useProjects';

interface CreateRFIDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export const CreateRFIDialog = ({ open, onOpenChange, projectId }: CreateRFIDialogProps) => {
  const [question, setQuestion] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [category, setCategory] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [loading, setLoading] = useState(false);

  const { createRFI } = useRFIs();
  const { getProjectUsers } = useProjects();
  const [projectUsers, setProjectUsers] = useState<any[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    
    const rfiData = {
      project_id: projectId,
      question: question.trim(),
      priority,
      category: category.trim() || undefined,
      due_date: dueDate || undefined,
      assigned_to: assignedTo || undefined,
    };

    const result = await createRFI(rfiData);
    
    if (result) {
      setQuestion('');
      setCategory('');
      setDueDate('');
      setAssignedTo('');
      setPriority('medium');
      onOpenChange(false);
    }
    
    setLoading(false);
  };

  // Fetch project users when dialog opens
  React.useEffect(() => {
    if (open && projectId) {
      getProjectUsers(projectId).then(setProjectUsers);
    }
  }, [open, projectId, getProjectUsers]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New RFI</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="question">Question *</Label>
            <Textarea
              id="question"
              placeholder="Enter your question or request for information..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="min-h-[100px] mt-1"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="priority">Priority</Label>
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

            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                placeholder="e.g., Structural, Electrical"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="assignedTo">Assign To</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {projectUsers.map((user) => (
                    <SelectItem key={user.user_id} value={user.user_id}>
                      {user.profiles?.name} ({user.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !question.trim()}>
              {loading ? 'Creating...' : 'Create RFI'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};