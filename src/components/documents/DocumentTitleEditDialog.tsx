import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Document } from '@/hooks/useDocuments';

interface DocumentTitleEditDialogProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (documentId: string, newTitle: string) => void;
}

export const DocumentTitleEditDialog: React.FC<DocumentTitleEditDialogProps> = ({
  document,
  isOpen,
  onClose,
  onSave
}) => {
  const [title, setTitle] = useState('');

  React.useEffect(() => {
    if (document) {
      setTitle(document.title || document.name);
    }
  }, [document]);

  const handleSave = () => {
    if (document && title.trim()) {
      onSave(document.id, title.trim());
    }
  };

  if (!document) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Document Title</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Document Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter document title"
              autoFocus
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!title.trim()}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};