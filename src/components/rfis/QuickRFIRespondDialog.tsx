import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, Clock, Calendar, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { RFI } from '@/hooks/useRFIs';
import { useAuth } from '@/hooks/useAuth';

interface QuickRFIRespondDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rfis: RFI[];
  onRespond: (rfi: RFI) => void;
}

export const QuickRFIRespondDialog: React.FC<QuickRFIRespondDialogProps> = ({
  open,
  onOpenChange,
  rfis,
  onRespond
}) => {
  const { profile } = useAuth();

  // Filter RFIs assigned to current user that are outstanding
  const assignedOutstandingRFIs = useMemo(() => {
    if (!profile?.user_id) return [];
    
    return rfis.filter(rfi => 
      rfi.assigned_to === profile.user_id && 
      rfi.status === 'outstanding'
    ).sort((a, b) => {
      // Sort by priority first, then due date
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Higher priority first
      }
      
      // Then by due date (earliest first)
      const aDate = a.due_date || a.required_response_by || '9999-12-31';
      const bDate = b.due_date || b.required_response_by || '9999-12-31';
      return aDate.localeCompare(bDate);
    });
  }, [rfis, profile?.user_id]);

  const priorityColors = {
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  };

  const handleRespond = (rfi: RFI) => {
    onRespond(rfi);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Outstanding RFIs Requiring Response
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh]">
          {assignedOutstandingRFIs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No outstanding RFIs to respond to</p>
              <p className="text-sm">You're all caught up!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignedOutstandingRFIs.map((rfi) => (
                <Card key={rfi.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{rfi.subject || 'Untitled RFI'}</CardTitle>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {rfi.raised_by_profile?.name || 'Unknown'}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatDistanceToNow(new Date(rfi.created_at), { addSuffix: true })}
                          </div>
                          {(rfi.due_date || rfi.required_response_by) && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Due: {new Date(rfi.due_date || rfi.required_response_by!).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={priorityColors[rfi.priority]}>
                          {rfi.priority.toUpperCase()}
                        </Badge>
                        {rfi.rfi_number && (
                          <Badge variant="outline">
                            {rfi.rfi_number}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Question:</p>
                        <p className="text-sm line-clamp-3">{rfi.question}</p>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button 
                          onClick={() => handleRespond(rfi)}
                          size="sm"
                          className="gap-2"
                        >
                          <AlertCircle className="w-4 h-4" />
                          Respond to RFI
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};