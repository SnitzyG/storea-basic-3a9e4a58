import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, X } from 'lucide-react';
import { useTenders } from '@/hooks/useTenders';
import { useDocuments } from '@/hooks/useDocuments';

interface CreateTenderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

interface AttachedDocument {
  id: string;
  name: string;
  type: 'existing' | 'upload';
  file?: File;
}

export const CreateTenderDialog = ({ open, onOpenChange, projectId }: CreateTenderDialogProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [beginDate, setBeginDate] = useState('');
  const [submissionDeadline, setSubmissionDeadline] = useState('');
  const [requirements, setRequirements] = useState('');
  const [attachedDocuments, setAttachedDocuments] = useState<AttachedDocument[]>([]);
  const [loading, setLoading] = useState(false);

  const { createTender } = useTenders();
  const { documents } = useDocuments(projectId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !submissionDeadline) return;

    setLoading(true);
    
    const tenderData = {
      project_id: projectId,
      title: title.trim(),
      description: description.trim(),
      budget: budget ? parseFloat(budget) : undefined,
      begin_date: beginDate || undefined,
      deadline: submissionDeadline,
      requirements: requirements.trim() ? { description: requirements.trim() } : {},
      documents: attachedDocuments.map(doc => ({
        id: doc.id,
        name: doc.name,
        type: doc.type
      })),
    };

    const result = await createTender(tenderData);
    
    if (result) {
      setTitle('');
      setDescription('');
      setBudget('');
      setBeginDate('');
      setSubmissionDeadline('');
      setRequirements('');
      setAttachedDocuments([]);
      onOpenChange(false);
    }
    
    setLoading(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files).map(file => ({
        id: `upload-${Date.now()}-${Math.random()}`,
        name: file.name,
        type: 'upload' as const,
        file
      }));
      setAttachedDocuments(prev => [...prev, ...newFiles]);
    }
  };

  const handleSelectExistingDocument = (documentId: string) => {
    const document = documents.find(doc => doc.id === documentId);
    if (document && !attachedDocuments.find(doc => doc.id === documentId)) {
      setAttachedDocuments(prev => [...prev, {
        id: document.id,
        name: document.name,
        type: 'existing' as const
      }]);
    }
  };

  const removeDocument = (id: string) => {
    setAttachedDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];
  
  // Set minimum deadline to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDeadline = tomorrow.toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Tender</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <Label htmlFor="beginDate">Begin Date</Label>
              <Input
                id="beginDate"
                type="date"
                min={today}
                value={beginDate}
                onChange={(e) => setBeginDate(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="submissionDeadline">Submission Deadline *</Label>
              <Input
                id="submissionDeadline"
                type="date"
                min={minDeadline}
                value={submissionDeadline}
                onChange={(e) => setSubmissionDeadline(e.target.value)}
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

          <div className="space-y-4">
            <Label>Documents</Label>
            
            {/* File Upload */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label htmlFor="file-upload" className="cursor-pointer">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                        <Upload className="w-4 h-4" />
                        Upload new documents
                      </div>
                    </Label>
                    <Input
                      id="file-upload"
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                  
                  <Separator orientation="vertical" className="h-8" />
                  
                  <div className="flex-1">
                    <Select onValueChange={handleSelectExistingDocument}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select existing document" />
                      </SelectTrigger>
                      <SelectContent>
                        {documents
                          .filter(doc => !attachedDocuments.find(attached => attached.id === doc.id))
                          .map(doc => (
                            <SelectItem key={doc.id} value={doc.id}>
                              {doc.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attached Documents */}
            {attachedDocuments.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Attached Documents</Label>
                    {attachedDocuments.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span className="text-sm">{doc.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({doc.type === 'existing' ? 'Existing' : 'Upload'})
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDocument(doc.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
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
              disabled={loading || !title.trim() || !description.trim() || !submissionDeadline}
            >
              {loading ? 'Creating...' : 'Create Tender'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};