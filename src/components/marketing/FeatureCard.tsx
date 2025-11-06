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
      <CardHeader>
        <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mb-4">
          <Icon className="h-6 w-6 text-primary-foreground" />
        </div>
        <CardTitle className="text-xl text-primary">{title}</CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>
    </Card>
  );
};
