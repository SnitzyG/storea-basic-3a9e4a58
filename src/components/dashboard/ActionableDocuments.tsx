import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Clock, User } from 'lucide-react';
import { useDocuments } from '@/hooks/useDocuments';
import { format } from 'date-fns';

export const ActionableDocuments = () => {
  const { documents, loading } = useDocuments(); // Get all documents across projects

  // Filter documents that need action (draft, under review)
  const actionableDocuments = documents.filter(doc => 
    doc.status === 'draft' || 
    doc.status === 'under_review'
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'under_review': return 'default';
      case 'draft': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'under_review': return 'Under Review';
      case 'draft': return 'Draft';
      default: return status;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Actionable Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Actionable Documents ({actionableDocuments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {actionableDocuments.length === 0 ? (
          <div className="text-sm text-muted-foreground">No documents requiring action</div>
        ) : (
          actionableDocuments.slice(0, 5).map((document) => (
            <div key={document.id} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-sm">{document.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={getStatusColor(document.status)} className="text-xs">
                      {getStatusLabel(document.status)}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      v{document.version}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Uploaded by user
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(document.updated_at), 'MMM d')}
                </div>
              </div>
            </div>
          ))
        )}
        
        {actionableDocuments.length > 5 && (
          <Button variant="outline" size="sm" className="w-full">
            View All ({actionableDocuments.length - 5} more)
          </Button>
        )}
      </CardContent>
    </Card>
  );
};