import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileSetupProgressProps {
  currentStep: number;
  totalSteps: number;
}

export const ProfileSetupProgress: React.FC<ProfileSetupProgressProps> = ({
  currentStep,
  totalSteps
}) => {
  const steps = ['Personal', 'Professional', 'Company'];

  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between">
        {steps.slice(0, totalSteps).map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                    isCompleted && "bg-primary border-primary text-primary-foreground",
                    isCurrent && "border-primary text-primary",
                    !isCompleted && !isCurrent && "border-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{stepNumber}</span>
                  )}
                </div>
                <span className={cn(
                  "mt-2 text-sm font-medium",
                  isCurrent && "text-primary",
                  !isCurrent && "text-muted-foreground"
                )}>
                  {step}
                </span>
              </div>
              {index < totalSteps - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-4",
                    isCompleted ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
      <div className="mt-4 text-center">
        <p className="text-sm text-muted-foreground">
          Step {currentStep} of {totalSteps}
        </p>
      </div>
    </div>
  );
};
