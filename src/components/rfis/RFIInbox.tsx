import React from 'react';
import { Inbox, Send, FileEdit, Archive, MessageSquare, Clock, CheckCircle, XCircle, Trash, HelpCircle, Info, AlertTriangle, AlertCircle, Zap } from 'lucide-react';

export type RFIInboxCategory = 'all' | 'sent' | 'received' | 'unresponded' | 'responded' | 'drafts';
export type RFIStatusFilter = 'all' | 'outstanding' | 'answered' | 'rejected' | 'closed' | 'void' | 'draft' | 'submitted' | 'open';
export type RFITypeFilter = 'all' | 'General' | 'Request for Information' | 'Advice';
export type RFIPriorityFilter = 'all' | 'low' | 'medium' | 'high' | 'critical';

interface RFIInboxProps {
  selectedCategory: RFIInboxCategory;
  onCategoryChange: (category: RFIInboxCategory) => void;
  selectedStatus?: RFIStatusFilter;
  onStatusChange?: (status: RFIStatusFilter) => void;
  selectedType?: RFITypeFilter;
  onTypeChange?: (type: RFITypeFilter) => void;
  selectedPriority?: RFIPriorityFilter;
  onPriorityChange?: (priority: RFIPriorityFilter) => void;
  counts?: {
    all: number;
    sent: number;
    received: number;
    unresponded: number;
    responded: number;
    drafts: number;
  };
  statusCounts?: {
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
    General: number;
    'Request for Information': number;
    Advice: number;
  };
  priorityCounts?: {
    all: number;
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

export const RFIInbox = ({ 
  selectedCategory, 
  onCategoryChange, 
  selectedStatus = 'all',
  onStatusChange,
  selectedType = 'all',
  onTypeChange,
  selectedPriority = 'all',
  onPriorityChange,
  counts, 
  statusCounts,
  typeCounts,
  priorityCounts
}: RFIInboxProps) => {
  const categories = [
    {
      id: 'all' as const,
      label: 'All Project RFIs',
      icon: Archive,
      description: 'Full list of RFIs for the active project'
    },
    {
      id: 'received' as const,
      label: 'RFIs Sent to Me',
      icon: Inbox,
      description: 'RFIs where you are the recipient'
    },
    {
      id: 'sent' as const,
      label: 'RFIs I\'ve Sent',
      icon: Send,
      description: 'RFIs created and submitted by you'
    },
    {
      id: 'unresponded' as const,
      label: 'Unresponded RFIs',
      icon: MessageSquare,
      description: 'RFIs sent to others but not yet answered'
    },
    {
      id: 'responded' as const,
      label: 'Responded RFIs',
      icon: MessageSquare,
      description: 'RFIs that have received responses'
    },
    {
      id: 'drafts' as const,
      label: 'Draft RFIs',
      icon: FileEdit,
      description: 'RFIs created but not yet sent'
    }
  ];

  const statusCategories = [
    {
      id: 'outstanding',
      label: 'Outstanding',
      icon: Clock,
      description: 'RFIs pending response'
    },
    {
      id: 'answered',
      label: 'Answered',
      icon: CheckCircle,
      description: 'RFIs that have been answered'
    },
    {
      id: 'rejected',
      label: 'Rejected',
      icon: XCircle,
      description: 'RFIs that have been rejected'
    },
    {
      id: 'closed',
      label: 'Closed',
      icon: Archive,
      description: 'RFIs that have been closed'
    },
    {
      id: 'void',
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
      description: 'All RFI types'
    },
    {
      id: 'General' as const,
      label: 'General',
      icon: MessageSquare,
      description: 'General inquiries and requests'
    },
    {
      id: 'Request for Information' as const,
      label: 'Request for Information',
      icon: HelpCircle,
      description: 'Specific information requests'
    },
    {
      id: 'Advice' as const,
      label: 'Advice',
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
    <div className="h-full border border-muted rounded-lg bg-muted/10 p-3 flex flex-col overflow-y-auto">
      {/* RFI Mail Section */}
      <div className="mb-4">
        <h3 className="text-xs font-medium text-muted-foreground/70 mb-2 uppercase tracking-wide">
          RFI Mail
        </h3>
        <nav className="space-y-0.5">
          {categories.map(({ id, label, icon: Icon, description }) => (
            <button
              key={id}
              onClick={() => onCategoryChange(id)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors ${
                selectedCategory === id
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
              title={description}
            >
              <Icon className="h-3 w-3 flex-shrink-0" />
              <span className="flex-1 text-left truncate">{label}</span>
              {counts && counts[id] > 0 && (
                <span className={`text-xs px-1 py-0.5 rounded-full font-medium ${
                  selectedCategory === id
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
      {/* RFI Status Section */}
      {onStatusChange && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-muted-foreground/70 mb-2 uppercase tracking-wide">
            RFI Status
          </h4>
          <div className="space-y-0.5">
            {statusCategories.map(({ id, label, icon: Icon, description }) => (
              <button
                key={id}
                onClick={() => onStatusChange?.(id as RFIStatusFilter)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors ${
                  selectedStatus === id
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
                title={description}
              >
                <Icon className="h-3 w-3 flex-shrink-0" />
                <span className="flex-1 text-left truncate">{label}</span>
                {statusCounts && statusCounts[id as keyof typeof statusCounts] > 0 && (
                  <span className={`text-xs px-1 py-0.5 rounded-full font-medium ${
                    selectedStatus === id
                      ? 'bg-accent-foreground/20 text-accent-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {statusCounts[id as keyof typeof statusCounts]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* RFI Type Section */}
      {onTypeChange && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-muted-foreground/70 mb-2 uppercase tracking-wide">
            RFI Type
          </h4>
          <div className="space-y-0.5">
            {rfiTypes.map(({ id, label, icon: Icon, description }) => (
              <button
                key={id}
                onClick={() => onTypeChange(id)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors ${
                  selectedType === id
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
                title={description}
              >
                <Icon className="h-3 w-3 flex-shrink-0" />
                <span className="flex-1 text-left truncate">{label}</span>
                {typeCounts && typeCounts[id as keyof typeof typeCounts] > 0 && (
                  <span className={`text-xs px-1 py-0.5 rounded-full font-medium ${
                    selectedType === id
                      ? 'bg-accent-foreground/20 text-accent-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {typeCounts[id as keyof typeof typeCounts]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* RFI Priority Section */}
      {onPriorityChange && (
        <div className="flex-1 min-h-0">
          <h4 className="text-xs font-medium text-muted-foreground/70 mb-2 uppercase tracking-wide">
            RFI Priority
          </h4>
          <div className="space-y-0.5 overflow-y-auto">
            {priorities.map(({ id, label, icon: Icon, description }) => (
              <button
                key={id}
                onClick={() => onPriorityChange(id)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors ${
                  selectedPriority === id
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
                title={description}
              >
                <Icon className="h-3 w-3 flex-shrink-0" />
                <span className="flex-1 text-left truncate">{label}</span>
                {priorityCounts && priorityCounts[id as keyof typeof priorityCounts] > 0 && (
                  <span className={`text-xs px-1 py-0.5 rounded-full font-medium ${
                    selectedPriority === id
                      ? 'bg-accent-foreground/20 text-accent-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {priorityCounts[id as keyof typeof priorityCounts]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};