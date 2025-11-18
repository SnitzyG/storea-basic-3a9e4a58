import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';

interface PricingCardProps {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  isYearly?: boolean;
}

export const PricingCard = ({ name, price, description, features, highlighted, isYearly }: PricingCardProps) => {
  const { trackPricingSelection } = useAnalytics();

  const handleGetStarted = () => {
    trackPricingSelection(name, isYearly || false);
  };

  return (
    <Card className={`relative h-full flex flex-col transition-all duration-300 hover:scale-105 hover:shadow-elegant ${highlighted ? 'border-primary shadow-xl' : 'border-border'}`}>
      <CardHeader className="text-center pb-6 pt-6">
        <CardTitle className="text-2xl">{name}</CardTitle>
        <div className="mt-3" aria-label={`Price: ${price}${price !== 'Free' ? ` per ${isYearly ? 'year' : 'month'}` : ''}`}>
          <span className="text-4xl font-bold">{price}</span>
          {price !== 'Free' && <span className="text-muted-foreground">/{isYearly ? 'year' : 'month'}</span>}
        </div>
        <CardDescription className="mt-2">{description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 flex-1 flex flex-col">
        <Link to="/auth" aria-label={`Get started with ${name} plan`} onClick={handleGetStarted}>
          <Button 
            className="w-full" 
            variant="outline"
          >
            Get Started
          </Button>
        </Link>

        <ul className="space-y-2.5 pt-3 flex-1" aria-label={`${name} plan features`}>
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2.5">
              <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
              <span className="text-sm text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
