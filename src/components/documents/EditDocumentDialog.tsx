import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Document } from '@/hooks/useDocuments';
import { DocumentGroup } from '@/hooks/useDocumentGroups';
import { X } from 'lucide-react';

interface EditDocumentDialogProps {
  document: DocumentGroup | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (groupId: string, updates: any) => Promise<boolean>;
}

export const EditDocumentDialog: React.FC<EditDocumentDialogProps> = ({
  document,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'For Information' as Document['status'],
    fileType: 'Architectural',
    tags: [] as string[],
    isPrivate: false
  });
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (document) {
      setFormData({
        title: document.title || '',
        description: '',
        status: document.status as any,
        fileType: document.category || 'Architectural',
        tags: [],
        isPrivate: document.visibility_scope === 'private'
      });
      setNewTag('');
    }
  }, [document]);

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSave = async () => {
    if (!document) return;
    setLoading(true);
    try {
      // Update metadata only (version upload functionality removed)
      const success = await onSave(document.id, {
        title: formData.title,
        category: formData.fileType,
        status: formData.status,
        visibility_scope: formData.isPrivate ? 'private' : 'project'
      });
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Error updating document:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!document) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Document</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input 
              id="title" 
              value={formData.title} 
              onChange={e => setFormData(prev => ({
                ...prev,
                title: e.target.value
              }))} 
              placeholder="Enter document title" 
            />
          </div>

          {/* Description */}
          

          {/* Status and Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={value => setFormData(prev => ({
                  ...prev,
                  status: value as Document['status']
                }))}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="For Tender">For Tender</SelectItem>
                  <SelectItem value="For Information">For Information</SelectItem>
                  <SelectItem value="For Construction">For Construction</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fileType">Category</Label>
              <Select 
                value={formData.fileType} 
                onValueChange={value => setFormData(prev => ({
                  ...prev,
                  fileType: value
                }))}
              >
                <SelectTrigger id="fileType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Architectural">Architectural</SelectItem>
                  <SelectItem value="Structural">Structural</SelectItem>
                  <SelectItem value="Permit">Permit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          

          {/* Privacy Toggle */}
          

        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};