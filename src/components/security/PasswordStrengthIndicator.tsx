import React from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { PasswordStrengthResult } from '@/lib/security/passwordValidator';

interface PasswordStrengthIndicatorProps {
  result: PasswordStrengthResult;
  className?: string;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ 
  result, 
  className 
}) => {
  const getStrengthLabel = (score: number): string => {
    if (score <= 1) return 'Very Weak';
    if (score <= 2) return 'Weak';
    if (score <= 3) return 'Fair';
    if (score <= 4) return 'Good';
    return 'Strong';
  };

  const getStrengthColor = (score: number): string => {
    if (score <= 1) return 'text-destructive';
    if (score <= 2) return 'text-orange-500';
    if (score <= 3) return 'text-yellow-500';
    if (score <= 4) return 'text-blue-500';
    return 'text-green-500';
  };

  const getProgressColor = (score: number): string => {
    if (score <= 1) return 'bg-destructive';
    if (score <= 2) return 'bg-orange-500';
    if (score <= 3) return 'bg-yellow-500';
    if (score <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const progressValue = (result.score / 5) * 100;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Password Strength</span>
        <span className={cn('text-sm font-medium', getStrengthColor(result.score))}>
          {getStrengthLabel(result.score)}
        </span>
      </div>
      
      <div className="relative">
        <Progress 
          value={progressValue} 
          className="h-2"
        />
        <div 
          className={cn("absolute inset-0 h-2 rounded-full transition-all", getProgressColor(result.score))}
          style={{ width: `${progressValue}%` }}
        />
      </div>
      
      {result.feedback.length > 0 && (
        <ul className="text-xs text-muted-foreground space-y-1">
          {result.feedback.map((feedback, index) => (
            <li key={index} className="flex items-start gap-1">
              <span className="text-destructive">•</span>
              {feedback}
            </li>
          ))}
        </ul>
      )}
      
      {result.breachCheckPassed === false && (
        <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
          ⚠️ This password has been found in data breaches. Please choose a different password.
        </div>
      )}
    </div>
  );
};