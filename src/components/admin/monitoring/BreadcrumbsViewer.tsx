import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { MousePointer, Navigation, Terminal, Code } from 'lucide-react';

interface Breadcrumb {
  id: string;
  timestamp: string;
  category: string;
  message: string;
  level: string;
  data: any;
}

interface BreadcrumbsViewerProps {
  errorId: string;
}

export const BreadcrumbsViewer = ({ errorId }: BreadcrumbsViewerProps) => {
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);

  useEffect(() => {
    fetchBreadcrumbs();
  }, [errorId]);

  const fetchBreadcrumbs = async () => {
    const { data } = await supabase
      .from('error_breadcrumbs')
      .select('*')
      .eq('error_id', errorId)
      .order('timestamp', { ascending: true });

    if (data) setBreadcrumbs(data);
  };

  const getIcon = (category: string) => {
    switch (category) {
      case 'navigation': return <Navigation className="h-4 w-4" />;
      case 'click': return <MousePointer className="h-4 w-4" />;
      case 'console': return <Terminal className="h-4 w-4" />;
      default: return <Code className="h-4 w-4" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'destructive';
      case 'warning': return 'default';
      default: return 'secondary';
    }
  };

  if (breadcrumbs.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No breadcrumbs recorded</div>;
  }

  return (
    <div className="space-y-2">
      {breadcrumbs.map((bc) => (
        <div key={bc.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
          <div className="mt-0.5">{getIcon(bc.category)}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={getLevelColor(bc.level)} className="text-xs">
                {bc.category}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {format(new Date(bc.timestamp), 'HH:mm:ss.SSS')}
              </span>
            </div>
            <div className="text-sm">{bc.message}</div>
            {bc.data && Object.keys(bc.data).length > 0 && (
              <pre className="text-xs mt-2 text-muted-foreground">
                {JSON.stringify(bc.data, null, 2)}
              </pre>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
