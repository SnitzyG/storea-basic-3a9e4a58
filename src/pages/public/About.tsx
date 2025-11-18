import { useEffect } from 'react';
import { PublicLayout } from '@/components/marketing/PublicLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Target, Lightbulb, Users } from 'lucide-react';
import { usePageMeta } from '@/hooks/usePageMeta';
import { Breadcrumbs } from '@/components/marketing/Breadcrumbs';

const About = () => {
  usePageMeta({
    title: 'About STOREA - Modern Construction Management Platform',
    description: 'Learn about STOREA\'s mission to revolutionize construction project management with modern tools for seamless collaboration. Built for Australian builders.',
    canonicalPath: '/about',
    imageUrl: '/og-about.jpg'
  });

  useEffect(() => {
    // Add AboutPage structured data
    const aboutSchema = {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      "name": "About STOREA",
      "description": "Learn about STOREA's mission to revolutionize construction project management with modern tools for seamless collaboration.",
      "url": "https://www.storea.com.au/about",
      "mainEntity": {
        "@type": "Organization",
        "name": "STOREA",
        "url": "https://www.storea.com.au",
        "description": "Modern construction project management platform that brings together document management, team collaboration, RFI tracking, financial oversight, and scheduling into one unified experience.",
        "foundingDate": "2024",
        "logo": "https://www.storea.com.au/storea-logo.png",
        "sameAs": [
          "https://www.facebook.com/storeaau",
          "https://x.com/storea_au",
          "https://www.instagram.com/storea_au/",
          "https://www.youtube.com/@storea_au"
        ]
      }
    };

    let script = document.querySelector('script[data-about-schema]');
    if (!script) {
      script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('data-about-schema', 'true');
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(aboutSchema);

    return () => {
      const existingScript = document.querySelector('script[data-about-schema]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full flex flex-col">
        <Breadcrumbs />
        <div className="max-w-4xl mx-auto text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-800">
            About STOREA
          </h1>
          
          <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
            We're on a mission to revolutionize how construction projects are managed, making collaboration seamless and projects more successful.
          </p>

          <div className="text-muted-foreground mb-6 text-sm leading-relaxed max-w-3xl mx-auto">
            <p className="mb-3">
              STOREA was born from the frustration of managing construction projects with outdated tools and fragmented communication. We recognized that the construction industry needed a modern, integrated platform that could keep pace with today's complex projects.
            </p>
            
            <p className="mb-3">
              Our platform brings together document management, team collaboration, RFI tracking, financial oversight, and scheduling into one unified experience.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto flex-1">
          <Card className="hover:shadow-elegant transition-all duration-300">
            <CardContent className="pt-4 text-center">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center mx-auto mb-3">
                <Target className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-primary">Our Mission</h3>
              <p className="text-sm text-muted-foreground">
                Empower construction teams with tools that make complex projects simple to manage.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-elegant transition-all duration-300">
            <CardContent className="pt-4 text-center">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center mx-auto mb-3">
                <Lightbulb className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-primary">Our Vision</h3>
              <p className="text-sm text-muted-foreground">
                A world where every construction project is delivered efficiently and collaboratively.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-elegant transition-all duration-300">
            <CardContent className="pt-4 text-center">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center mx-auto mb-3">
                <Users className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-primary">Our Values</h3>
              <p className="text-sm text-muted-foreground">
                Transparency, collaboration, and continuous improvement in everything we do.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PublicLayout>
  );
};

export default About;
