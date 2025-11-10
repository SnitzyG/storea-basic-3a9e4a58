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
      <CardHeader className="p-4">
        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center mb-2">
          <Icon className="h-5 w-5 text-primary-foreground" />
        </div>
        <CardTitle className="text-lg text-primary">{title}</CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
    </Card>
  );
};
