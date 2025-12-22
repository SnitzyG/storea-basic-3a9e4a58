import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/marketing/PublicLayout';
import { ContactForm } from '@/components/marketing/ContactForm';
import { FAQSection } from '@/components/marketing/FAQSection';
import { RelatedPages } from '@/components/marketing/RelatedPages';
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
        "contactPoint": [{
          "@type": "ContactPoint",
          "telephone": "1-800-STOREA",
          "contactType": "customer service",
          "areaServed": "AU",
          "availableLanguage": "English"
        }],
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
  return <PublicLayout>
      <div className="w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumbs />
          <div className="max-w-4xl mx-auto text-center mb-6">
            
            
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

        <div className="mb-12 max-w-2xl mx-auto">
          <ContactForm />
        </div>

        <FAQSection title="Contact & Support FAQs" faqs={[{
          question: "What's the best way to reach you?",
          answer: "The quickest way to reach us is through the contact form on this page. We respond to all inquiries within 24 hours. For existing customers, you can also use the in-app support chat for immediate assistance."
        }, {
          question: "How quickly do you respond to inquiries?",
          answer: "We typically respond to all contact form submissions within 2-4 hours during business hours (Monday-Friday, 9 AM - 6 PM AEST). For urgent support issues, existing customers can use our in-app chat for faster response."
        }, {
          question: "Do you offer phone support?",
          answer: "Yes, phone support is available for customers on paid plans. After signing up, you'll receive direct phone support details in your welcome email. We also offer scheduled phone consultations for prospective customers."
        }, {
          question: "Can I schedule a demo?",
          answer: "Absolutely! We offer personalized demos to show you how STOREA can benefit your construction business. Use the contact form and mention you'd like a demo, or email demo@storea.com.au to schedule a time."
        }, {
          question: "Where are you located?",
          answer: "STOREA is based in Melbourne, Victoria, Australia. While we primarily operate online to serve customers across Australia, we're happy to arrange in-person meetings for Melbourne-based businesses."
        }]} />

        <div className="mt-12 mb-8">
          <RelatedPages currentPage="contact" />
        </div>
        </div>
      </div>
    </PublicLayout>;
};
export default Contact;