import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDocumentsMonitoring } from '@/hooks/useDocumentsMonitoring';
import { Skeleton } from '@/components/ui/skeleton';

export const DocumentsOverviewCard = () => {
  const navigate = useNavigate();
  const { stats, loading } = useDocumentsMonitoring();

  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Documents Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{stats?.totalDocuments || 0}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Today</p>
            <p className="text-2xl font-bold text-primary">{stats?.uploadedToday || 0}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">This Week</p>
            <p className="text-2xl font-bold">{stats?.uploadedThisWeek || 0}</p>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Recent Uploads</h4>
          {stats?.recentUploads.slice(0, 5).map((doc: any) => (
            <div key={doc.id} className="flex items-center justify-between text-sm">
              <span className="truncate">{doc.name}</span>
              <span className="text-muted-foreground text-xs">{doc.category}</span>
            </div>
          ))}
        </div>

        <Button onClick={() => navigate('/documents')} className="w-full" variant="outline">
          View All Documents
        </Button>
      </CardContent>
    </Card>
  );
};
