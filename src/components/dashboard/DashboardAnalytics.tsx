import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useProjects } from '@/hooks/useProjects';
import { useRFIs } from '@/hooks/useRFIs';
import { useTenders } from '@/hooks/useTenders';
import { useAuth } from '@/hooks/useAuth';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  DollarSign
} from 'lucide-react';

export const DashboardAnalytics = () => {
  const { projects } = useProjects();
  const { profile } = useAuth();
  const userRole = profile?.role || '';

  // Get project IDs for analytics
  const projectIds = projects.map(p => p.id);
  
  // For demo purposes, we'll use the first project's data
  // In a real app, you'd aggregate across all projects
  const firstProject = projects[0];
  const { rfis } = useRFIs();
  const { tenders } = useTenders(firstProject?.id);

  // Calculate RFI metrics
  const totalRFIs = rfis.length;
  const openRFIs = rfis.filter(rfi => rfi.status !== 'closed').length;
  const overdueRFIs = rfis.filter(rfi => 
    rfi.due_date && 
    new Date(rfi.due_date) < new Date() && 
    rfi.status !== 'closed'
  ).length;
  const rfiResponseRate = totalRFIs > 0 ? 
    ((rfis.filter(rfi => rfi.status === 'answered' || rfi.status === 'closed').length / totalRFIs) * 100) : 0;

  // Calculate tender metrics
  const totalTenders = tenders.length;
  const activeTenders = tenders.filter(t => t.status === 'open').length;
  const awardedTenders = tenders.filter(t => t.status === 'awarded').length;
  const tenderSuccessRate = totalTenders > 0 ? ((awardedTenders / totalTenders) * 100) : 0;
  const averageBids = totalTenders > 0 ? 
    (tenders.reduce((sum, t) => sum + (t.bid_count || 0), 0) / totalTenders) : 0;

  // Calculate project health score (demo calculation)
  const projectHealthScore = Math.round(
    (projects.filter(p => p.status === 'active').length / Math.max(projects.length, 1)) * 100
  );

  return (
    <div className="space-y-6">
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Project Health</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectHealthScore}%</div>
            <Progress value={projectHealthScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open RFIs</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{openRFIs}</div>
            {overdueRFIs > 0 && (
              <Badge variant="destructive" className="mt-1">
                {overdueRFIs} overdue
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">RFI Response Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{rfiResponseRate.toFixed(1)}%</div>
            <Progress value={rfiResponseRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tenders</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTenders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {averageBids.toFixed(1)} avg bids per tender
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* RFI Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              RFI Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Open</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-muted rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${totalRFIs > 0 ? (rfis.filter(r => r.status === 'outstanding').length / totalRFIs) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-8">
                  {rfis.filter(r => r.status === 'outstanding').length}
                </span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">Submitted</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-muted rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full" 
                    style={{ width: `${totalRFIs > 0 ? (rfis.filter(r => r.status === 'overdue').length / totalRFIs) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-8">
                  {rfis.filter(r => r.status === 'overdue').length}
                </span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">Answered</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-muted rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${totalRFIs > 0 ? (rfis.filter(r => r.status === 'answered').length / totalRFIs) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-8">
                  {rfis.filter(r => r.status === 'answered').length}
                </span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm">Closed</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-muted rounded-full h-2">
                  <div 
                    className="bg-gray-500 h-2 rounded-full" 
                    style={{ width: `${totalRFIs > 0 ? (rfis.filter(r => r.status === 'closed').length / totalRFIs) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-8">
                  {rfis.filter(r => r.status === 'closed').length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tender Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Tender Success
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{totalTenders}</div>
                <div className="text-xs text-muted-foreground">Total Tenders</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{tenderSuccessRate.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">Success Rate</div>
              </div>
            </div>
            
            <div className="space-y-3">
              {Object.entries({
                draft: 'Draft',
                open: 'Open',
                closed: 'Closed',
                awarded: 'Awarded',
                cancelled: 'Cancelled'
              }).map(([status, label]) => {
                const count = tenders.filter(t => t.status === status).length;
                const percentage = totalTenders > 0 ? (count / totalTenders) * 100 : 0;
                
                return (
                  <div key={status} className="flex justify-between items-center">
                    <span className="text-sm">{label}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            status === 'draft' ? 'bg-gray-500' :
                            status === 'open' ? 'bg-green-500' :
                            status === 'closed' ? 'bg-yellow-500' :
                            status === 'awarded' ? 'bg-blue-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-6">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Recommendations */}
      {(overdueRFIs > 0 || activeTenders === 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-5 w-5" />
              Action Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {overdueRFIs > 0 && (
              <p className="text-sm text-orange-700">
                • {overdueRFIs} RFI{overdueRFIs > 1 ? 's are' : ' is'} overdue and need{overdueRFIs === 1 ? 's' : ''} attention
              </p>
            )}
            {activeTenders === 0 && totalTenders > 0 && userRole === 'lead_consultant' && (
              <p className="text-sm text-orange-700">
                • No active tenders - consider publishing draft tenders to maintain project momentum
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};