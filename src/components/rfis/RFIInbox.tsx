import React from 'react';
import { Inbox, Send, FileEdit, Archive, MessageSquare } from 'lucide-react';

export type RFIInboxCategory = 'all' | 'sent' | 'received' | 'unresponded' | 'drafts';

interface RFIInboxProps {
  selectedCategory: RFIInboxCategory;
  onCategoryChange: (category: RFIInboxCategory) => void;
  counts?: {
    all: number;
    sent: number;
    received: number;
    unresponded: number;
    drafts: number;
  };
}

export const RFIInbox = ({ selectedCategory, onCategoryChange, counts }: RFIInboxProps) => {
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
      id: 'drafts' as const,
      label: 'Draft RFIs',
      icon: FileEdit,
      description: 'RFIs created but not yet sent'
    }
  ];

  return (
    <div className="h-full border border-muted rounded-lg bg-muted/10 p-3 overflow-hidden">
      <h3 className="text-xs font-medium text-muted-foreground/70 mb-4 uppercase tracking-wide">
        RFI Inbox
      </h3>
      <nav className="space-y-1">
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
      </nav>
    </div>
  );
};