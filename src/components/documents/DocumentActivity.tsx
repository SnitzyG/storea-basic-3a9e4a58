import React, { useState, useEffect } from 'react';
import { Clock, User, Eye, Edit, Download, Share, FileText, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Document } from '@/hooks/useDocuments';

interface ActivityEntry {
  id: string;
  type: 'viewed' | 'edited' | 'downloaded' | 'shared' | 'created' | 'version_created';
  user_id: string;
  user_name?: string;
  timestamp: string;
  details?: string;
  version?: number;
}

interface DocumentActivityProps {
  document: Document;
}

export const DocumentActivity: React.FC<DocumentActivityProps> = ({ document }) => {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocumentActivity();
  }, [document.id]);

  const fetchDocumentActivity = async () => {
    try {
      setLoading(true);
      
      // Fetch document versions for version-related activities
      const { data: versions } = await supabase
        .from('document_versions')
        .select('*')
        .eq('document_id', document.id)
        .order('created_at', { ascending: false });

      // Use existing activity_log table for document activities
      const { data: activityLogs } = await supabase
        .from('activity_log')
        .select('*')
        .eq('entity_id', document.id)
        .eq('entity_type', 'document')
        .order('created_at', { ascending: false });

      // Combine activities from different sources
      const allActivities: ActivityEntry[] = [];

      // Add creation activity
      allActivities.push({
        id: `created-${document.id}`,
        type: 'created',
        user_id: document.uploaded_by,
        timestamp: document.created_at,
        details: 'Document created'
      });

      // Add version activities
      versions?.forEach((version, index) => {
        allActivities.push({
          id: `version-${version.id}`,
          type: 'version_created',
          user_id: version.uploaded_by,
          timestamp: version.created_at,
          details: version.changes_summary || `Revision ${String.fromCharCode(65 + version.version_number - 1)} created`,
          version: version.version_number
        });
      });

      // Add activity log entries
      activityLogs?.forEach((log) => {
        allActivities.push({
          id: log.id,
          type: log.action as any,
          user_id: log.user_id,
          timestamp: log.created_at,
          details: log.description
        });
      });

      // Sort by timestamp (most recent first)
      allActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Fetch user names
      const uniqueUserIds = [...new Set(allActivities.map(a => a.user_id))];
      const userNames: Record<string, string> = {};
      
      for (const userId of uniqueUserIds) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('user_id', userId)
            .single();
          userNames[userId] = profile?.name || 'Unknown User';
        } catch {
          userNames[userId] = 'Unknown User';
        }
      }

      // Add user names to activities
      const activitiesWithNames = allActivities.map(activity => ({
        ...activity,
        user_name: userNames[activity.user_id]
      }));

      setActivities(activitiesWithNames);
    } catch (error) {
      console.error('Error fetching document activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'viewed':
        return <Eye className="h-4 w-4 text-blue-500" />;
      case 'edited':
        return <Edit className="h-4 w-4 text-green-500" />;
      case 'downloaded':
        return <Download className="h-4 w-4 text-purple-500" />;
      case 'shared':
        return <Share className="h-4 w-4 text-orange-500" />;
      case 'created':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'version_created':
        return <Calendar className="h-4 w-4 text-indigo-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'viewed':
        return 'bg-blue-50 border-blue-200';
      case 'edited':
        return 'bg-green-50 border-green-200';
      case 'downloaded':
        return 'bg-purple-50 border-purple-200';
      case 'shared':
        return 'bg-orange-50 border-orange-200';
      case 'created':
        return 'bg-blue-100 border-blue-300';
      case 'version_created':
        return 'bg-indigo-50 border-indigo-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatActivityType = (type: string) => {
    switch (type) {
      case 'viewed':
        return 'Viewed';
      case 'edited':
        return 'Edited';
      case 'downloaded':
        return 'Downloaded';
      case 'shared':
        return 'Shared';
      case 'created':
        return 'Created';
      case 'version_created':
        return 'New Version';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Document Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading activity...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Document Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={activity.id}>
                <div className={`flex items-start gap-3 p-3 rounded-lg border ${getActivityColor(activity.type)}`}>
                  <div className="flex-shrink-0 mt-1">
                    {getActivityIcon(activity.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {formatActivityType(activity.type)}
                      </Badge>
                      {activity.version && (
                        <Badge variant="secondary" className="text-xs">
                          Rev {String.fromCharCode(64 + activity.version)}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-sm font-medium text-foreground">
                      {activity.details}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                      <User className="h-3 w-3" />
                      <span>{activity.user_name}</span>
                      <Separator orientation="vertical" className="h-3" />
                      <Clock className="h-3 w-3" />
                      <span>{format(new Date(activity.timestamp), 'MMM dd, yyyy HH:mm')}</span>
                    </div>
                  </div>
                </div>
                
                {index < activities.length - 1 && (
                  <div className="flex justify-center my-2">
                    <div className="w-px h-4 bg-border" />
                  </div>
                )}
              </div>
            ))}
            
            {activities.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No activity recorded yet</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};