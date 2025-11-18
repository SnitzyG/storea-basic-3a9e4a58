import { useState, useEffect } from 'react';
import { PublicLayout } from '@/components/marketing/PublicLayout';
import { PricingCard } from '@/components/marketing/PricingCard';
import { usePageMeta } from '@/hooks/usePageMeta';
import { Breadcrumbs } from '@/components/marketing/Breadcrumbs';

const Pricing = () => {
  const [isYearly, setIsYearly] = useState(false);
  
  usePageMeta({
    title: 'Affordable Construction Management Software Pricing | STOREA',
    description: 'Flexible pricing plans for construction project management. Start free or choose Pro/Team plans. Save 5% with yearly billing. Perfect for Australian builders of all sizes.',
    canonicalPath: '/pricing',
    imageUrl: '/og-pricing.jpg'
  });

  useEffect(() => {
    // Add FAQPage structured data for pricing questions
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What pricing plans does STOREA offer?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "STOREA offers three pricing plans: Basic (Free) for small projects with up to 2 active projects and 5 team members, Pro ($49/month) for growing teams with unlimited projects and 25 team members, and Team ($149/month) for large teams requiring enterprise features with unlimited team members and advanced capabilities."
          }
        },
        {
          "@type": "Question",
          "name": "Can I try STOREA for free?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes! STOREA offers a free Basic plan that allows you to manage up to 2 active projects with 5 team members. This is perfect for small projects or trying out the platform before upgrading."
          }
        },
        {
          "@type": "Question",
          "name": "Is there a discount for yearly subscriptions?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, we offer a 5% discount on yearly subscriptions compared to monthly billing. Simply toggle to yearly billing to see the discounted rates."
          }
        },
        {
          "@type": "Question",
          "name": "Can I upgrade or downgrade my plan?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle."
          }
        },
        {
          "@type": "Question",
          "name": "What payment methods do you accept?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "We accept all major credit cards and bank transfers for enterprise plans. All payments are processed securely through our payment partners."
          }
        }
      ]
    };

    let script = document.querySelector('script[data-pricing-faq-schema]');
    if (!script) {
      script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('data-pricing-faq-schema', 'true');
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(faqSchema);

    return () => {
      const existingScript = document.querySelector('script[data-pricing-faq-schema]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);

  const calculatePrice = (monthlyPrice: number) => {
    if (isYearly) {
      const yearlyTotal = monthlyPrice * 12 * 0.95;
      return Math.round(yearlyTotal);
    }
    return monthlyPrice;
  };

  const plans = [
    {
      name: 'Basic',
      monthlyPrice: 0,
      description: 'Perfect for small projects or trying out the platform',
      features: [
        'Up to 2 active projects',
        '5 team members',
        'Basic document management',
        '100 MB storage',
        'Email support',
        'Mobile app access'
      ]
    },
    {
      name: 'Pro',
      monthlyPrice: 49,
      description: 'For growing teams managing multiple projects',
      features: [
        'Unlimited projects',
        '25 team members',
        'Advanced document management',
        '10 GB storage',
        'RFI & tender management',
        'Financial tracking',
        'Priority email support',
        'Custom branding'
      ],
      highlighted: true
    },
    {
      name: 'Team',
      monthlyPrice: 149,
      description: 'For large teams requiring enterprise features',
      features: [
        'Everything in Pro',
        'Unlimited team members',
        '100 GB storage',
        'Advanced analytics',
        'Custom workflows',
        'API access',
        'Dedicated account manager',
        '24/7 phone support',
        'SSO & advanced security'
      ]
    }
  ];

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full flex flex-col">
        <Breadcrumbs />
        <div className="max-w-4xl mx-auto text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-800">
            Simple, Transparent Pricing
          </h1>
          
          <p className="text-lg text-muted-foreground">
            Choose the plan that fits your team's needs. Start free, upgrade when you're ready.
          </p>
          
          <div className="flex items-center justify-center gap-3 mt-6">
            <span className={`text-sm font-medium ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isYearly ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isYearly ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
              Yearly
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto flex-1">
          {plans.map((plan, index) => (
            <PricingCard 
              key={index} 
              {...plan} 
              price={plan.monthlyPrice === 0 ? 'Free' : `$${calculatePrice(plan.monthlyPrice)}`}
              isYearly={isYearly}
            />
          ))}
        </div>
      </div>
    </PublicLayout>
  );
};

export default Pricing;
