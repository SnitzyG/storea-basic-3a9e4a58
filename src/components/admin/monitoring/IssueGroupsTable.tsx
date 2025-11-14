import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
import { IssueGroup } from '@/hooks/useMonitoringData';
import { format } from 'date-fns';
import { IssueDetailsDialog } from './IssueDetailsDialog';

interface IssueGroupsTableProps {
  issueGroups: IssueGroup[];
  onResolve: (id: string) => void;
  loading: boolean;
}

export const IssueGroupsTable = ({ issueGroups, onResolve, loading }: IssueGroupsTableProps) => {
  const [selectedIssue, setSelectedIssue] = useState<IssueGroup | null>(null);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'ignored': return <XCircle className="h-4 w-4 text-muted-foreground" />;
      default: return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading issues...</div>;
  }

  if (issueGroups.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No issues found in this time range
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Issue</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Occurrences</TableHead>
            <TableHead>Users</TableHead>
            <TableHead>First/Last Seen</TableHead>
            <TableHead>Environment</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {issueGroups.map((issue) => (
            <TableRow key={issue.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{issue.error_type}</div>
                  <div className="text-sm text-muted-foreground truncate max-w-md">
                    {issue.title}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={getSeverityColor(issue.severity)}>
                  {issue.severity}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="font-mono">{issue.occurrence_count}</span>
              </TableCell>
              <TableCell>
                <span className="font-mono">{issue.affected_users || 0}</span>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <div>{format(new Date(issue.first_seen), 'MMM d, HH:mm')}</div>
                  <div className="text-muted-foreground">
                    {format(new Date(issue.last_seen), 'MMM d, HH:mm')}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{issue.environment}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {getStatusIcon(issue.status)}
                  <span className="text-sm capitalize">{issue.status}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedIssue(issue)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {issue.status === 'open' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onResolve(issue.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Resolve
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedIssue && (
        <IssueDetailsDialog
          issue={selectedIssue}
          open={!!selectedIssue}
          onClose={() => setSelectedIssue(null)}
        />
      )}
    </>
  );
};

import { AlertCircle } from 'lucide-react';
