import { PublicLayout } from '@/components/marketing/PublicLayout';
import { PricingCard } from '@/components/marketing/PricingCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <PricingCard key={index} {...plan} />
          ))}
          
          <Card className="border-border">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl">Custom</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">Contact Us</span>
              </div>
              <CardDescription className="mt-2">
                Enterprise pricing and custom solutions tailored to your organization's needs
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <a href="/contact" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full">
                Get in touch
              </a>

              <ul className="space-y-3 pt-4">
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">Unlimited everything</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">White-label options</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">Custom integrations</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">Dedicated support team</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm text-muted-foreground">SLA guarantees</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Pricing;
