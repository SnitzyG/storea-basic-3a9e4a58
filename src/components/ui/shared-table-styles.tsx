import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Shared table styling configurations
export const sharedTableClasses = {
  tableContainer: "space-y-4",
  tableCard: "border-0 shadow-sm bg-card",
  tableCardContent: "p-0",
  tableHeader: "bg-muted border-b-2 border-primary/10",
  tableHeaderRow: "",
  tableHeaderCell: "text-foreground/80 font-semibold text-sm h-12 px-4 cursor-pointer hover:bg-muted/30 transition-colors",
  tableBody: "",
  tableBodyRow: "hover:bg-muted/30 transition-all duration-200 cursor-pointer border-b border-muted/20",
  tableBodyRowSelected: "bg-accent/20",
  tableBodyRowHighlight: "bg-muted/40",
  tableBodyCell: "text-sm px-4 py-3 text-foreground/90",
  tableCellTitle: "font-medium text-sm leading-none text-foreground",
  tableCellSubtitle: "text-xs text-muted-foreground mt-1",
  tableCellMono: "font-mono text-xs text-muted-foreground",
  tableCellActions: "w-[50px] text-center",
  tableCellCheckbox: "w-[40px] text-center"
};

// Shared badge styling configurations
export const sharedBadgeStyles = {
  status: {
    draft: 'bg-slate-100 text-slate-700 border border-slate-300',
    sent: 'bg-blue-50 text-blue-700 border border-blue-300',
    received: 'bg-indigo-50 text-indigo-700 border border-indigo-300',
    outstanding: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    overdue: 'bg-red-100 text-red-800 border border-red-200',
    in_review: 'bg-purple-50 text-purple-700 border border-purple-300',
    answered: 'bg-green-100 text-green-800 border border-green-200',
    rejected: 'bg-red-50 text-red-600 border border-red-200',
    closed: 'bg-gray-100 text-gray-800 border border-gray-200',
    current: 'bg-green-100 text-green-800 border border-green-200',
    superseded: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    archived: 'bg-gray-100 text-gray-800 border border-gray-200',
    planning: 'bg-blue-100 text-blue-800 border border-blue-200',
    active: 'bg-green-100 text-green-800 border border-green-200',
    on_hold: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    completed: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    cancelled: 'bg-red-100 text-red-800 border border-red-200'
  },
  priority: {
    low: 'bg-blue-100 text-blue-800 border border-blue-200',
    medium: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    high: 'bg-orange-100 text-orange-800 border border-orange-200',
    critical: 'bg-red-100 text-red-800 border border-red-200'
  },
  category: 'bg-muted/50 text-foreground border border-muted',
  revision: 'bg-primary/10 text-primary border border-primary/20 font-mono'
};

// Shared styled components
interface SharedTableProps {
  children: React.ReactNode;
  className?: string;
}

export const SharedTableContainer: React.FC<SharedTableProps> = ({ children, className }) => (
  <div className={cn(sharedTableClasses.tableContainer, className)}>
    {children}
  </div>
);

export const SharedTableCard: React.FC<SharedTableProps> = ({ children, className }) => (
  <Card className={cn(sharedTableClasses.tableCard, className)}>
    <CardContent className={sharedTableClasses.tableCardContent}>
      {children}
    </CardContent>
  </Card>
);

export const SharedTable: React.FC<SharedTableProps> = ({ children, className }) => (
  <Table className={className}>
    {children}
  </Table>
);

export const SharedTableHeader: React.FC<SharedTableProps> = ({ children, className }) => (
  <TableHeader className={cn(sharedTableClasses.tableHeader, className)}>
    <TableRow className={sharedTableClasses.tableHeaderRow}>
      {children}
    </TableRow>
  </TableHeader>
);

export const SharedTableHead: React.FC<SharedTableProps> = ({ children, className }) => (
  <TableHead className={cn(sharedTableClasses.tableHeaderCell, className)}>
    {children}
  </TableHead>
);

export const SharedTableBody: React.FC<SharedTableProps> = ({ children, className }) => (
  <TableBody className={cn(sharedTableClasses.tableBody, className)}>
    {children}
  </TableBody>
);

interface SharedTableRowProps extends SharedTableProps {
  isSelected?: boolean;
  isHighlighted?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
}

export const SharedTableRow: React.FC<SharedTableRowProps> = ({ 
  children, 
  className, 
  isSelected, 
  isHighlighted,
  onClick,
  onDoubleClick 
}) => (
  <TableRow 
    className={cn(
      sharedTableClasses.tableBodyRow,
      isSelected && sharedTableClasses.tableBodyRowSelected,
      isHighlighted && sharedTableClasses.tableBodyRowHighlight,
      className
    )}
    onClick={onClick}
    onDoubleClick={onDoubleClick}
  >
    {children}
  </TableRow>
);

export const SharedTableCell: React.FC<SharedTableProps> = ({ children, className }) => (
  <TableCell className={cn(sharedTableClasses.tableBodyCell, className)}>
    {children}
  </TableCell>
);

// Shared badge component with consistent styling
interface SharedBadgeProps {
  variant: 'status' | 'priority' | 'category' | 'revision';
  value: string;
  className?: string;
}

export const SharedBadge: React.FC<SharedBadgeProps> = ({ variant, value, className }) => {
  const getStyles = () => {
    if (variant === 'status') {
      return sharedBadgeStyles.status[value as keyof typeof sharedBadgeStyles.status] || sharedBadgeStyles.status.draft;
    }
    if (variant === 'priority') {
      return sharedBadgeStyles.priority[value as keyof typeof sharedBadgeStyles.priority] || sharedBadgeStyles.priority.low;
    }
    if (variant === 'category') {
      return sharedBadgeStyles.category;
    }
    if (variant === 'revision') {
      return sharedBadgeStyles.revision;
    }
    return '';
  };

  return (
    <Badge className={cn('text-xs font-medium', getStyles(), className)}>
      {value}
    </Badge>
  );
};

// Shared cell content components
interface TitleCellProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export const SharedTitleCell: React.FC<TitleCellProps> = ({ title, subtitle, className }) => (
  <div className={cn("space-y-1", className)}>
    <p className={sharedTableClasses.tableCellTitle}>
      {title}
    </p>
    {subtitle && (
      <p className={sharedTableClasses.tableCellSubtitle}>
        {subtitle}
      </p>
    )}
  </div>
);

export const SharedMonoCell: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <span className={cn(sharedTableClasses.tableCellMono, className)}>
    {children}
  </span>
);