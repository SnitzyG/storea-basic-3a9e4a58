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

export const RelatedPages = ({ currentPage }: RelatedPagesProps) => {
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

  return (
    <section className="mt-16 mb-8" aria-labelledby="related-pages-heading">
      <h2 id="related-pages-heading" className="text-2xl font-bold mb-6 text-center">
        Explore More
      </h2>
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {relatedPages.map((page) => (
          <Link 
            key={page.href} 
            to={page.href}
            className="group"
            aria-label={`Navigate to ${page.title}`}
          >
            <Card className="h-full transition-all duration-300 hover:shadow-elegant hover:scale-[1.02] border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {page.icon}
                    </div>
                    <CardTitle className="text-lg">{page.title}</CardTitle>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{page.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
};
