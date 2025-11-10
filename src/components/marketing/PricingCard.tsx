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
}

export const PricingCard = ({ name, price, description, features, highlighted }: PricingCardProps) => {
  return (
    <Card className={`relative ${highlighted ? 'border-primary shadow-xl' : 'border-border'}`}>
      {highlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
            Most Popular
          </span>
        </div>
      )}
      
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl">{name}</CardTitle>
        <div className="mt-2">
          <span className="text-3xl font-bold">{price}</span>
          {price !== 'Free' && <span className="text-muted-foreground text-sm">/month</span>}
        </div>
        <CardDescription className="mt-1 text-sm">{description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <Link to="/auth">
          <Button 
            className="w-full" 
            variant={highlighted ? 'default' : 'outline'}
            size="sm"
          >
            Get Started
          </Button>
        </Link>

        <ul className="space-y-2 pt-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span className="text-xs text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
