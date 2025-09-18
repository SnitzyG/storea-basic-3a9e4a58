import React from 'react';
import { Inbox, Send, FileEdit, Archive, MessageSquare, Clock, CheckCircle, XCircle, Trash } from 'lucide-react';

export type RFIInboxCategory = 'all' | 'sent' | 'received' | 'unresponded' | 'responded' | 'drafts';
export type RFIStatusFilter = 'all' | 'outstanding' | 'answered' | 'rejected' | 'closed' | 'void' | 'draft' | 'submitted' | 'open';

interface RFIInboxProps {
  selectedCategory: RFIInboxCategory;
  onCategoryChange: (category: RFIInboxCategory) => void;
  selectedStatus?: RFIStatusFilter;
  onStatusChange?: (status: RFIStatusFilter) => void;
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
}

export const RFIInbox = ({ 
  selectedCategory, 
  onCategoryChange, 
  selectedStatus = 'all',
  onStatusChange,
  counts, 
  statusCounts 
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

  return (
    <div className="h-full border border-muted rounded-lg bg-muted/10 p-3 overflow-hidden">
      <h3 className="text-xs font-medium text-muted-foreground/70 mb-4 uppercase tracking-wide">
        RFI Inbox
      </h3>
      <nav className="space-y-1 flex-1 min-h-0 overflow-y-auto">
        {categories.map(({ id, label, icon: Icon, description }) => (
          <button
            key={id}
            onClick={() => onCategoryChange(id)}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
              selectedCategory === id
                ? 'bg-accent text-accent-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
            title={description}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1 text-left truncate">{label}</span>
            {counts && counts[id] > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                selectedCategory === id
                  ? 'bg-accent-foreground/20 text-accent-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {counts[id]}
              </span>
            )}
          </button>
        ))}
        
        {/* RFI Status Section */}
        <div className="mt-6">
          <h4 className="text-xs font-medium text-muted-foreground/70 mb-3 uppercase tracking-wide">
            RFI Status
          </h4>
          <div className="space-y-1">
            {statusCategories.map(({ id, label, icon: Icon, description }) => (
              <button
                key={id}
                onClick={() => onStatusChange?.(id as RFIStatusFilter)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                  selectedStatus === id
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
                title={description}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1 text-left truncate">{label}</span>
                {statusCounts && statusCounts[id as keyof typeof statusCounts] > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
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
      </nav>
    </div>
  );
};