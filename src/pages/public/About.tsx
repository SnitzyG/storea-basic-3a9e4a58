import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/marketing/PublicLayout';
import { Card, CardContent } from '@/components/ui/card';
import { FAQSection } from '@/components/marketing/FAQSection';
import { RelatedPages } from '@/components/marketing/RelatedPages';
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
        "sameAs": ["https://www.facebook.com/storeaau", "https://x.com/storea_au", "https://www.instagram.com/storea_au/", "https://www.youtube.com/@storea_au"]
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
  return <PublicLayout>
      <div className="w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumbs />
          <div className="max-w-4xl mx-auto text-center mb-6">
            
            
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto mb-16">
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

      <FAQSection title="About STOREA FAQs" faqs={[{
          question: "When was STOREA founded?",
          answer: "STOREA was founded in 2024 by a team of construction professionals and software engineers passionate about modernizing construction project management."
        }, {
          question: "Where is STOREA based?",
          answer: "STOREA is headquartered in Melbourne, Victoria, Australia. We're proud to serve construction companies across Australia with locally-focused solutions."
        }, {
          question: "Who uses STOREA?",
          answer: "STOREA is used by builders, contractors, project managers, architects, engineers, and construction teams across Australia. From solo builders to large construction companies, our platform scales to meet diverse needs."
        }, {
          question: "What industries do you serve?",
          answer: "We primarily serve the construction industry, including residential building, commercial construction, renovations, civil engineering, and project management. Our platform is designed specifically for construction workflows."
        }, {
          question: "How do you support customers?",
          answer: "We offer comprehensive support including email support, in-app help documentation, video tutorials, and priority support for paid plans. Our Australian-based support team understands the local construction industry and is here to help."
        }]} />

      <div className="mt-12 mb-8">
        <RelatedPages currentPage="about" />
      </div>
    </div>
  </div>
  </PublicLayout>;
};
export default About;