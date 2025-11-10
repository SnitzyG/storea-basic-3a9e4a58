import { PublicLayout } from '@/components/marketing/PublicLayout';
import { FeatureCard } from '@/components/marketing/FeatureCard';
import { usePageMeta } from '@/hooks/usePageMeta';
import { 
  FileText, 
  Users, 
  Calendar, 
  TrendingUp, 
  MessageSquare, 
  Shield,
  Bell,
  Clock,
  Search,
  FolderTree,
  DollarSign,
  BarChart
} from 'lucide-react';

const Features = () => {
  usePageMeta({
    title: 'STOREA Features – Tools to Simplify Project Management',
    description: 'Discover all the tools STOREA offers to manage projects, teams, and documents in one place.'
  });

  const features = [
    {
      icon: FileText,
      title: 'Document Management',
      description: 'Centralize all project documents with version control, easy sharing, and powerful search capabilities.'
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Real-time collaboration tools keep your entire team connected and informed throughout the project.'
    },
    {
      icon: MessageSquare,
      title: 'RFI Management',
      description: 'Streamline requests for information with automated tracking, routing, and response management.'
    },
    {
      icon: DollarSign,
      title: 'Financial Tracking',
      description: 'Monitor budgets, track expenses, manage invoices, and generate financial reports with ease.'
    },
    {
      icon: Calendar,
      title: 'Project Scheduling',
      description: 'Integrated calendar and Gantt charts help you track milestones and keep projects on schedule.'
    },
    {
      icon: TrendingUp,
      title: 'Tender Management',
      description: 'Create, distribute, and evaluate tenders efficiently with built-in comparison tools.'
    },
    {
      icon: Bell,
      title: 'Smart Notifications',
      description: 'Stay updated with intelligent notifications for important project events and deadlines.'
    },
    {
      icon: Clock,
      title: 'Activity Tracking',
      description: 'Comprehensive audit logs and activity feeds keep you informed of all project changes.'
    },
    {
      icon: Search,
      title: 'Global Search',
      description: 'Find any document, message, or project detail instantly with powerful search functionality.'
    },
    {
      icon: FolderTree,
      title: 'Project Organization',
      description: 'Organize multiple projects with customizable folders, tags, and filtering options.'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-level encryption, role-based access control, and compliance with industry standards.'
    },
    {
      icon: BarChart,
      title: 'Analytics & Reports',
      description: 'Generate detailed insights and custom reports to track project performance and trends.'
    }
  ];

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full flex flex-col">
        <div className="max-w-4xl mx-auto text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-800">
            Powerful Features for Modern Construction
          </h1>
          
          <p className="text-lg text-muted-foreground">
            Everything you need to manage construction projects efficiently, all in one integrated platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto flex-1">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </PublicLayout>
  );
};

export default Features;
