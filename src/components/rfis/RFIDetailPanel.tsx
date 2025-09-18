import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RFI } from '@/hooks/useRFIs';
import { format } from 'date-fns';
import { MessageSquare } from 'lucide-react';

interface RFIDetailPanelProps {
  rfi: RFI | null;
}

export const RFIDetailPanel: React.FC<RFIDetailPanelProps> = ({ rfi }) => {
  if (!rfi) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full text-center p-8">
          <div className="text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Select an RFI</p>
            <p className="text-sm">Choose an RFI from the list to view its details</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusColors = {
    outstanding: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    responded: 'bg-green-100 text-green-800 border-green-200', 
    overdue: 'bg-red-100 text-red-800 border-red-200',
    closed: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  const priorityColors = {
    low: 'bg-blue-100 text-blue-800 border-blue-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    critical: 'bg-red-100 text-red-800 border-red-200'
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">
              {rfi.subject || 'Request for Information'}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              RFI #{rfi.rfi_number || rfi.id.slice(0, 8)}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge className={`text-xs ${statusColors[rfi.status as keyof typeof statusColors] || statusColors.outstanding}`}>
              {rfi.status.replace('_', ' ').toUpperCase()}
            </Badge>
            <Badge 
              variant="outline" 
              className={`text-xs ${priorityColors[rfi.priority as keyof typeof priorityColors] || priorityColors.medium}`}
            >
              {rfi.priority.toUpperCase()}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email-style header */}
        <div className="space-y-3 pb-4 border-b">
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">From:</span>{' '}
              <span>{rfi.raised_by_profile?.name || rfi.sender_name || 'Unknown'}</span>
              {rfi.sender_email && (
                <span className="text-muted-foreground ml-2">({rfi.sender_email})</span>
              )}
            </div>
            <div>
              <span className="font-medium text-muted-foreground">To:</span>{' '}
              <span>{rfi.assigned_to_profile?.name || rfi.recipient_name || 'Unassigned'}</span>
              {rfi.recipient_email && (
                <span className="text-muted-foreground ml-2">({rfi.recipient_email})</span>
              )}
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Project:</span>{' '}
              <span>{rfi.project_name || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Date:</span>{' '}
              <span>{format(new Date(rfi.created_at), 'EEEE, MMMM d, yyyy \'at\' h:mm a')}</span>
            </div>
            {(rfi.due_date || rfi.required_response_by) && (
              <div>
                <span className="font-medium text-muted-foreground">Response Due:</span>{' '}
                <span>{format(new Date(rfi.due_date || rfi.required_response_by), 'EEEE, MMMM d, yyyy')}</span>
              </div>
            )}
          </div>
        </div>

        {/* RFI Content */}
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">Question/Request:</h4>
            <div className="text-sm leading-relaxed bg-muted/30 p-3 rounded-md">
              {rfi.question}
            </div>
          </div>

          {/* Reference Information */}
          {(rfi.drawing_no || rfi.specification_section || rfi.contract_clause || rfi.other_reference) && (
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Reference Information:</h4>
              <div className="grid grid-cols-1 gap-2 text-sm">
                {rfi.drawing_no && (
                  <div>
                    <span className="font-medium">Drawing No:</span> {rfi.drawing_no}
                  </div>
                )}
                {rfi.specification_section && (
                  <div>
                    <span className="font-medium">Specification:</span> {rfi.specification_section}
                  </div>
                )}
                {rfi.contract_clause && (
                  <div>
                    <span className="font-medium">Contract Clause:</span> {rfi.contract_clause}
                  </div>
                )}
                {rfi.other_reference && (
                  <div>
                    <span className="font-medium">Other Reference:</span> {rfi.other_reference}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Proposed Solution */}
          {rfi.proposed_solution && (
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Proposed Solution:</h4>
              <div className="text-sm leading-relaxed bg-muted/30 p-3 rounded-md">
                {rfi.proposed_solution}
              </div>
            </div>
          )}

          {/* Response */}
          {rfi.response ? (
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Response:</h4>
              <div className="text-sm leading-relaxed bg-green-50 p-3 rounded-md border border-green-200">
                {rfi.response}
              </div>
              {rfi.response_date && (
                <p className="text-xs text-muted-foreground mt-2">
                  Responded on {format(new Date(rfi.response_date), 'MMMM d, yyyy \'at\' h:mm a')}
                  {rfi.responder_name && ` by ${rfi.responder_name}`}
                </p>
              )}
            </div>
          ) : (
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Response:</h4>
              <div className="text-sm text-muted-foreground italic bg-muted/30 p-3 rounded-md">
                Awaiting response
              </div>
            </div>
          )}

          {/* Attachments */}
          {rfi.attachments && Array.isArray(rfi.attachments) && rfi.attachments.length > 0 && (
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Attachments:</h4>
              <div className="space-y-1">
                {rfi.attachments.map((attachment: any, index: number) => (
                  <div key={index} className="text-sm text-blue-600 hover:underline cursor-pointer">
                    {attachment.name || `Attachment ${index + 1}`}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};