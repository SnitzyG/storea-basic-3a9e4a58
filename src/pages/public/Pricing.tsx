import { PublicLayout } from '@/components/marketing/PublicLayout';
import { PricingCard } from '@/components/marketing/PricingCard';
import { usePageMeta } from '@/hooks/usePageMeta';

const Pricing = () => {
  usePageMeta({
    title: 'STOREA Pricing – Choose Your Plan',
    description: 'Flexible pricing plans to fit your construction project needs. Start free or upgrade to premium.'
  });

  const plans = [
    {
      name: 'Free',
      price: 'Free',
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
      price: '$49',
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
      price: '$149',
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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-gray-800">
            Simple, Transparent Pricing
          </h1>
          
          <p className="text-xl text-muted-foreground">
            Choose the plan that fits your team's needs. Start free, upgrade when you're ready.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {plans.map((plan, index) => (
            <PricingCard key={index} {...plan} />
          ))}
        </div>

        <div className="max-w-2xl mx-auto text-center bg-muted/50 rounded-2xl p-8 border border-border">
          <h3 className="text-2xl font-semibold mb-3 text-gray-800">Need something custom?</h3>
          <p className="text-muted-foreground mb-6">
            Contact us for enterprise pricing and custom solutions tailored to your organization's needs.
          </p>
          <a href="/contact" className="text-primary hover:underline font-medium">
            Get in touch →
          </a>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Pricing;
