import React from 'react';
import { FileText, Send, Clock, CheckCircle, XCircle, Archive, Trash, MessageSquare, HelpCircle, Info, AlertTriangle, AlertCircle, Zap } from 'lucide-react';

export type RFIStatusFilter = 'all' | 'outstanding' | 'answered' | 'rejected' | 'closed' | 'void' | 'draft' | 'submitted' | 'open';
export type RFITypeFilter = 'all' | 'General Correspondence' | 'Request for Information' | 'General Advice';
export type RFIPriorityFilter = 'all' | 'low' | 'medium' | 'high' | 'critical';

interface RFIStatusProps {
  selectedStatus: RFIStatusFilter;
  onStatusChange: (status: RFIStatusFilter) => void;
  selectedType?: RFITypeFilter;
  onTypeChange?: (type: RFITypeFilter) => void;
  selectedPriority?: RFIPriorityFilter;
  onPriorityChange?: (priority: RFIPriorityFilter) => void;
  counts?: {
    all: number;
    outstanding: number;
    answered: number;
    rejected: number;
    closed: number;
    void: number;
    draft: number;
    submitted: number;
    open: number;
  };
  typeCounts?: {
    all: number;
    'General Correspondence': number;
    'Request for Information': number;
    'General Advice': number;
  };
  priorityCounts?: {
    all: number;
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

export const RFIStatus = ({ 
  selectedStatus, 
  onStatusChange, 
  selectedType = 'all',
  onTypeChange,
  selectedPriority = 'all',
  onPriorityChange,
  counts, 
  typeCounts,
  priorityCounts 
}: RFIStatusProps) => {
  const statuses = [
    {
      id: 'all' as const,
      label: 'All Statuses',
      icon: Archive,
      description: 'All RFIs regardless of status'
    },
    {
      id: 'outstanding' as const,
      label: 'Outstanding',
      icon: Clock,
      description: 'RFIs pending response'
    },
    {
      id: 'draft' as const,
      label: 'Draft',
      icon: FileText,
      description: 'RFIs saved as drafts'
    },
    {
      id: 'submitted' as const,
      label: 'Submitted',
      icon: Send,
      description: 'RFIs that have been submitted'
    },
    {
      id: 'open' as const,
      label: 'Open',
      icon: Clock,
      description: 'RFIs that are open and pending response'
    },
    {
      id: 'answered' as const,
      label: 'Answered',
      icon: CheckCircle,
      description: 'RFIs that have been answered'
    },
    {
      id: 'rejected' as const,
      label: 'Rejected',
      icon: XCircle,
      description: 'RFIs that have been rejected'
    },
    {
      id: 'closed' as const,
      label: 'Closed',
      icon: Archive,
      description: 'RFIs that have been closed'
    },
    {
      id: 'void' as const,
      label: 'Void',
      icon: Trash,
      description: 'RFIs that have been voided'
    }
  ];

  const rfiTypes = [
    {
      id: 'all' as const,
      label: 'All Types',
      icon: Archive,
      description: 'All mail types'
    },
    {
      id: 'General Correspondence' as const,
      label: 'General Correspondence',
      icon: MessageSquare,
      description: 'General inquiries and correspondence'
    },
    {
      id: 'Request for Information' as const,
      label: 'Request for Information',
      icon: HelpCircle,
      description: 'Specific information requests'
    },
    {
      id: 'General Advice' as const,
      label: 'General Advice',
      icon: Info,
      description: 'Requests for advice or guidance'
    }
  ];

  const priorities = [
    {
      id: 'all' as const,
      label: 'All Priorities',
      icon: Archive,
      description: 'All priority levels'
    },
    {
      id: 'low' as const,
      label: 'Low',
      icon: Info,
      description: 'Low priority RFIs'
    },
    {
      id: 'medium' as const,
      label: 'Medium',
      icon: AlertTriangle,
      description: 'Medium priority RFIs'
    },
    {
      id: 'high' as const,
      label: 'High',
      icon: AlertCircle,
      description: 'High priority RFIs'
    },
    {
      id: 'critical' as const,
      label: 'Critical',
      icon: Zap,
      description: 'Critical priority RFIs'
    }
  ];

  return (
    <div className="h-full border-x border-b border-muted rounded-b-lg bg-muted/10 p-3 overflow-hidden flex flex-col">
      {/* RFI Status Section */}
      <div className="mb-6">
        <h3 className="text-xs font-medium text-muted-foreground/70 mb-4 uppercase tracking-wide">
          RFI Status
        </h3>
        <nav className="space-y-1">
          {statuses.map(({ id, label, icon: Icon, description }) => (
            <button
              key={id}
              onClick={() => onStatusChange(id)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                selectedStatus === id
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
              title={description}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="flex-1 text-left truncate">{label}</span>
              {counts && counts[id] > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                  selectedStatus === id
                    ? 'bg-accent-foreground/20 text-accent-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {counts[id]}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* RFI Type Section */}
      {onTypeChange && (
        <div className="mb-6">
          <h3 className="text-xs font-medium text-muted-foreground/70 mb-4 uppercase tracking-wide">
            Mail Type
          </h3>
          <nav className="space-y-1">
            {rfiTypes.map(({ id, label, icon: Icon, description }) => (
              <button
                key={id}
                onClick={() => onTypeChange(id)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                  selectedType === id
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
                title={description}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1 text-left truncate">{label}</span>
                {typeCounts && typeCounts[id as keyof typeof typeCounts] > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                    selectedType === id
                      ? 'bg-accent-foreground/20 text-accent-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {typeCounts[id as keyof typeof typeCounts]}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Priority Level Section */}
      {onPriorityChange && (
        <div className="flex-1 min-h-0">
          <h3 className="text-xs font-medium text-muted-foreground/70 mb-4 uppercase tracking-wide">
            Priority Level
          </h3>
          <nav className="space-y-1 overflow-y-auto">
            {priorities.map(({ id, label, icon: Icon, description }) => (
              <button
                key={id}
                onClick={() => onPriorityChange(id)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                  selectedPriority === id
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
                title={description}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1 text-left truncate">{label}</span>
                {priorityCounts && priorityCounts[id as keyof typeof priorityCounts] > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                    selectedPriority === id
                      ? 'bg-accent-foreground/20 text-accent-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {priorityCounts[id as keyof typeof priorityCounts]}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
};