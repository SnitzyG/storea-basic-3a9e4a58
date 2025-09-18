import React, { useState } from 'react';
import { 
  MoreHorizontal, 
  CheckCircle, 
  XCircle, 
  UserX, 
  Calendar, 
  AlertTriangle, 
  Archive,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { RFI } from '@/hooks/useRFIs';
import { useToast } from '@/hooks/use-toast';

interface RFIQuickActionsProps {
  rfi: RFI;
  onUpdateRFI: (rfiId: string, updates: Partial<RFI>) => Promise<void>;
  projectUsers: any[];
  compact?: boolean;
}

export const RFIQuickActions = ({ 
  rfi, 
  onUpdateRFI, 
  projectUsers, 
  compact = false 
}: RFIQuickActionsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleQuickAction = async (action: string, updates: Partial<RFI>) => {
    setIsLoading(true);
    try {
      await onUpdateRFI(rfi.id, updates);
      toast({
        title: "RFI Updated",
        description: `Successfully ${action.toLowerCase()}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action.toLowerCase()}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAnswered = () => {
    handleQuickAction("Mark as Answered", { 
      status: 'responded',
      response_date: new Date().toISOString()
    });
  };

  const handleMarkUnanswered = () => {
    handleQuickAction("Mark as Unanswered", { 
      status: 'outstanding',
      response_date: null
    });
  };

  const handleMarkUrgent = () => {
    handleQuickAction("Mark as Urgent", { priority: 'critical' });
  };

  const handleReassign = (userId: string) => {
    const user = projectUsers.find(u => u.user_id === userId);
    handleQuickAction("Reassign RFI", { 
      assigned_to: userId,
      recipient_name: user?.profiles?.name || '',
      recipient_email: user?.profiles?.email || ''
    });
  };

  const handleUpdateDueDate = () => {
    const newDueDate = prompt("Enter new due date (YYYY-MM-DD):");
    if (newDueDate && /^\d{4}-\d{2}-\d{2}$/.test(newDueDate)) {
      handleQuickAction("Update Due Date", { 
        due_date: newDueDate,
        required_response_by: newDueDate
      });
    }
  };

  const handleArchive = () => {
    handleQuickAction("Archive RFI", { status: 'closed' });
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {/* Quick status toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={rfi.status === 'responded' ? handleMarkUnanswered : handleMarkAnswered}
          disabled={isLoading}
          className="h-7 w-7 p-0"
          title={rfi.status === 'responded' ? 'Mark as Unanswered' : 'Mark as Answered'}
        >
          {rfi.status === 'responded' ? (
            <XCircle className="h-3 w-3 text-muted-foreground" />
          ) : (
            <CheckCircle className="h-3 w-3 text-green-600" />
          )}
        </Button>

        {/* More actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={isLoading}>
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleMarkUrgent}>
              <AlertTriangle className="h-4 w-4 mr-2" />
              Mark as Urgent
            </DropdownMenuItem>
            
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <UserX className="h-4 w-4 mr-2" />
                Reassign to
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {projectUsers.map(user => (
                  <DropdownMenuItem 
                    key={user.user_id} 
                    onClick={() => handleReassign(user.user_id)}
                  >
                    <User className="h-4 w-4 mr-2" />
                    {user.profiles?.name || 'Unknown'} ({user.role})
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuItem onClick={handleUpdateDueDate}>
              <Calendar className="h-4 w-4 mr-2" />
              Update Due Date
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={handleArchive} className="text-muted-foreground">
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Status Badges */}
      <div className="flex items-center gap-1">
        <Badge 
          variant={rfi.priority === 'critical' ? 'destructive' : 'secondary'}
          className="text-xs"
        >
          {rfi.priority}
        </Badge>
        <Badge 
          variant={rfi.status === 'overdue' ? 'destructive' : 'outline'}
          className="text-xs"
        >
          {rfi.status}
        </Badge>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={rfi.status === 'responded' ? handleMarkUnanswered : handleMarkAnswered}
          disabled={isLoading}
          className="h-7 text-xs"
        >
          {rfi.status === 'responded' ? (
            <>
              <XCircle className="h-3 w-3 mr-1" />
              Mark Unanswered
            </>
          ) : (
            <>
              <CheckCircle className="h-3 w-3 mr-1" />
              Mark Answered
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleMarkUrgent}
          disabled={isLoading || rfi.priority === 'critical'}
          className="h-7 text-xs"
        >
          <AlertTriangle className="h-3 w-3 mr-1" />
          Urgent
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 text-xs" disabled={isLoading}>
              <MoreHorizontal className="h-3 w-3 mr-1" />
              More
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <UserX className="h-4 w-4 mr-2" />
                Reassign to
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {projectUsers.map(user => (
                  <DropdownMenuItem 
                    key={user.user_id} 
                    onClick={() => handleReassign(user.user_id)}
                  >
                    <User className="h-4 w-4 mr-2" />
                    {user.profiles?.name || 'Unknown'} ({user.role})
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuItem onClick={handleUpdateDueDate}>
              <Calendar className="h-4 w-4 mr-2" />
              Update Due Date
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={handleArchive} className="text-muted-foreground">
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};