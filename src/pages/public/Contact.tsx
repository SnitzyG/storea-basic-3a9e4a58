import { useEffect } from 'react';
import { PublicLayout } from '@/components/marketing/PublicLayout';
import { ContactForm } from '@/components/marketing/ContactForm';
import { Mail, MapPin, Phone } from 'lucide-react';
import { usePageMeta } from '@/hooks/usePageMeta';
import { Breadcrumbs } from '@/components/marketing/Breadcrumbs';

const Contact = () => {
  usePageMeta({
    title: 'Contact STOREA - Get in Touch with Our Team',
    description: 'Have questions about STOREA? Contact our team for support, demos, or inquiries about construction project management software.',
    canonicalPath: '/contact',
    imageUrl: '/og-contact.jpg'
  });

  useEffect(() => {
    // Add ContactPage structured data
    const contactSchema = {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      "name": "Contact STOREA",
      "description": "Get in touch with STOREA for support, demos, or inquiries about construction project management.",
      "url": "https://www.storea.com.au/contact",
      "mainEntity": {
        "@type": "Organization",
        "name": "STOREA",
        "url": "https://www.storea.com.au",
        "contactPoint": [
          {
            "@type": "ContactPoint",
            "telephone": "1-800-STOREA",
            "contactType": "customer service",
            "areaServed": "AU",
            "availableLanguage": "English"
          }
        ],
        "email": "support@storea.com",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "Melbourne",
          "addressRegion": "VIC",
          "addressCountry": "AU"
        }
      }
    };

    let script = document.querySelector('script[data-contact-schema]');
    if (!script) {
      script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('data-contact-schema', 'true');
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(contactSchema);

    return () => {
      const existingScript = document.querySelector('script[data-contact-schema]');
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
            Let's Connect
          </h1>
          
          <p className="text-lg text-muted-foreground">
            Have questions or need assistance? We're here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center mx-auto mb-3">
              <Mail className="h-5 w-5 text-primary-foreground" />
            </div>
            <h3 className="font-semibold mb-2 text-primary">Email Us</h3>
            <p className="text-sm text-muted-foreground">support@storea.com</p>
          </div>

          <div className="text-center p-4">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center mx-auto mb-3">
              <Phone className="h-5 w-5 text-primary-foreground" />
            </div>
            <h3 className="font-semibold mb-2 text-primary">Call Us</h3>
            <p className="text-sm text-muted-foreground">1-800-STOREA</p>
          </div>

          <div className="text-center p-4">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center mx-auto mb-3">
              <MapPin className="h-5 w-5 text-primary-foreground" />
            </div>
            <h3 className="font-semibold mb-2 text-primary">Visit Us</h3>
            <p className="text-sm text-muted-foreground">Melbourne, Australia</p>
          </div>
        </div>

        <div className="flex-1 flex items-start justify-center">
          <ContactForm />
        </div>
      </div>
    </PublicLayout>
  );
};

export default Contact;
