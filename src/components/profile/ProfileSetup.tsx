import React from 'react';
import { User } from 'lucide-react';
import { ProfileSetupWizard } from './ProfileSetupWizard';

interface ProfileSetupProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export const ProfileSetup: React.FC<ProfileSetupProps> = ({ onComplete, onSkip }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Complete Your Profile</h1>
          <p className="text-muted-foreground mt-2">
            Let's get you set up so you can start collaborating on projects
          </p>
        </div>
        
        <ProfileSetupWizard onComplete={onComplete} onSkip={onSkip} />
      </div>
    </div>
  );
};