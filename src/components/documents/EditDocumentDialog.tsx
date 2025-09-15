import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Document, useDocuments } from '@/hooks/useDocuments';
import { Upload, X } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
interface EditDocumentDialogProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
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
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);
  const {
    createNewVersion
  } = useDocuments();
  useEffect(() => {
    if (document) {
      setFormData({
        title: document.title || document.name,
        description: '',
        // Add description field to Document interface if needed
        status: document.status,
        fileType: document.category || 'Architectural',
        tags: document.tags || [],
        isPrivate: document.visibility_scope === 'private'
      });
    }
  }, [document]);
  const {
    getRootProps,
    getInputProps,
    isDragActive
  } = useDropzone({
    onDrop: acceptedFiles => {
      if (acceptedFiles.length > 0) {
        setNewFile(acceptedFiles[0]);
      }
    },
    maxFiles: 1,
    multiple: false
  });
  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };
  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };
  const handleSave = async () => {
    if (!document) return;
    setLoading(true);
    try {
      // If there's a new file, create a new version
      if (newFile) {
        await createNewVersion(document.id, newFile, 'Updated document');
      }

      // Update metadata (this function would need to be implemented in useDocuments)
      // await updateDocumentMetadata(document.id, {
      //   title: formData.title,
      //   status: formData.status,
      //   file_type_category: formData.fileType,
      //   tags: formData.tags,
      //   visibility_scope: formData.isPrivate ? 'private' : 'project'
      // });

      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating document:', error);
    } finally {
      setLoading(false);
    }
  };
  if (!document) return null;
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Document</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={formData.title} onChange={e => setFormData(prev => ({
            ...prev,
            title: e.target.value
          }))} placeholder="Enter document title" />
          </div>

          {/* Description */}
          

          {/* Status and Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={value => setFormData(prev => ({
              ...prev,
              status: value as Document['status']
            }))}>
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
              <Select value={formData.fileType} onValueChange={value => setFormData(prev => ({
              ...prev,
              fileType: value
            }))}>
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
          

          {/* New Version Upload */}
          <div className="space-y-2">
            <Label>Upload New Version (Optional)</Label>
            <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}>
              <input {...getInputProps()} />
              <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              {newFile ? <p className="text-sm font-medium">{newFile.name}</p> : isDragActive ? <p className="text-sm">Drop the file here...</p> : <p className="text-sm text-muted-foreground">
                  Drag & drop a file here, or click to select
                </p>}
            </div>
            {newFile && <Button variant="outline" size="sm" onClick={() => setNewFile(null)}>
                <X className="h-4 w-4 mr-2" />
                Remove File
              </Button>}
          </div>
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
    </Dialog>;
};