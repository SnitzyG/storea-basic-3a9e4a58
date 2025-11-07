import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTenderAccess } from '@/hooks/useTenderAccess';
import { CheckCircle, XCircle, Clock, User, Building2, Mail, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

interface TenderAccessApprovalsProps {
  projectId?: string;
}

export const TenderAccessApprovals = ({ projectId }: TenderAccessApprovalsProps) => {
  const { accessRequests, loading, approveTenderAccess, rejectTenderAccess } = useTenderAccess(projectId);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    pending: true,
    approved: false,
    rejected: false,
  });

  const pendingRequests = accessRequests.filter(r => r.status === 'pending');
  const approvedRequests = accessRequests.filter(r => r.status === 'approved');
  const rejectedRequests = accessRequests.filter(r => r.status === 'rejected');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const renderRequestCard = (request: any, showActions: boolean = false) => (
    <Card key={request.id} className="border-l-4 border-l-primary/20">
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <p className="font-semibold text-foreground">{request.requester_name}</p>
                {getStatusBadge(request.status)}
              </div>
              
              <div className="space-y-1 text-sm text-muted-foreground ml-6">
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  <span>{request.requester_email}</span>
                </div>
                
                {request.company && (
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3 w-3" />
                    <span>{request.company}</span>
                  </div>
                )}
                
                {request.role && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {request.role}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {request.message && (
            <div className="border-l-2 border-primary pl-3 py-1">
              <div className="flex items-start gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                <p className="text-sm text-foreground italic">"{request.message}"</p>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            <span>
              Requested {formatDistanceToNow(new Date(request.requested_at), { addSuffix: true })}
            </span>
            {request.approved_at && (
              <span>
                {request.status === 'approved' ? 'Approved' : 'Rejected'}{' '}
                {formatDistanceToNow(new Date(request.approved_at), { addSuffix: true })}
              </span>
            )}
          </div>

          {showActions && request.status === 'pending' && (
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                onClick={() => approveTenderAccess(request.id)}
                disabled={loading}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => rejectTenderAccess(request.id)}
                disabled={loading}
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (accessRequests.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No tender access requests yet</p>
          <p className="text-sm mt-1">Builders who request access to your tenders will appear here</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <Collapsible open={expandedSections.pending} onOpenChange={() => toggleSection('pending')}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-orange-100/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="h-5 w-5 text-orange-600" />
                    Pending Requests
                    <Badge variant="secondary" className="bg-orange-200 text-orange-800">
                      {pendingRequests.length}
                    </Badge>
                  </CardTitle>
                  <ChevronDown className={`h-5 w-5 transition-transform ${expandedSections.pending ? 'rotate-180' : ''}`} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-3">
                {pendingRequests.map((request) => renderRequestCard(request, true))}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Approved Requests */}
      {approvedRequests.length > 0 && (
        <Card>
          <Collapsible open={expandedSections.approved} onOpenChange={() => toggleSection('approved')}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Approved Requests
                    <Badge variant="secondary">{approvedRequests.length}</Badge>
                  </CardTitle>
                  <ChevronDown className={`h-5 w-5 transition-transform ${expandedSections.approved ? 'rotate-180' : ''}`} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-3">
                {approvedRequests.map((request) => renderRequestCard(request, false))}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Rejected Requests */}
      {rejectedRequests.length > 0 && (
        <Card>
          <Collapsible open={expandedSections.rejected} onOpenChange={() => toggleSection('rejected')}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <XCircle className="h-5 w-5 text-red-600" />
                    Rejected Requests
                    <Badge variant="secondary">{rejectedRequests.length}</Badge>
                  </CardTitle>
                  <ChevronDown className={`h-5 w-5 transition-transform ${expandedSections.rejected ? 'rotate-180' : ''}`} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-3">
                {rejectedRequests.map((request) => renderRequestCard(request, false))}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}
    </div>
  );
};