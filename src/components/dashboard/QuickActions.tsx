import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  FileText, 
  MessageSquare, 
  HelpCircle, 
  Briefcase,
  Upload,
  Users
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export const QuickActions = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const userRole = profile?.role || '';

  const actions = [
    {
      title: 'New Project',
      description: 'Create a new construction project',
      icon: Plus,
      action: () => navigate('/projects'),
      show: userRole === 'lead_consultant' || userRole === 'architect',
      variant: 'default' as const,
    },
    {
      title: 'Upload Document',
      description: 'Add documents to your projects',
      icon: Upload,
      action: () => navigate('/documents'),
      show: true,
      variant: 'outline' as const,
    },
    {
      title: 'Send Message',
      description: 'Communicate with your team',
      icon: MessageSquare,
      action: () => navigate('/messages'),
      show: true,
      variant: 'outline' as const,
    },
    {
      title: 'Create RFI',
      description: 'Request information from the team',
      icon: HelpCircle,
      action: () => navigate('/rfis'),
      show: true,
      variant: 'outline' as const,
    },
    {
      title: 'Create Tender',
      description: 'Issue a new tender for bidding',
      icon: Briefcase,
      action: () => navigate('/tenders'),
      show: userRole === 'lead_consultant' || userRole === 'architect',
      variant: 'outline' as const,
    },
    {
      title: 'View Team',
      description: 'Manage project team members',
      icon: Users,
      action: () => navigate('/projects'),
      show: userRole === 'lead_consultant' || userRole === 'architect',
      variant: 'outline' as const,
    },
  ];

  const visibleActions = actions.filter(action => action.show);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.title}
                variant={action.variant}
                onClick={action.action}
                className="h-auto p-4 flex flex-col items-start gap-2 text-left"
              >
                <div className="flex items-center gap-2 w-full">
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{action.title}</span>
                </div>
                <span className="text-xs text-muted-foreground font-normal">
                  {action.description}
                </span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};