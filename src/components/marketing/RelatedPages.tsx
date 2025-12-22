import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, FileText, DollarSign, Mail, Users } from 'lucide-react';
interface RelatedPage {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}
interface RelatedPagesProps {
  currentPage: 'features' | 'pricing' | 'about' | 'contact';
}
export const RelatedPages = ({
  currentPage
}: RelatedPagesProps) => {
  const allPages: Record<string, RelatedPage> = {
    features: {
      title: 'Features',
      description: 'Explore our powerful construction management tools',
      href: '/features',
      icon: <FileText className="h-5 w-5" />
    },
    pricing: {
      title: 'Pricing',
      description: 'Choose the plan that fits your business',
      href: '/pricing',
      icon: <DollarSign className="h-5 w-5" />
    },
    about: {
      title: 'About Us',
      description: 'Learn more about STOREA and our mission',
      href: '/about',
      icon: <Users className="h-5 w-5" />
    },
    contact: {
      title: 'Contact',
      description: 'Get in touch with our team',
      href: '/contact',
      icon: <Mail className="h-5 w-5" />
    }
  };
  const getRelatedPages = (): RelatedPage[] => {
    switch (currentPage) {
      case 'features':
        return [allPages.pricing, allPages.contact];
      case 'pricing':
        return [allPages.features, allPages.contact];
      case 'about':
        return [allPages.features, allPages.contact];
      case 'contact':
        return [allPages.features, allPages.pricing];
      default:
        return [];
    }
  };
  const relatedPages = getRelatedPages();
  if (relatedPages.length === 0) return null;
  return <section className="mt-16 mb-8" aria-labelledby="related-pages-heading">
      
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {relatedPages.map(page => <Link key={page.href} to={page.href} className="group" aria-label={`Navigate to ${page.title}`}>
            
          </Link>)}
      </div>
    </section>;
};