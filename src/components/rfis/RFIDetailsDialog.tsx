import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, User, MessageSquare, Activity } from 'lucide-react';
import { RFI, RFIActivity, useRFIs } from '@/hooks/useRFIs';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

interface RFIDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rfi: RFI | null;
}

const statusColors = {
  outstanding: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  overdue: 'bg-red-500/10 text-red-700 border-red-500/20',
  responded: 'bg-green-500/10 text-green-700 border-green-500/20',
  closed: 'bg-gray-500/10 text-gray-700 border-gray-500/20',
};

const priorityColors = {
  low: 'bg-green-500/10 text-green-700 border-green-500/20',
  medium: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
  high: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
  critical: 'bg-red-500/10 text-red-700 border-red-500/20',
};

export const RFIDetailsDialog = ({ open, onOpenChange, rfi }: RFIDetailsDialogProps) => {
  const [response, setResponse] = useState('');
  const [status, setStatus] = useState<'outstanding' | 'overdue' | 'responded' | 'closed'>('outstanding');
  const [activities, setActivities] = useState<RFIActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingActivities, setLoadingActivities] = useState(false);

  const { updateRFI, getRFIActivities } = useRFIs();
  const { user, profile } = useAuth();

  useEffect(() => {
    if (rfi) {
      setResponse(rfi.response || '');
      setStatus(rfi.status);
      
      // Fetch activities
      if (open) {
        setLoadingActivities(true);
        getRFIActivities(rfi.id).then((data) => {
          setActivities(data);
          setLoadingActivities(false);
        });
      }
    }
  }, [rfi, open, getRFIActivities]);

  // Real-time subscription for activity timeline
  useEffect(() => {
    if (!open || !rfi) return;

    const channel = supabase
      .channel(`rfi-activities-${rfi.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'rfi_activities', filter: `rfi_id=eq.${rfi.id}` },
        async (payload: any) => {
          const newActivity = payload.new;
          // Fetch profile for the activity user to enrich
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, name, role')
            .eq('user_id', newActivity.user_id)
            .limit(1)
            .maybeSingle();

          setActivities(prev => [
            {
              ...newActivity,
              user_profile: profiles || undefined,
            },
            ...prev,
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, rfi]);

  const handleSubmitResponse = async () => {
    if (!rfi || !response.trim()) return;

    setLoading(true);
    const updates: Partial<RFI> = {
      response: response.trim(),
      status: 'responded',
      responder_name: profile?.name,
      responder_position: profile?.role,
      response_date: new Date().toISOString(),
    };

    await updateRFI(rfi.id, updates);
    setLoading(false);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!rfi) return;

    setLoading(true);
    await updateRFI(rfi.id, { status: newStatus as any });
    setStatus(newStatus as any);
    setLoading(false);
  };

  // Only contractors can respond to RFIs assigned to them
  const canRespond = user && rfi?.assigned_to === user.id && rfi.status !== 'closed' && rfi.status !== 'responded';
  const canChangeStatus = user && (user.id === rfi?.raised_by || user.id === rfi?.assigned_to || profile?.role === 'architect');

  if (!rfi) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">RFI Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header with badges */}
          <div className="flex flex-wrap gap-2">
            <Badge className={statusColors[rfi.status]}>
              {rfi.status.replace('_', ' ').toUpperCase()}
            </Badge>
            <Badge className={priorityColors[rfi.priority]}>
              {rfi.priority.toUpperCase()} PRIORITY
            </Badge>
            {rfi.category && (
              <Badge variant="outline">{rfi.category}</Badge>
            )}
          </div>

          {/* Question */}
          <div>
            <h3 className="font-semibold mb-2 flex items-center">
              <MessageSquare className="w-4 h-4 mr-2" />
              Question
            </h3>
            <p className="text-foreground bg-muted/50 p-3 rounded-md">
              {rfi.question}
            </p>
          </div>

          {/* Meta information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center text-sm">
              <User className="w-4 h-4 mr-2 text-muted-foreground" />
              <span className="text-muted-foreground mr-2">Raised by:</span>
              <div className="flex items-center">
                <Avatar className="w-5 h-5 mr-2">
                  <AvatarFallback className="text-xs">
                    {rfi.raised_by_profile?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span>{rfi.raised_by_profile?.name || 'Unknown'}</span>
              </div>
            </div>

            {rfi.assigned_to && (
              <div className="flex items-center text-sm">
                <User className="w-4 h-4 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground mr-2">Assigned to:</span>
                <div className="flex items-center">
                  <Avatar className="w-5 h-5 mr-2">
                    <AvatarFallback className="text-xs">
                      {rfi.assigned_to_profile?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span>{rfi.assigned_to_profile?.name || 'Unknown'}</span>
                </div>
              </div>
            )}

            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="w-4 h-4 mr-2" />
              Created {formatDistanceToNow(new Date(rfi.created_at), { addSuffix: true })}
            </div>

            {rfi.due_date && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 mr-2" />
                Due: {new Date(rfi.due_date).toLocaleDateString()}
              </div>
            )}
          </div>

          <Separator />

          {/* Response section */}
          {rfi.response ? (
            <div>
              <h3 className="font-semibold mb-2">Response</h3>
              <p className="text-foreground bg-muted/50 p-3 rounded-md">
                {rfi.response}
              </p>
            </div>
          ) : canRespond ? (
            <div>
              <Label htmlFor="response" className="text-base font-semibold">
                Add Response
              </Label>
              <Textarea
                id="response"
                placeholder="Enter your response to this RFI..."
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                className="mt-2 min-h-[100px]"
              />
              <Button
                onClick={handleSubmitResponse}
                disabled={loading || !response.trim()}
                className="mt-3"
              >
                {loading ? 'Submitting...' : 'Submit Response'}
              </Button>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No response yet</p>
            </div>
          )}

          {/* Status update */}
          {canChangeStatus && (
            <div>
              <Label htmlFor="status" className="text-base font-semibold">
                Update Status
              </Label>
              <Select value={status} onValueChange={handleStatusChange}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="outstanding">Outstanding</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="responded">Responded</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <Separator />

          {/* Activity timeline */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center">
              <Activity className="w-4 h-4 mr-2" />
              Activity Timeline
            </h3>
            
            {loadingActivities ? (
              <p className="text-center text-muted-foreground py-4">Loading activities...</p>
            ) : activities.length > 0 ? (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-md">
                    <Avatar className="w-6 h-6 mt-0.5">
                      <AvatarFallback className="text-xs">
                        {activity.user_profile?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">
                          {activity.user_profile?.name || 'Unknown'}
                        </span>{' '}
                        {activity.action}{' '}
                        {activity.details && (
                          <span className="text-muted-foreground">
                            ({activity.details})
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No activities yet</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};