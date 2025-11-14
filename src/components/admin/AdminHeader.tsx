import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface AdminHeaderProps {
  stats: {
    projects: { active: number; healthScore: number };
    team: { onlineUsers: number; pendingApprovals: number };
    financial: { utilizationPercent: number };
  } | null;
  lastUpdate: Date;
  onRefresh: () => void;
  loading?: boolean;
}

export const AdminHeader = ({ stats, lastUpdate, onRefresh, loading }: AdminHeaderProps) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {getGreeting()}, Admin
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Updated {formatDistanceToNow(lastUpdate, { addSuffix: true })}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">Active Projects</div>
            <div className="text-2xl font-bold">{stats.projects.active}</div>
          </div>
          
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">Team Online</div>
            <div className="text-2xl font-bold text-green-600">{stats.team.onlineUsers}</div>
          </div>
          
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">Pending Approvals</div>
            <div className="text-2xl font-bold text-orange-600">{stats.team.pendingApprovals}</div>
          </div>
          
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg p-4">
            <div className="text-xs text-muted-foreground mb-1">Budget Health</div>
            <div className={`text-2xl font-bold ${
              stats.financial.utilizationPercent > 90 
                ? 'text-red-600' 
                : stats.financial.utilizationPercent > 75 
                ? 'text-yellow-600' 
                : 'text-green-600'
            }`}>
              {100 - stats.financial.utilizationPercent}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
