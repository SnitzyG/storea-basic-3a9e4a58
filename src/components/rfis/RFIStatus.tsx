import React from 'react';
import { FileText, Send, Clock, CheckCircle, XCircle, Archive, Trash } from 'lucide-react';

export type RFIStatusFilter = 'all' | 'draft' | 'submitted' | 'open' | 'answered' | 'rejected' | 'closed' | 'void';

interface RFIStatusProps {
  selectedStatus: RFIStatusFilter;
  onStatusChange: (status: RFIStatusFilter) => void;
  counts?: {
    all: number;
    draft: number;
    submitted: number;
    open: number;
    answered: number;
    rejected: number;
    closed: number;
    void: number;
  };
}

export const RFIStatus = ({ selectedStatus, onStatusChange, counts }: RFIStatusProps) => {
  const statuses = [
    {
      id: 'all' as const,
      label: 'All Statuses',
      icon: Archive,
      description: 'All RFIs regardless of status'
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

  return (
    <div className="h-full border border-muted rounded-lg bg-muted/10 p-3 overflow-hidden">
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
  );
};