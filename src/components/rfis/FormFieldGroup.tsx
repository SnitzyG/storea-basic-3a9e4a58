import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormFieldGroupProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  isRequired?: boolean;
  isComplete?: boolean;
  hasErrors?: boolean;
  isCollapsible?: boolean;
  defaultOpen?: boolean;
  className?: string;
}

export const FormFieldGroup: React.FC<FormFieldGroupProps> = ({
  title,
  description,
  icon: Icon,
  children,
  isRequired = false,
  isComplete = false,
  hasErrors = false,
  isCollapsible = false,
  defaultOpen = true,
  className
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  const getStatusIcon = () => {
    if (hasErrors) return <AlertCircle className="h-4 w-4 text-destructive" />;
    if (isComplete) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (isRequired) return <Clock className="h-4 w-4 text-yellow-500" />;
    return null;
  };

  const getStatusBadge = () => {
    if (hasErrors) return <Badge variant="destructive" className="text-xs">Errors</Badge>;
    if (isComplete) return <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">Complete</Badge>;
    if (isRequired) return <Badge variant="outline" className="text-xs">Required</Badge>;
    return null;
  };

  const content = (
    <Card className={cn("transition-all duration-200", className, {
      "border-destructive": hasErrors,
      "border-green-200": isComplete && !hasErrors,
      "border-yellow-200": isRequired && !isComplete && !hasErrors,
    })}>
      <CardHeader className={cn("pb-3", isCollapsible && "cursor-pointer")} onClick={() => isCollapsible && setIsOpen(!isOpen)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
            <CardTitle className="text-lg">{title}</CardTitle>
            {getStatusIcon()}
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge()}
            {isCollapsible && (
              <ChevronDown 
                className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} 
              />
            )}
          </div>
        </div>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </CardHeader>
      <CardContent className={cn("pt-0", isCollapsible && !isOpen && "hidden")}>
        {children}
      </CardContent>
    </Card>
  );

  if (isCollapsible) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div>{content}</div>
        </CollapsibleTrigger>
      </Collapsible>
    );
  }

  return content;
};