import { useEffect } from 'react';
import { PublicLayout } from '@/components/marketing/PublicLayout';
import { FeatureCard } from '@/components/marketing/FeatureCard';
import { usePageMeta } from '@/hooks/usePageMeta';
import { Breadcrumbs } from '@/components/marketing/Breadcrumbs';
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
    title: 'Construction Project Management Features | STOREA',
    description: 'Explore STOREA\'s comprehensive construction management features: document control, RFI tracking, tender management, team collaboration, and financial tools for Australian builders.',
    canonicalPath: '/features',
    imageUrl: '/og-features.jpg'
  });

  useEffect(() => {
    // Add ItemList structured data for features
    const itemListSchema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "STOREA Construction Management Features",
      "description": "Comprehensive list of features offered by STOREA for construction project management",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Document Management",
          "description": "Centralize all project documents with version control, easy sharing, and powerful search capabilities."
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Team Collaboration",
          "description": "Real-time collaboration tools keep your entire team connected and informed throughout the project."
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "RFI Management",
          "description": "Streamline requests for information with automated tracking, routing, and response management."
        },
        {
          "@type": "ListItem",
          "position": 4,
          "name": "Financial Tracking",
          "description": "Monitor budgets, track expenses, manage invoices, and generate financial reports with ease."
        },
        {
          "@type": "ListItem",
          "position": 5,
          "name": "Project Scheduling",
          "description": "Integrated calendar and Gantt charts help you track milestones and keep projects on schedule."
        },
        {
          "@type": "ListItem",
          "position": 6,
          "name": "Tender Management",
          "description": "Create, distribute, and evaluate tenders efficiently with built-in comparison tools."
        },
        {
          "@type": "ListItem",
          "position": 7,
          "name": "Smart Notifications",
          "description": "Stay updated with intelligent notifications for important project events and deadlines."
        },
        {
          "@type": "ListItem",
          "position": 8,
          "name": "Activity Tracking",
          "description": "Comprehensive audit logs and activity feeds keep you informed of all project changes."
        },
        {
          "@type": "ListItem",
          "position": 9,
          "name": "Global Search",
          "description": "Find any document, message, or project detail instantly with powerful search functionality."
        },
        {
          "@type": "ListItem",
          "position": 10,
          "name": "Project Organization",
          "description": "Organize multiple projects with customizable folders, tags, and filtering options."
        },
        {
          "@type": "ListItem",
          "position": 11,
          "name": "Enterprise Security",
          "description": "Bank-level encryption, role-based access control, and compliance with industry standards."
        },
        {
          "@type": "ListItem",
          "position": 12,
          "name": "Analytics & Reports",
          "description": "Generate detailed insights and custom reports to track project performance and trends."
        }
      ]
    };

    let script = document.querySelector('script[data-features-schema]');
    if (!script) {
      script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('data-features-schema', 'true');
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(itemListSchema);

    return () => {
      const existingScript = document.querySelector('script[data-features-schema]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

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
        <Breadcrumbs />
        <div className="max-w-4xl mx-auto text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-800">
            Powerful Features for Modern Construction
          </h1>
          
          <p className="text-lg text-muted-foreground">
            Everything you need to manage construction projects efficiently, all in one integrated platform.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-w-7xl mx-auto flex-1 overflow-y-auto">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </PublicLayout>
  );
};

export default Features;
