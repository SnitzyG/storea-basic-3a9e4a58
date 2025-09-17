import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Calendar, Flag, Filter } from 'lucide-react';

interface RFIEnhancementsValidatorProps {
  rfis: any[];
}

export const RFIEnhancementsValidator: React.FC<RFIEnhancementsValidatorProps> = ({
  rfis
}) => {
  // Check if RFIs have the new enhancement fields
  const rfisWithPriority = rfis.filter(rfi => rfi.priority);
  const rfisWithDueDates = rfis.filter(rfi => rfi.due_date || rfi.required_response_by);
  
  // Count RFIs by status for grouping validation
  const statusGroups = rfis.reduce((groups, rfi) => {
    const status = rfi.status;
    groups[status] = (groups[status] || 0) + 1;
    return groups;
  }, {} as Record<string, number>);

  // Count RFIs by priority
  const priorityGroups = rfis.reduce((groups, rfi) => {
    const priority = rfi.priority || 'unknown';
    groups[priority] = (groups[priority] || 0) + 1;
    return groups;
  }, {} as Record<string, number>);

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <Card className="mb-4 border-green-200 bg-green-50/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          RFI Enhancements Status
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Flag className="h-3 w-3 text-blue-600" />
            <span>Priority Field: {rfisWithPriority.length}/{rfis.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3 text-orange-600" />
            <span>Due Dates: {rfisWithDueDates.length}/{rfis.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-3 w-3 text-purple-600" />
            <span>Status Groups: {Object.keys(statusGroups).length}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div>
            <h4 className="text-xs font-medium mb-1">Priority Distribution:</h4>
            <div className="flex gap-1">
              {Object.entries(priorityGroups).map(([priority, count]) => (
                <Badge 
                  key={priority} 
                  variant="outline" 
                  className={`text-xs ${
                    priority === 'high' ? 'border-red-300 text-red-700' :
                    priority === 'medium' ? 'border-yellow-300 text-yellow-700' :
                    priority === 'low' ? 'border-green-300 text-green-700' :
                    'border-gray-300 text-gray-700'
                  }`}
                >
                  {String(priority)}: {String(count)}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-medium mb-1">Status Groups:</h4>
            <div className="flex gap-1 flex-wrap">
              {Object.entries(statusGroups).map(([status, count]) => (
                <Badge key={status} variant="secondary" className="text-xs">
                  {String(status)}: {String(count)}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground bg-white/50 p-2 rounded border">
          <strong>New Features:</strong>
          <ul className="mt-1 space-y-0.5 list-disc list-inside">
            <li>✅ Quick date selectors (1 Day, 2 Days, 3 Days, 1 Week)</li>
            <li>✅ Required Priority field (Low, Medium, High)</li>
            <li>✅ Status grouping in categorized inbox</li>
            <li>✅ Priority badges in RFI cards and details</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};