import { useState } from 'react';
import { PublicLayout } from '@/components/marketing/PublicLayout';
import { PricingCard } from '@/components/marketing/PricingCard';
import { usePageMeta } from '@/hooks/usePageMeta';

const Pricing = () => {
  const [isYearly, setIsYearly] = useState(false);
  
  usePageMeta({
    title: 'STOREA Pricing – Choose Your Plan',
    description: 'Flexible pricing plans to fit your construction project needs. Start free or upgrade to premium.',
    canonicalPath: '/pricing'
  });

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
