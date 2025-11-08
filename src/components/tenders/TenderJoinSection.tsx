import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/hooks/useAuth';
import { useTenderAccess } from '@/hooks/useTenderAccess';
import { ChevronDown, FileText, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
interface TenderJoinSectionProps {
  projectId?: string;
}

export const TenderJoinSection = ({ projectId }: TenderJoinSectionProps) => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const { 
    myRequests, 
    accessRequests, 
    loading, 
    requestTenderAccess, 
    approveTenderAccess, 
    rejectTenderAccess 
  } = useTenderAccess(projectId);

  const [tenderId, setTenderId] = useState('');
  const [message, setMessage] = useState('');
  const [showMyRequests, setShowMyRequests] = useState(false);
  const [showApprovals, setShowApprovals] = useState(false);

  const handleSubmitRequest = async () => {
    if (!tenderId.trim()) return;
    
    const result = await requestTenderAccess('', tenderId.trim(), message.trim());
    if (result.success) {
      setTenderId('');
      setMessage('');
      setShowMyRequests(true);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const isArchitect = profile?.role === 'architect';

  return (
    <div className="space-y-6">
      {/* Join Tender Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Join a Tender
          </CardTitle>
          <CardDescription>
            Enter the Tender ID provided by the architect to request access to tender documents
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tender-id">Tender ID</Label>
            <Input
              id="tender-id"
              placeholder="Enter 15-character Tender ID"
              value={tenderId}
              onChange={(e) => setTenderId(e.target.value.toUpperCase())}
              maxLength={15}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Example: VECXL0PRUDSGVWC
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Your Name</Label>
              <Input value={profile?.name || user?.email || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>Your Role</Label>
              <Input value={profile?.role || 'contractor'} disabled />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Introduce yourself or explain your interest in this tender..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          <Button 
            onClick={handleSubmitRequest} 
            disabled={!tenderId.trim() || loading}
            className="w-full"
          >
            {loading ? 'Submitting...' : 'Request to View Tender'}
          </Button>
        </CardContent>
      </Card>

      {/* Requests for Approval (Architects Only) */}
      {isArchitect && accessRequests.length > 0 && (
        <Card>
          <Collapsible open={showApprovals} onOpenChange={setShowApprovals}>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    Requests for Approval
                    <Badge variant="secondary">{accessRequests.filter(r => r.status === 'pending').length}</Badge>
                  </CardTitle>
                  <ChevronDown className={`h-5 w-5 transition-transform ${showApprovals ? 'rotate-180' : ''}`} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                {accessRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold">{request.requester_name}</p>
                            <p className="text-sm text-muted-foreground">{request.requester_email}</p>
                            {request.company && (
                              <p className="text-sm text-muted-foreground">{request.company}</p>
                            )}
                          </div>
                          {getStatusBadge(request.status)}
                        </div>
                        
                        {request.message && (
                          <p className="text-sm border-l-2 border-primary pl-3 py-1">
                            {request.message}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            Requested {formatDistanceToNow(new Date(request.requested_at), { addSuffix: true })}
                          </span>
                        </div>

                        {request.status === 'pending' && (
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
                ))}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* My Tender Requests */}
      {myRequests.length > 0 && (
        <Card>
          <Collapsible open={showMyRequests} onOpenChange={setShowMyRequests}>
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle>My Tender Requests</CardTitle>
                  <ChevronDown className={`h-5 w-5 transition-transform ${showMyRequests ? 'rotate-180' : ''}`} />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                {myRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold">Tender Access Request</p>
                            <p className="text-sm text-muted-foreground">
                              Requested {formatDistanceToNow(new Date(request.requested_at), { addSuffix: true })}
                            </p>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>

                        {request.message && (
                          <p className="text-sm text-muted-foreground italic">
                          "{request.message}"
                          </p>
                        )}

                        {request.status === 'approved' && (
                          <Button
                            size="sm"
                            onClick={async () => {
                              try {
                                console.log('TenderJoinSection: Fetching tender_id for UUID:', request.tender_id);
                                
                                // For builders/contractors we must open the Builder view which expects the human Tender ID (tender_id)
                                // tender_access only has the UUID, so we fetch the tender to get its tender_id
                                const { data: t, error } = await supabase
                                  .from('tenders')
                                  .select('tender_id')
                                  .eq('id', request.tender_id)
                                  .single();
                                
                                if (error) {
                                  console.error('TenderJoinSection: Error fetching tender_id:', error);
                                  toast.error('Failed to load tender details');
                                  return;
                                }
                                
                                if (!t?.tender_id) {
                                  console.error('TenderJoinSection: No tender_id found for UUID:', request.tender_id);
                                  toast.error('Tender ID not found');
                                  return;
                                }
                                
                                console.log('TenderJoinSection: Navigating to builder with tender_id:', t.tender_id);
                                navigate(`/tenders/${t.tender_id}/builder`);
                              } catch (err) {
                                console.error('TenderJoinSection: Unexpected error:', err);
                                toast.error('Failed to open tender');
                              }
                            }}
                            className="w-full"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Tender Details
                          </Button>
                        )}

                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {myRequests.length === 0 && !isArchitect && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No tender requests yet</p>
            <p className="text-sm">Enter a Tender ID above to request access</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
