import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';


interface Step1PersonalInfoProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

export const Step1PersonalInfo: React.FC<Step1PersonalInfoProps> = ({
  formData,
  onChange,
  errors = {}
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">Personal Information</h3>
        <p className="text-sm text-muted-foreground">
          Let's start with your basic information
        </p>
      </div>

      {formData.company_logo_url ? (
        <div className="flex items-center gap-3">
          <img
            src={formData.company_logo_url}
            alt="Company logo"
            className="h-12 w-12 object-contain rounded border"
          />
          <p className="text-sm text-muted-foreground">
            Your profile picture will use your company logo.
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Your profile picture will use your company logo (set in Company Details).
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Full Name *</Label>
        <Input
          id="name"
          value={formData.name || ''}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder="Enter your full name"
          className={errors.name ? 'border-destructive' : ''}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number *</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone || ''}
          onChange={(e) => onChange('phone', e.target.value)}
          placeholder="+1 (555) 000-0000"
          className={errors.phone ? 'border-destructive' : ''}
        />
        {errors.phone && (
          <p className="text-sm text-destructive">{errors.phone}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Your primary contact number
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio (Optional)</Label>
        <Textarea
          id="bio"
          value={formData.bio || ''}
          onChange={(e) => onChange('bio', e.target.value)}
          placeholder="Tell us a bit about yourself..."
          maxLength={200}
          rows={3}
          className={errors.bio ? 'border-destructive' : ''}
        />
        <div className="flex justify-between">
          {errors.bio && (
            <p className="text-sm text-destructive">{errors.bio}</p>
          )}
          <p className="text-xs text-muted-foreground ml-auto">
            {(formData.bio || '').length}/200 characters
          </p>
        </div>
      </div>
    </div>
  );
};
