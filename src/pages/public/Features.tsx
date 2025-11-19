import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/marketing/PublicLayout';
import { FeatureCard } from '@/components/marketing/FeatureCard';
import { FAQSection } from '@/components/marketing/FAQSection';
import { RelatedPages } from '@/components/marketing/RelatedPages';
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
      <div className="w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumbs />
          
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-800">
              Construction Project Management Features
            </h1>
            <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-gray-700">
              Complete Construction Management Software for Australian Builders
            </h2>
            <p className="text-base text-muted-foreground mb-4 max-w-3xl mx-auto leading-relaxed text-left">
              STOREA is the leading construction project management platform designed specifically 
              for Australian builders, contractors, and construction teams. Our comprehensive suite 
              of features streamlines every aspect of construction management, from document control 
              and RFI tracking to tender management and team collaboration.
            </p>
            <p className="text-base text-muted-foreground mb-4 max-w-3xl mx-auto leading-relaxed text-left">
              With STOREA, you can manage construction projects more efficiently, reduce administrative 
              overhead, and ensure all stakeholders stay aligned. Our platform includes powerful 
              document management with version control, real-time RFI tracking, comprehensive tender 
              and bid management, integrated messaging for team communication, financial oversight 
              with progress claims and invoicing, and a centralized calendar for scheduling.
            </p>
            <p className="text-base text-muted-foreground mb-4 max-w-3xl mx-auto leading-relaxed text-left">
              Whether you're managing a single residential project or multiple commercial developments, 
              STOREA provides the tools you need to deliver on time and on budget. Our intuitive 
              interface eliminates the learning curve, allowing your team to get up and running quickly. 
              <Link to="/pricing" className="text-primary hover:underline font-medium">View our affordable pricing plans</Link> or <Link to="/contact" className="text-primary hover:underline font-medium">contact our team</Link> to get started today.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto mb-16">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>

          <FAQSection
            title="Frequently Asked Questions"
            faqs={[
              {
                question: "What features does STOREA offer for construction management?",
                answer: "STOREA offers comprehensive features including document management with version control, RFI tracking and management, tender and bid management, team messaging and collaboration, financial management with progress claims and invoicing, calendar and scheduling, project dashboards, and real-time notifications."
              },
              {
                question: "How does document management work in STOREA?",
                answer: "Our document management system allows you to upload, organize, and share construction documents with version control. You can categorize documents, track revisions, set permissions, and ensure everyone has access to the latest drawings, specifications, and contracts."
              },
              {
                question: "Can I collaborate with my team in real-time?",
                answer: "Yes! STOREA includes built-in messaging, real-time notifications, and collaborative tools that keep your entire team connected. Team members can discuss RFIs, review documents, and coordinate on tasks seamlessly."
              },
              {
                question: "Is STOREA suitable for Australian construction projects?",
                answer: "Absolutely. STOREA is built specifically for the Australian construction industry, with features tailored to local practices, compliance requirements, and workflows commonly used by Australian builders and contractors."
              },
              {
                question: "What makes STOREA different from other construction management tools?",
                answer: "STOREA combines powerful features with an intuitive interface, making it accessible for teams of all sizes. Our platform integrates all aspects of construction management in one place, eliminating the need for multiple disconnected tools and spreadsheets."
              },
              {
                question: "Can STOREA scale as my business grows?",
                answer: "Yes, STOREA is built to scale with your business. You can easily add more projects, team members, and storage as your needs grow. Our Pro and Team plans are designed for scalability."
              }
            ]}
          />

          <div className="mt-12">
            <RelatedPages currentPage="features" />
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Features;
