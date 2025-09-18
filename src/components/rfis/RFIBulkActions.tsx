import React, { useState } from 'react';
import { 
  CheckSquare, 
  Square, 
  Trash2, 
  UserX, 
  CheckCircle, 
  Archive,
  AlertTriangle,
  Calendar,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RFI } from '@/hooks/useRFIs';
import { useToast } from '@/hooks/use-toast';

interface RFIBulkActionsProps {
  rfis: RFI[];
  selectedRFIIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onBulkUpdate: (rfiIds: string[], updates: Partial<RFI>) => Promise<void>;
  projectUsers: any[];
}

export const RFIBulkActions = ({
  rfis,
  selectedRFIIds,
  onSelectionChange,
  onBulkUpdate,
  projectUsers
}: RFIBulkActionsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const isAllSelected = rfis.length > 0 && selectedRFIIds.length === rfis.length;
  const isSomeSelected = selectedRFIIds.length > 0 && selectedRFIIds.length < rfis.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(rfis.map(rfi => rfi.id));
    }
  };

  const handleBulkAction = async (action: string, updates: Partial<RFI>) => {
    if (selectedRFIIds.length === 0) return;
    
    setIsLoading(true);
    try {
      await onBulkUpdate(selectedRFIIds, updates);
      toast({
        title: "Bulk Action Complete",
        description: `Successfully ${action.toLowerCase()} ${selectedRFIIds.length} RFI${selectedRFIIds.length > 1 ? 's' : ''}.`,
      });
      onSelectionChange([]); // Clear selection after successful action
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action.toLowerCase()} RFIs. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkReassign = (userId: string) => {
    const user = projectUsers.find(u => u.user_id === userId);
    handleBulkAction("Reassign", { 
      assigned_to: userId,
      recipient_name: user?.profiles?.name || '',
      recipient_email: user?.profiles?.email || ''
    });
  };

  const handleBulkMarkAnswered = () => {
    handleBulkAction("Mark as Answered", { 
      status: 'answered',
      response_date: new Date().toISOString()
    });
  };

  const handleBulkMarkUrgent = () => {
    handleBulkAction("Mark as Urgent", { priority: 'critical' });
  };

  const handleBulkArchive = () => {
    handleBulkAction("Archive", { status: 'closed' });
  };

  const handleBulkDueDate = () => {
    const newDueDate = prompt("Enter new due date for selected RFIs (YYYY-MM-DD):");
    if (newDueDate && /^\d{4}-\d{2}-\d{2}$/.test(newDueDate)) {
      handleBulkAction("Update Due Date", { 
        due_date: newDueDate,
        required_response_by: newDueDate
      });
    }
  };

  if (selectedRFIIds.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-accent/10 border border-accent/20 rounded-lg">
      {/* Selection Controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSelectAll}
          className="h-8 w-8 p-0"
        >
          {isAllSelected ? (
            <CheckSquare className="h-4 w-4 text-primary" />
          ) : isSomeSelected ? (
            <div className="h-4 w-4 bg-primary/20 border-2 border-primary rounded flex items-center justify-center">
              <div className="h-2 w-2 bg-primary rounded" />
            </div>
          ) : (
            <Square className="h-4 w-4" />
          )}
        </Button>
        
        <Badge variant="secondary" className="font-medium">
          {selectedRFIIds.length} selected
        </Badge>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSelectionChange([])}
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Bulk Action Buttons */}
      <div className="flex items-center gap-2 flex-1">
        <Button
          variant="outline"
          size="sm"
          onClick={handleBulkMarkAnswered}
          disabled={isLoading}
          className="h-8 text-xs"
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          Mark Answered
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleBulkMarkUrgent}
          disabled={isLoading}
          className="h-8 text-xs"
        >
          <AlertTriangle className="h-3 w-3 mr-1" />
          Mark Urgent
        </Button>

        <Select onValueChange={handleBulkReassign} disabled={isLoading}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <UserX className="h-3 w-3 mr-1" />
            <SelectValue placeholder="Reassign to..." />
          </SelectTrigger>
          <SelectContent>
            {projectUsers.map(user => (
              <SelectItem key={user.user_id} value={user.user_id}>
                {user.profiles?.name || 'Unknown'} ({user.role})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={handleBulkDueDate}
          disabled={isLoading}
          className="h-8 text-xs"
        >
          <Calendar className="h-3 w-3 mr-1" />
          Due Date
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleBulkArchive}
          disabled={isLoading}
          className="h-8 text-xs text-muted-foreground hover:text-foreground"
        >
          <Archive className="h-3 w-3 mr-1" />
          Archive
        </Button>
      </div>
    </div>
  );
};