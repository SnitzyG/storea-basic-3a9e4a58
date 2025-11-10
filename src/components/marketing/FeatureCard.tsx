import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const FeatureCard = ({ icon: Icon, title, description }: FeatureCardProps) => {
  return (
    <Card className="border-border hover:shadow-elegant transition-all duration-300 hover:scale-105">
      <CardHeader className="p-3">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mb-1.5">
          <Icon className="h-4 w-4 text-primary-foreground" />
        </div>
        <CardTitle className="text-base text-primary">{title}</CardTitle>
        <CardDescription className="text-xs leading-tight">{description}</CardDescription>
      </CardHeader>
    </Card>
  );
};
