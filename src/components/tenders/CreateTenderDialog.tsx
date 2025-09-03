import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTenders } from '@/hooks/useTenders';

interface CreateTenderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export const CreateTenderDialog = ({ open, onOpenChange, projectId }: CreateTenderDialogProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [requirements, setRequirements] = useState('');
  const [loading, setLoading] = useState(false);

  const { createTender } = useTenders();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !deadline) return;

    setLoading(true);
    
    const tenderData = {
      project_id: projectId,
      title: title.trim(),
      description: description.trim(),
      budget: budget ? parseFloat(budget) : undefined,
      deadline,
      requirements: requirements.trim() ? { description: requirements.trim() } : {},
    };

    const result = await createTender(tenderData);
    
    if (result) {
      setTitle('');
      setDescription('');
      setBudget('');
      setDeadline('');
      setRequirements('');
      onOpenChange(false);
    }
    
    setLoading(false);
  };

  // Set minimum date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Tender</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter tender title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the work to be done, specifications, and expectations..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px] mt-1"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="budget">Budget (Optional)</Label>
              <Input
                id="budget"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="deadline">Deadline *</Label>
              <Input
                id="deadline"
                type="date"
                min={minDate}
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="mt-1"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="requirements">Additional Requirements</Label>
            <Textarea
              id="requirements"
              placeholder="Any specific requirements, qualifications, or criteria..."
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              className="min-h-[80px] mt-1"
            />
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
            <Button 
              type="submit" 
              disabled={loading || !title.trim() || !description.trim() || !deadline}
            >
              {loading ? 'Creating...' : 'Create Tender'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};