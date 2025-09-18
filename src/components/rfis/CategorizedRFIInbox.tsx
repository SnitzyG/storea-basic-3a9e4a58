import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Clock, 
  User, 
  MessageSquare, 
  ChevronDown,
  ChevronUp,
  Paperclip,
  Plus,
  Send,
  AlertCircle,
  CheckCircle2,
  Clock3
} from 'lucide-react';
import { format } from 'date-fns';
import { RFI } from '@/hooks/useRFIs';
import { useAuth } from '@/hooks/useAuth';

interface CategorizedRFIInboxProps {
  rfis: RFI[];
  onView: (rfi: RFI) => void;
  onCreateNew: () => void;
  onReply: (rfi: RFI) => void;
  projectUsers: any[];
  currentProject: any;
}

const statusConfig = {
  outstanding: { 
    label: 'Open', 
    variant: 'default' as const, 
    color: 'text-blue-600',
    icon: AlertCircle,
    bgColor: 'bg-blue-50 border-blue-200'
  },
  overdue: { 
    label: 'Overdue', 
    variant: 'destructive' as const, 
    color: 'text-red-600',
    icon: Clock3,
    bgColor: 'bg-red-50 border-red-200'
  },
  responded: { 
    label: 'Responded', 
    variant: 'secondary' as const, 
    color: 'text-green-600',
    icon: CheckCircle2,
    bgColor: 'bg-green-50 border-green-200'
  },
  closed: { 
    label: 'Closed', 
    variant: 'outline' as const, 
    color: 'text-gray-600',
    icon: CheckCircle2,
    bgColor: 'bg-gray-50 border-gray-200'
  },
  // Support for "awaiting_response" status if needed
  awaiting_response: { 
    label: 'Awaiting Response', 
    variant: 'default' as const, 
    color: 'text-orange-600',
    icon: Clock,
    bgColor: 'bg-orange-50 border-orange-200'
  },
};

export const CategorizedRFIInbox: React.FC<CategorizedRFIInboxProps> = ({
  rfis,
  onView,
  onCreateNew,
  onReply,
  projectUsers,
  currentProject
}) => {
  const { user } = useAuth();
  const [waitingOpenStatus, setWaitingOpenStatus] = useState<{ [key: string]: boolean }>({
    outstanding: true,
    overdue: true,
    responded: false,
    closed: false,
  });
  const [respondOpenStatus, setRespondOpenStatus] = useState<{ [key: string]: boolean }>({
    outstanding: true,
    overdue: true,
    responded: false,
    closed: false,
  });

  // Categorize RFIs based on user's role in each RFI
  const categorizedRFIs = useMemo(() => {
    if (!user) return { waitingOn: [], needToRespond: [] };

    const waitingOn = rfis.filter(rfi => rfi.raised_by === user.id);
    const needToRespond = rfis.filter(rfi => 
      rfi.assigned_to === user.id && 
      (rfi.status === 'open' || rfi.status === 'submitted')
    );

    return { waitingOn, needToRespond };
  }, [rfis, user]);

  // Group RFIs by status
  const groupByStatus = (rfiList: RFI[]) => {
    return rfiList.reduce((groups, rfi) => {
      const status = rfi.status;
      if (!groups[status]) {
        groups[status] = [];
      }
      groups[status].push(rfi);
      return groups;
    }, {} as Record<string, RFI[]>);
  };

  const waitingOnGrouped = groupByStatus(categorizedRFIs.waitingOn);
  const needToRespondGrouped = groupByStatus(categorizedRFIs.needToRespond);

  const renderRFIGroup = (
    rfis: RFI[], 
    status: string, 
    isOpen: boolean, 
    onToggle: () => void,
    showReplyButton: boolean = false
  ) => {
    if (!rfis || rfis.length === 0) return null;

    const StatusIcon = statusConfig[status as keyof typeof statusConfig]?.icon || AlertCircle;
    const config = statusConfig[status as keyof typeof statusConfig];

    return (
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className={`w-full justify-between p-3 h-auto ${config?.bgColor} hover:opacity-80`}
          >
            <div className="flex items-center gap-2">
              <StatusIcon className={`h-4 w-4 ${config?.color}`} />
              <span className="font-medium">{config?.label} ({rfis.length})</span>
            </div>
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 pt-2">
          {rfis.map((rfi) => (
            <Card 
              key={rfi.id} 
              className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-primary/20 hover:border-l-primary"
              onClick={() => onView(rfi)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm line-clamp-1 mb-1">
                      {rfi.subject || 'No Subject'}
                    </h4>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {rfi.question}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        rfi.priority === 'high' ? 'border-red-300 text-red-700 bg-red-50' :
                        rfi.priority === 'medium' ? 'border-yellow-300 text-yellow-700 bg-yellow-50' :
                        'border-green-300 text-green-700 bg-green-50'
                      }`}
                    >
                      {rfi.priority.charAt(0).toUpperCase() + rfi.priority.slice(1)}
                    </Badge>
                    <Badge variant={config?.variant}>
                      {config?.label}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span>From: {rfi.raised_by_profile?.name || 'Unknown'}</span>
                    <span>To: {rfi.recipient_name || 'Unassigned'}</span>
                    {rfi.attachments && rfi.attachments.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Paperclip className="h-3 w-3" />
                        <span>{rfi.attachments.length}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(rfi.created_at), 'MMM d, HH:mm')}
                    </div>
                    {showReplyButton && rfi.status !== 'closed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          onReply(rfi);
                        }}
                        className="h-6 px-2 text-xs"
                      >
                        <Send className="h-3 w-3 mr-1" />
                        Reply
                      </Button>
                    )}
                  </div>
                </div>

                {rfi.due_date && (
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs">
                      Due: {format(new Date(rfi.due_date), 'MMM d')}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  const totalWaiting = categorizedRFIs.waitingOn.length;
  const totalRespond = categorizedRFIs.needToRespond.length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-background">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">RFI Inbox</h2>
            <p className="text-sm text-muted-foreground">
              {currentProject?.name || 'Project'} RFIs
            </p>
          </div>
          <Button onClick={onCreateNew} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create RFI
          </Button>
        </div>
      </div>

      {/* Categorized Inbox */}
      <div className="flex-1 overflow-auto">
        <Tabs defaultValue="waiting" className="h-full flex flex-col">
          <div className="px-4 pt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="waiting" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Waiting ({totalWaiting})
              </TabsTrigger>
              <TabsTrigger value="respond" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                To Respond ({totalRespond})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="waiting" className="flex-1 p-4 space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium text-sm text-muted-foreground mb-3">
                RFIs I'm Waiting on Others to Respond To
              </h3>
              {Object.entries(waitingOnGrouped).map(([status, rfis]) => 
                renderRFIGroup(
                  rfis,
                  status,
                  waitingOpenStatus[status],
                  () => setWaitingOpenStatus(prev => ({ ...prev, [status]: !prev[status] }))
                )
              )}
              {totalWaiting === 0 && (
                <Card className="border-dashed">
                  <CardContent className="flex items-center justify-center p-8 text-center">
                    <div>
                      <Clock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No RFIs waiting for responses
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="respond" className="flex-1 p-4 space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium text-sm text-muted-foreground mb-3">
                RFIs I Need to Respond To
              </h3>
              {Object.entries(needToRespondGrouped).map(([status, rfis]) => 
                renderRFIGroup(
                  rfis,
                  status,
                  respondOpenStatus[status],
                  () => setRespondOpenStatus(prev => ({ ...prev, [status]: !prev[status] })),
                  true // Show reply button for RFIs user needs to respond to
                )
              )}
              {totalRespond === 0 && (
                <Card className="border-dashed">
                  <CardContent className="flex items-center justify-center p-8 text-center">
                    <div>
                      <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No RFIs pending your response
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};