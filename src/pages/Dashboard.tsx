import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  FolderOpen, 
  FileStack, 
  MessageSquare, 
  HelpCircle, 
  Briefcase,
  ArrowRight
} from 'lucide-react';

const Dashboard = () => {
  const { profile } = useAuth();

  const getQuickActions = (role: string) => {
    const baseActions = [
      { 
        title: 'View Projects', 
        description: 'Manage your construction projects',
        icon: FolderOpen, 
        path: '/projects',
        color: 'text-blue-600'
      },
      { 
        title: 'Documents', 
        description: 'Access project documents',
        icon: FileStack, 
        path: '/documents',
        color: 'text-green-600'
      },
      { 
        title: 'Messages', 
        description: 'Communicate with your team',
        icon: MessageSquare, 
        path: '/messages',
        color: 'text-purple-600'
      },
      { 
        title: 'RFIs', 
        description: 'Request for Information',
        icon: HelpCircle, 
        path: '/rfis',
        color: 'text-orange-600'
      }
    ];

    if (role !== 'homeowner') {
      baseActions.splice(1, 0, {
        title: 'Tenders',
        description: 'Manage bidding process',
        icon: Briefcase,
        path: '/tenders',
        color: 'text-indigo-600'
      });
    }

    return baseActions;
  };

  const quickActions = getQuickActions(profile?.role || 'contractor');

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'architect':
        return 'Create and manage projects, invite team members, and oversee the entire construction process.';
      case 'builder':
        return 'View assigned projects, submit bids, upload documents, and respond to RFIs.';
      case 'homeowner':
        return 'Track project progress, upload documents, create RFIs, and communicate with your team.';
      case 'contractor':
        return 'View assigned work, submit bids, respond to RFIs, and upload progress documents.';
      default:
        return 'Welcome to STOREA Basic construction management platform.';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {profile?.name}! {getRoleDescription(profile?.role || '')}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Card key={action.path} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Icon className={`h-8 w-8 ${action.color}`} />
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
                <CardTitle className="text-lg">{action.title}</CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link to={action.path}>
                    Open {action.title}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Start Guide</CardTitle>
          <CardDescription>Get started with STOREA Basic</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {profile?.role === 'architect' && (
              <div className="space-y-2">
                <h4 className="font-medium">For Architects:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Create your first project with details and timeline</li>
                  <li>• Invite team members (builders, contractors, homeowners)</li>
                  <li>• Set up document structure and approval workflows</li>
                  <li>• Create tenders for contractors to bid on</li>
                </ul>
              </div>
            )}
            
            {profile?.role === 'builder' && (
              <div className="space-y-2">
                <h4 className="font-medium">For Builders:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• View projects you've been assigned to</li>
                  <li>• Submit bids on available tenders</li>
                  <li>• Upload progress documents and photos</li>
                  <li>• Respond to RFIs from the project team</li>
                </ul>
              </div>
            )}

            {profile?.role === 'homeowner' && (
              <div className="space-y-2">
                <h4 className="font-medium">For Homeowners:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• Track the progress of your construction project</li>
                  <li>• Upload documents and communicate with your team</li>
                  <li>• Create RFIs to ask questions about the project</li>
                  <li>• Review and approve important project documents</li>
                </ul>
              </div>
            )}

            {profile?.role === 'contractor' && (
              <div className="space-y-2">
                <h4 className="font-medium">For Contractors:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• View work assignments on active projects</li>
                  <li>• Submit competitive bids on available tenders</li>
                  <li>• Upload work progress and completion documents</li>
                  <li>• Respond to technical RFIs in your specialty</li>
                </ul>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;