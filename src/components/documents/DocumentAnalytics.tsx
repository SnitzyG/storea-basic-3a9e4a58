import React from 'react';
import { BarChart, Eye, Download, Users, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface DocumentAnalyticsData {
  views: number;
  downloads: number;
  collaborators: number;
  versions: number;
  avgTimeSpent: string;
  popularActions: Array<{
    action: string;
    count: number;
    percentage: number;
  }>;
}

interface DocumentAnalyticsProps {
  documentId: string;
  data: DocumentAnalyticsData;
}

export const DocumentAnalytics: React.FC<DocumentAnalyticsProps> = ({
  documentId,
  data
}) => {
  const stats = [
    {
      label: 'Total Views',
      value: data.views,
      icon: Eye,
      color: 'text-blue-500'
    },
    {
      label: 'Downloads',
      value: data.downloads,
      icon: Download,
      color: 'text-green-500'
    },
    {
      label: 'Collaborators',
      value: data.collaborators,
      icon: Users,
      color: 'text-purple-500'
    },
    {
      label: 'Versions',
      value: data.versions,
      icon: BarChart,
      color: 'text-orange-500'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart className="h-5 w-5" />
          Document Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="space-y-2">
              <div className="flex items-center gap-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Average Time Spent */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Avg. Time Spent</span>
          </div>
          <div className="text-lg font-semibold">{data.avgTimeSpent}</div>
        </div>

        {/* Popular Actions */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Popular Actions</h4>
          <div className="space-y-2">
            {data.popularActions.map((action) => (
              <div key={action.action} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="capitalize">{action.action}</span>
                  <span className="text-muted-foreground">{action.count}</span>
                </div>
                <Progress value={action.percentage} className="h-2" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};