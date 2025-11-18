import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import StorageAnimation from './StorageAnimation';

export const HeroSection = () => {

  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32" aria-labelledby="hero-heading">
      <div className="max-w-4xl mx-auto text-center">
        <h1 id="hero-heading" className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-primary">
          Construction Management Simplified
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Streamline your projects, collaborate with teams, and deliver on time with our all-in-one platform.
        </p>

        <nav className="flex flex-col sm:flex-row gap-4 justify-center items-center" aria-label="Primary actions">
          <Link to="/auth" aria-label="Sign up for free account">
            <Button size="lg" className="text-lg px-8 gap-2">
              Get Started Free <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Button>
          </Link>
          <Link to="/features" aria-label="View all features">
            <Button size="lg" variant="outline" className="text-lg px-8">
              Explore Features
            </Button>
          </Link>
        </nav>

        <figure className="mt-16 rounded-2xl border border-border bg-card p-2 shadow-elegant">
          <div className="rounded-xl overflow-hidden">
            <StorageAnimation />
          </div>
        </figure>
      </div>
    </section>
  );
};
