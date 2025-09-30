import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DocumentGroup } from '@/hooks/useDocumentGroups';
import { useEnhancedTenders } from '@/hooks/useEnhancedTenders';
import { useToast } from '@/hooks/use-toast';
import { Package } from 'lucide-react';

interface CreateTenderPackageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDocuments: DocumentGroup[];
  projectId: string;
}

export const CreateTenderPackageDialog: React.FC<CreateTenderPackageDialogProps> = ({
  isOpen,
  onClose,
  selectedDocuments,
  projectId
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    total_budget: '',
    package_type: 'general'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { createTenderPackage } = useEnhancedTenders(projectId);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Package name is required",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const packageData = {
        name: formData.name,
        description: formData.description || undefined,
        total_budget: formData.total_budget ? parseFloat(formData.total_budget) : undefined,
        package_type: formData.package_type
      };

      const result = await createTenderPackage(packageData);
      
      if (result) {
        toast({
          title: "Success",
          description: `Tender package "${formData.name}" created with ${selectedDocuments.length} documents`,
        });
        
        // Reset form
        setFormData({
          name: '',
          description: '',
          total_budget: '',
          package_type: 'general'
        });
        
        onClose();
      }
    } catch (error) {
      console.error('Error creating tender package:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Create Tender Package
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted/30 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Creating package with <span className="font-medium">{selectedDocuments.length}</span> selected documents:
            </p>
            <ul className="mt-2 space-y-1">
              {selectedDocuments.slice(0, 3).map((doc) => (
                <li key={doc.id} className="text-xs text-muted-foreground truncate">
                  • {doc.title}
                </li>
              ))}
              {selectedDocuments.length > 3 && (
                <li className="text-xs text-muted-foreground">
                  • and {selectedDocuments.length - 3} more...
                </li>
              )}
            </ul>
          </div>

          <div>
            <Label htmlFor="name">Package Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter package name"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="package_type">Package Type</Label>
            <Select
              value={formData.package_type}
              onValueChange={(value) => setFormData({ ...formData, package_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="construction">Construction</SelectItem>
                <SelectItem value="consulting">Consulting</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="total_budget">Total Budget (Optional)</Label>
            <Input
              id="total_budget"
              type="number"
              value={formData.total_budget}
              onChange={(e) => setFormData({ ...formData, total_budget: e.target.value })}
              placeholder="Enter budget amount"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Package'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};