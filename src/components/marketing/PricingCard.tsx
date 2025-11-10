import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';

interface PricingCardProps {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  isYearly?: boolean;
}

export const PricingCard = ({ name, price, description, features, highlighted, isYearly }: PricingCardProps) => {
  return (
    <Card className={`relative ${highlighted ? 'border-primary shadow-xl' : 'border-border'}`}>
      {highlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
            Most Popular
          </span>
        </div>
      )}
      
      <CardHeader className="text-center pb-6">
        <CardTitle className="text-2xl">{name}</CardTitle>
        <div className="mt-3">
          <span className="text-4xl font-bold">{price}</span>
          {price !== 'Free' && <span className="text-muted-foreground">/{isYearly ? 'year' : 'month'}</span>}
        </div>
        <CardDescription className="mt-2">{description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Link to="/auth">
          <Button 
            className="w-full" 
            variant={highlighted ? 'default' : 'outline'}
          >
            Get Started
          </Button>
        </Link>

        <ul className="space-y-2.5 pt-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2.5">
              <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span className="text-sm text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
