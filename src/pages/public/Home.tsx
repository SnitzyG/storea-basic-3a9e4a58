import { PublicLayout } from '@/components/marketing/PublicLayout';
import { HeroSection } from '@/components/marketing/HeroSection';
import { FeatureCard } from '@/components/marketing/FeatureCard';
import { FileText, Users, Calendar, TrendingUp, MessageSquare, Shield } from 'lucide-react';

const Home = () => {
  const features = [
    {
      icon: FileText,
      title: 'Document Management',
      description: 'Organize and share project documents securely with your team.'
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Work together seamlessly with real-time updates and notifications.'
    },
    {
      icon: Calendar,
      title: 'Project Scheduling',
      description: 'Keep track of deadlines and milestones with integrated calendars.'
    },
    {
      icon: TrendingUp,
      title: 'Financial Tracking',
      description: 'Monitor budgets, expenses, and financial performance in real-time.'
    },
    {
      icon: MessageSquare,
      title: 'RFI Management',
      description: 'Handle requests for information efficiently with automated workflows.'
    },
    {
      icon: Shield,
      title: 'Secure & Compliant',
      description: 'Enterprise-grade security to keep your project data safe.'
    }
  ];

  return (
    <PublicLayout>
      <HeroSection />
      
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything you need to manage construction projects
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From planning to completion, our platform provides all the tools you need in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </section>
    </PublicLayout>
  );
};

export default Home;
