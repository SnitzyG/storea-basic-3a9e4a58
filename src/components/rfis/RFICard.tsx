import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, Clock, User, AlertTriangle } from 'lucide-react';
import { RFI } from '@/hooks/useRFIs';
import { formatDistanceToNow } from 'date-fns';

// Helper function to get RFI type display label
const getRFITypeLabel = (rfiType?: string): string => {
  switch (rfiType) {
    case 'general_correspondence':
      return 'General Correspondence';
    case 'request_for_information':
      return 'Request for Information';
    case 'general_advice':
      return 'General Advice';
    default:
      return 'General Correspondence';
  }
};

interface RFICardProps {
  rfi: RFI;
  onView: (rfi: RFI) => void;
  onEdit?: (rfi: RFI) => void;
  onAssign?: (rfi: RFI) => void;
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

const statusLabels = {
  outstanding: 'Outstanding',
  overdue: 'Overdue',
  responded: 'Responded',
  closed: 'Closed',
};

const priorityLabels = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export const RFICard = ({ rfi, onView, onEdit, onAssign }: RFICardProps) => {
  const isOverdue = rfi.due_date && new Date(rfi.due_date) < new Date() && rfi.status !== 'closed';

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-lg line-clamp-2">
                {rfi.question}
              </CardTitle>
              <div className="ml-2 space-y-1 text-right">
                <Badge variant="secondary" className="font-mono text-xs block">
                  {rfi.rfi_number || `RFI-${rfi.id.slice(0, 8)}`}
                </Badge>
                <div className="text-xs text-muted-foreground">
                  {getRFITypeLabel(rfi.rfi_type)}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge className={statusColors[rfi.status]}>
                {statusLabels[rfi.status]}
              </Badge>
              <Badge className={priorityColors[rfi.priority]}>
                {priorityLabels[rfi.priority]}
              </Badge>
              {rfi.category && (
                <Badge variant="outline">{rfi.category}</Badge>
              )}
              {isOverdue && (
                <Badge className="bg-red-500/10 text-red-700 border-red-500/20">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Overdue
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Raised by */}
          <div className="flex items-center text-sm text-muted-foreground">
            <User className="w-4 h-4 mr-2" />
            <span>Raised by:</span>
            <div className="flex items-center ml-2">
              <Avatar className="w-5 h-5 mr-1">
                <AvatarFallback className="text-xs">
                  {rfi.raised_by_profile?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <span>{rfi.raised_by_profile?.name || 'Unknown'}</span>
            </div>
          </div>

          {/* Assigned to */}
          {rfi.assigned_to && (
            <div className="flex items-center text-sm text-muted-foreground">
              <User className="w-4 h-4 mr-2" />
              <span>Assigned to:</span>
              <div className="flex items-center ml-2">
                <Avatar className="w-5 h-5 mr-1">
                  <AvatarFallback className="text-xs">
                    {rfi.assigned_to_profile?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span>{rfi.assigned_to_profile?.name || 'Unknown'}</span>
              </div>
            </div>
          )}

          {/* Due date */}
          {rfi.due_date && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 mr-2" />
              <span>Due: {new Date(rfi.due_date).toLocaleDateString()}</span>
            </div>
          )}

          {/* Created time */}
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="w-4 h-4 mr-2" />
            <span>
              Created {formatDistanceToNow(new Date(rfi.created_at), { addSuffix: true })}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => onView(rfi)}>
              View Details
            </Button>
            {onEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(rfi)}>
                Edit
              </Button>
            )}
            {onAssign && !rfi.assigned_to && (
              <Button variant="outline" size="sm" onClick={() => onAssign(rfi)}>
                Assign
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};