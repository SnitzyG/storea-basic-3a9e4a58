import React from 'react';
import { Badge } from '@/components/ui/badge';

export type EnhancedRFIStatus = 
  | 'draft' 
  | 'sent' 
  | 'received' 
  | 'outstanding' 
  | 'overdue' 
  | 'in_review' 
  | 'submitted' 
  | 'open' 
  | 'answered' 
  | 'rejected' 
  | 'closed'
  | 'void';

interface RFIStatusBadgeProps {
  status: EnhancedRFIStatus;
  className?: string;
}

// Enhanced status color system with semantic design tokens
const statusConfig = {
  draft: {
    label: 'Draft',
    variant: 'secondary' as const,
    className: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600'
  },
  sent: {
    label: 'Sent',
    variant: 'outline' as const,
    className: 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-700'
  },
  received: {
    label: 'Received',
    variant: 'outline' as const,
    className: 'bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-400 dark:border-indigo-700'
  },
  outstanding: {
    label: 'Outstanding',
    variant: 'outline' as const,
    className: 'bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-600'
  },
  overdue: {
    label: 'Overdue',
    variant: 'destructive' as const,
    className: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-400 dark:border-red-700'
  },
  in_review: {
    label: 'In Review',
    variant: 'outline' as const,
    className: 'bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-700'
  },
  submitted: {
    label: 'Submitted',
    variant: 'outline' as const,
    className: 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-700'
  },
  open: {
    label: 'Open',
    variant: 'outline' as const,
    className: 'bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-600'
  },
  answered: {
    label: 'Answered',
    variant: 'default' as const,
    className: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-400 dark:border-green-600'
  },
  rejected: {
    label: 'Rejected',
    variant: 'destructive' as const,
    className: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800'
  },
  closed: {
    label: 'Closed',
    variant: 'secondary' as const,
    className: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600'
  },
  void: {
    label: 'Void',
    variant: 'destructive' as const,
    className: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-400 dark:border-red-700'
  }
};

// Status priority for sorting (higher number = more urgent)
export const statusPriority: Record<EnhancedRFIStatus, number> = {
  overdue: 10,
  outstanding: 9,
  open: 8,
  submitted: 7,
  in_review: 6,
  received: 5,
  sent: 4,
  answered: 3,
  rejected: 2,
  closed: 1,
  void: 0,
  draft: 0
};

// Status workflow transitions
export const statusWorkflow: Record<EnhancedRFIStatus, EnhancedRFIStatus[]> = {
  draft: ['submitted', 'sent'],
  sent: ['received', 'outstanding'],
  received: ['outstanding', 'in_review'],
  outstanding: ['overdue', 'in_review', 'answered'],
  overdue: ['in_review', 'answered'],
  in_review: ['answered', 'rejected', 'outstanding'],
  submitted: ['open'],
  open: ['answered', 'rejected'],
  answered: ['closed'],
  rejected: ['open', 'draft'],
  closed: [],
  void: []
};

export const RFIStatusBadge: React.FC<RFIStatusBadgeProps> = ({ 
  status, 
  className = '' 
}) => {
  const config = statusConfig[status];
  
  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} ${className} font-medium`}
    >
      {config.label}
    </Badge>
  );
};

// Utility function to get next possible statuses
export const getNextStatuses = (currentStatus: EnhancedRFIStatus): EnhancedRFIStatus[] => {
  return statusWorkflow[currentStatus] || [];
};

// Utility function to determine if a status is urgent
export const isUrgentStatus = (status: EnhancedRFIStatus): boolean => {
  return ['overdue', 'outstanding', 'open', 'submitted'].includes(status);
};

// Utility function to determine if a status is completed
export const isCompletedStatus = (status: EnhancedRFIStatus): boolean => {
  return ['answered', 'closed', 'rejected', 'void'].includes(status);
};