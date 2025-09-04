import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, AlertTriangle, User, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface RFI {
  id: string;
  project_id: string;
  raised_by: string;
  assigned_to?: string;
  question: string;
  response?: string;
  status: 'submitted' | 'in_review' | 'responded' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date?: string;
  category?: string;
  created_at: string;
  updated_at: string;
  raised_by_profile?: {
    name: string;
    role: string;
  };
  assigned_to_profile?: {
    name: string;
    role: string;
  };
}

interface UserRFIsDashboardProps {
  assignedRFIs: RFI[];
  onUpdateRFI: (rfiId: string, updates: Partial<RFI>) => Promise<any>;
  onViewRFI: (rfi: RFI) => void;
}

const priorityColors = {
  low: 'bg-blue-500/10 text-blue-600',
  medium: 'bg-yellow-500/10 text-yellow-600',
  high: 'bg-orange-500/10 text-orange-600',
  critical: 'bg-red-500/10 text-red-600'
};

const statusColors = {
  submitted: 'bg-gray-500/10 text-gray-600',
  in_review: 'bg-blue-500/10 text-blue-600',
  responded: 'bg-green-500/10 text-green-600',
  closed: 'bg-gray-500/10 text-gray-500'
};

export const UserRFIsDashboard = ({ 
  assignedRFIs, 
  onUpdateRFI, 
  onViewRFI 
}: UserRFIsDashboardProps) => {
  const { profile } = useAuth();

  const handleStatusUpdate = async (rfiId: string, newStatus: RFI['status']) => {
    await onUpdateRFI(rfiId, { status: newStatus });
  };

  const handleAddResponse = async (rfiId: string, response: string) => {
    await onUpdateRFI(rfiId, { 
      response, 
      status: 'responded' 
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = (dueDateString?: string) => {
    if (!dueDateString) return false;
    return new Date(dueDateString) < new Date();
  };

  if (assignedRFIs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            My Assigned RFIs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            No RFIs assigned to you at the moment.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          My Assigned RFIs ({assignedRFIs.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {assignedRFIs.map((rfi) => (
            <div
              key={rfi.id}
              className="border rounded-lg p-4 hover:bg-accent/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={priorityColors[rfi.priority]}>
                      {rfi.priority.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className={statusColors[rfi.status]}>
                      {rfi.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    {rfi.category && (
                      <Badge variant="secondary">
                        {rfi.category}
                      </Badge>
                    )}
                    {isOverdue(rfi.due_date) && (
                      <Badge className="bg-red-500/10 text-red-600">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        OVERDUE
                      </Badge>
                    )}
                  </div>
                  
                  <h3 className="font-medium text-foreground mb-2 line-clamp-2">
                    {rfi.question}
                  </h3>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>From: {rfi.raised_by_profile?.name || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Created: {formatDate(rfi.created_at)}</span>
                    </div>
                    {rfi.due_date && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Due: {formatDate(rfi.due_date)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {rfi.response && (
                <div className="mb-3 p-3 bg-muted/50 rounded-md">
                  <p className="text-sm text-muted-foreground mb-1">Response:</p>
                  <p className="text-sm">{rfi.response}</p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onViewRFI(rfi)}
                >
                  View Details
                </Button>
                
                {rfi.status === 'submitted' && (
                  <Button
                    size="sm"
                    onClick={() => handleStatusUpdate(rfi.id, 'in_review')}
                  >
                    Start Review
                  </Button>
                )}
                
                {rfi.status === 'in_review' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => {
                        const response = prompt('Enter your response to this RFI:');
                        if (response) {
                          handleAddResponse(rfi.id, response);
                        }
                      }}
                    >
                      Add Response
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusUpdate(rfi.id, 'closed')}
                    >
                      Close
                    </Button>
                  </>
                )}
                
                {rfi.status === 'responded' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatusUpdate(rfi.id, 'closed')}
                  >
                    Mark Closed
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};