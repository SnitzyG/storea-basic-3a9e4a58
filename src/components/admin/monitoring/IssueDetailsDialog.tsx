import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IssueGroup, ErrorDetail } from '@/hooks/useMonitoringData';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { BreadcrumbsViewer } from './BreadcrumbsViewer';

interface IssueDetailsDialogProps {
  issue: IssueGroup;
  open: boolean;
  onClose: () => void;
}

export const IssueDetailsDialog = ({ issue, open, onClose }: IssueDetailsDialogProps) => {
  const [errors, setErrors] = useState<ErrorDetail[]>([]);
  const [selectedError, setSelectedError] = useState<ErrorDetail | null>(null);

  useEffect(() => {
    if (open && issue) {
      fetchErrors();
    }
  }, [open, issue]);

  const fetchErrors = async () => {
    const { data } = await supabase
      .from('telemetry_errors' as any)
      .select('*')
      .eq('issue_group_id', issue.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      setErrors(data as any as ErrorDetail[]);
      if (data.length > 0) setSelectedError(data[0] as any as ErrorDetail);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {issue.error_type}
            <Badge>{issue.severity}</Badge>
            <Badge variant="outline">{issue.environment}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Issue Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Total Occurrences</div>
                <div className="text-2xl font-bold">{issue.occurrence_count}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Affected Users</div>
                <div className="text-2xl font-bold">{issue.affected_users || 0}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">First Seen</div>
                <div className="font-mono text-sm">{format(new Date(issue.first_seen), 'PPpp')}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Last Seen</div>
                <div className="font-mono text-sm">{format(new Date(issue.last_seen), 'PPpp')}</div>
              </div>
            </CardContent>
          </Card>

          {/* Error Details */}
          <Tabs defaultValue="stacktrace">
            <TabsList>
              <TabsTrigger value="stacktrace">Stack Trace</TabsTrigger>
              <TabsTrigger value="breadcrumbs">Breadcrumbs</TabsTrigger>
              <TabsTrigger value="context">Context</TabsTrigger>
              <TabsTrigger value="occurrences">All Occurrences ({errors.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="stacktrace" className="space-y-2">
              {selectedError && (
                <div>
                  <div className="mb-2 text-sm font-medium">
                    {selectedError.error_message}
                  </div>
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                    {selectedError.error_stack}
                  </pre>
                </div>
              )}
            </TabsContent>

            <TabsContent value="breadcrumbs">
              {selectedError && <BreadcrumbsViewer errorId={selectedError.id} />}
            </TabsContent>

            <TabsContent value="context">
              {selectedError && (
                <Card>
                  <CardContent className="pt-6 space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Browser:</span>
                        <span className="ml-2 font-medium">{selectedError.browser}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">OS:</span>
                        <span className="ml-2 font-medium">{selectedError.os}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Device:</span>
                        <span className="ml-2 font-medium">{selectedError.device_type}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Release:</span>
                        <span className="ml-2 font-medium">{selectedError.release_version}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">URL:</span>
                        <span className="ml-2 font-mono text-xs">{selectedError.url}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="occurrences">
              <div className="space-y-2">
                {errors.map((error) => (
                  <Card
                    key={error.id}
                    className={`cursor-pointer ${selectedError?.id === error.id ? 'border-primary' : ''}`}
                    onClick={() => setSelectedError(error)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <div className="font-medium">{format(new Date(error.created_at), 'PPpp')}</div>
                          <div className="text-muted-foreground">{error.url}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{error.browser}</Badge>
                          <Badge variant="outline">{error.device_type}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
