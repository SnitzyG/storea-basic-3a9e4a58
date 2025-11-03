import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Archive, Trash2, Mail, FileDown, CheckSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BulkProjectActionsProps {
  selectedProjects: string[];
  onClearSelection: () => void;
  onBulkStatusChange: (projectIds: string[], status: string) => Promise<void>;
  onBulkArchive: (projectIds: string[]) => Promise<void>;
  onBulkDelete: (projectIds: string[]) => Promise<void>;
  onBulkExport: (projectIds: string[], format: 'csv' | 'pdf') => void;
}

export const BulkProjectActions: React.FC<BulkProjectActionsProps> = ({
  selectedProjects,
  onClearSelection,
  onBulkStatusChange,
  onBulkArchive,
  onBulkDelete,
  onBulkExport
}) => {
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<string>('');

  if (selectedProjects.length === 0) return null;

  const handleBulkStatusChange = async () => {
    if (!bulkStatus) {
      toast({
        title: "No status selected",
        description: "Please select a status to apply",
        variant: "destructive"
      });
      return;
    }

    try {
      await onBulkStatusChange(selectedProjects, bulkStatus);
      toast({
        title: "Status updated",
        description: `${selectedProjects.length} project(s) status updated successfully`
      });
      onClearSelection();
      setBulkStatus('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update project statuses",
        variant: "destructive"
      });
    }
  };

  const handleBulkArchive = async () => {
    try {
      await onBulkArchive(selectedProjects);
      toast({
        title: "Projects archived",
        description: `${selectedProjects.length} project(s) archived successfully`
      });
      onClearSelection();
      setShowArchiveDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to archive projects",
        variant: "destructive"
      });
    }
  };

  const handleBulkDelete = async () => {
    try {
      await onBulkDelete(selectedProjects);
      toast({
        title: "Projects deleted",
        description: `${selectedProjects.length} project(s) deleted successfully`
      });
      onClearSelection();
      setShowDeleteDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete projects",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Card className="p-4 bg-primary/5 border-primary/20">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            <span className="font-medium">
              {selectedProjects.length} project{selectedProjects.length !== 1 ? 's' : ''} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Bulk Status Change */}
            <div className="flex gap-2">
              <Select value={bulkStatus} onValueChange={setBulkStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Change status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              {bulkStatus && (
                <Button size="sm" onClick={handleBulkStatusChange}>
                  Apply
                </Button>
              )}
            </div>

            {/* Export Options */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => onBulkExport(selectedProjects, 'csv')}
            >
              <FileDown className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onBulkExport(selectedProjects, 'pdf')}
            >
              <FileDown className="h-4 w-4 mr-2" />
              PDF
            </Button>

            {/* Archive */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowArchiveDialog(true)}
            >
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </Button>

            {/* Delete */}
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>

            {/* Clear Selection */}
            <Button size="sm" variant="ghost" onClick={onClearSelection}>
              Clear
            </Button>
          </div>
        </div>
      </Card>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Projects</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive {selectedProjects.length} project(s)? 
              They will be moved to cancelled status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkArchive}>Archive</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Projects</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete {selectedProjects.length} project(s)? 
              This action cannot be undone. All project data, documents, and activities will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
