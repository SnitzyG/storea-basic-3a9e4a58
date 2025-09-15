import React, { useState } from 'react';
import { Archive, Upload, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useDropzone } from 'react-dropzone';
import { Document } from '@/hooks/useDocuments';
import { formatFileSize } from '@/utils/documentUtils';

interface SupersedeDocumentDialogProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
  onSupersede: (documentId: string, newFile: File, changesSummary?: string) => Promise<boolean>;
}

export const SupersedeDocumentDialog: React.FC<SupersedeDocumentDialogProps> = ({
  document,
  isOpen,
  onClose,
  onSupersede
}) => {
  const [newFile, setNewFile] = useState<File | null>(null);
  const [changesSummary, setChangesSummary] = useState('');
  const [isSuperseding, setIsSuperseding] = useState(false);

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setNewFile(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/dwg': ['.dwg']
    }
  });

  const handleSupersede = async () => {
    if (!document || !newFile) return;

    setIsSuperseding(true);
    try {
      const success = await onSupersede(document.id, newFile, changesSummary);
      if (success) {
        handleClose();
      }
    } finally {
      setIsSuperseding(false);
    }
  };

  const handleClose = () => {
    setNewFile(null);
    setChangesSummary('');
    onClose();
  };

  if (!document) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Supersede Document: {document.title || document.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Document Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-muted-foreground" />
                <div>
                  <h4 className="font-medium">Current Document</h4>
                  <p className="text-sm text-muted-foreground">
                    {document.title || document.name} • Rev {String.fromCharCode(64 + (document.version || 1))}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    This document will be archived and replaced with the new version
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <div className="space-y-4">
            <Label>New Document Version</Label>
            
            {!newFile ? (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                {isDragActive ? (
                  <p className="text-lg font-medium">Drop the file here...</p>
                ) : (
                  <div>
                    <p className="text-lg font-medium mb-2">
                      Drag & drop the new version here, or click to select
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Supports: PDF, JPG, PNG, DOCX, XLSX, DWG
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-primary" />
                      <div>
                        <h4 className="font-medium">{newFile.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(newFile.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setNewFile(null)}
                    >
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Changes Summary */}
          <div className="space-y-2">
            <Label htmlFor="changes">Summary of Changes (Optional)</Label>
            <Textarea
              id="changes"
              placeholder="Describe what changes were made in this new version..."
              value={changesSummary}
              onChange={(e) => setChangesSummary(e.target.value)}
              rows={3}
            />
          </div>

          {/* Warning */}
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Archive className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800">Important</h4>
                  <p className="text-sm text-yellow-700">
                    Superseding will archive the current document and replace it with the new version. 
                    The archived document will remain accessible in the document history but will no longer 
                    appear in the main document list.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSupersede}
              disabled={!newFile || isSuperseding}
            >
              {isSuperseding ? 'Superseding...' : 'Supersede Document'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};