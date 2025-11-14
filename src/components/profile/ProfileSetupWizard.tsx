import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import { ProfileSetupProgress } from './ProfileSetupProgress';
import { Step1PersonalInfo } from './Step1PersonalInfo';
import { Step2ProfessionalInfo } from './Step2ProfessionalInfo';
import { Step3CompanyInfo } from './Step3CompanyInfo';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { validateProfileData } from '@/lib/validations/profileSchemas';

interface ProfileSetupWizardProps {
  onComplete: () => void;
}

export const ProfileSetupWizard: React.FC<ProfileSetupWizardProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<any>({
    name: '',
    phone: '',
    bio: '',
    avatar_url: '',
    role: 'contractor',
    specialization: [],
  });
  const { toast } = useToast();

  // Initialize from signup metadata
  useEffect(() => {
    const loadSignupData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.user_metadata) {
          setFormData((prev: any) => ({
            ...prev,
            name: user.user_metadata.name || '',
            role: user.user_metadata.role || 'contractor',
            company: user.user_metadata.company || '',
          }));
        }
      } catch (error) {
        console.error('Error loading signup data:', error);
      }
    };
    loadSignupData();
  }, []);

  const totalSteps = formData.role === 'homeowner' ? 2 : 3;

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep = () => {
    try {
      // Partial validation for current step
      const dataToValidate = { ...formData, role: formData.role };
      validateProfileData(formData.role, dataToValidate);
      setErrors({});
      return true;
    } catch (error: any) {
      const validationErrors: Record<string, string> = {};
      if (error.errors) {
        error.errors.forEach((err: any) => {
          validationErrors[err.path[0]] = err.message;
        });
      }
      setErrors(validationErrors);
      return false;
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Normalize inputs (phones) and mirror avatar to company logo
      const normalizePhone = (v: any) => (typeof v === 'string' ? v.replace(/\D/g, '') : v);
      const sanitized = { ...formData } as any;
      sanitized.phone = normalizePhone(formData.phone);
      sanitized.company_phone = normalizePhone(formData.company_phone);
      if (!sanitized.avatar_url && sanitized.company_logo_url) {
        sanitized.avatar_url = sanitized.company_logo_url;
      }

      // Validate all data
      validateProfileData(sanitized.role, sanitized);

      // Update/create company if needed
      let companyId = null;
      if (formData.company && formData.role !== 'homeowner') {
        const { data: existingCompany } = await supabase
          .from('companies')
          .select('id')
          .eq('name', formData.company)
          .single();

        if (existingCompany) {
          companyId = existingCompany.id;
        } else {
          const { data: newCompany, error: companyError } = await supabase
            .from('companies')
            .insert({
              name: formData.company,
              address: formData.company_address,
              settings: {}
            })
            .select()
            .single();

          if (companyError) throw companyError;
          companyId = newCompany.id;
        }
      }

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          name: sanitized.name,
          phone: sanitized.phone,
          role: sanitized.role,
          bio: sanitized.bio,
          avatar_url: sanitized.avatar_url,
          company_id: companyId,
          company_position: sanitized.company_position,
          company_phone: sanitized.company_phone,
          company_address: sanitized.company_address,
          company_website: sanitized.company_website,
          company_logo_url: sanitized.company_logo_url,
          business_registration_number: sanitized.business_registration_number,
          abn: sanitized.abn,
          professional_license_number: sanitized.professional_license_number,
          years_experience: sanitized.years_experience,
          specialization: sanitized.specialization,
          linkedin_url: sanitized.linkedin_url,
          property_address: sanitized.property_address,
          project_type: sanitized.project_type,
          budget_range: sanitized.budget_range,
          timeline: sanitized.timeline,
          insurance_details: sanitized.insurance_details,
          number_of_employees: sanitized.number_of_employees,
        }, { onConflict: 'user_id' });

      if (profileError) throw profileError;

      // Trigger project linking
      await supabase.functions.invoke('link-pending-projects', {
        body: { userEmail: user.email, userId: user.id }
      });

      toast({
        title: "Profile created",
        description: "Welcome! Your profile has been set up successfully."
      });

      onComplete();
    } catch (error: any) {
      console.error('Profile setup error:', error);
      toast({
        title: "Error creating profile",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <ProfileSetupProgress currentStep={currentStep} totalSteps={totalSteps} />
      </CardHeader>
      
      <CardContent>
        <div className="min-h-[400px]">
          {currentStep === 1 && (
            <Step1PersonalInfo
              formData={formData}
              onChange={handleFieldChange}
              errors={errors}
            />
          )}
          {currentStep === 2 && (
            <Step2ProfessionalInfo
              role={formData.role}
              formData={formData}
              onChange={handleFieldChange}
              errors={errors}
            />
          )}
          {currentStep === 3 && formData.role !== 'homeowner' && (
            <Step3CompanyInfo
              formData={formData}
              onChange={handleFieldChange}
              errors={errors}
            />
          )}
        </div>

        <div className="flex justify-between mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || loading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {currentStep < totalSteps ? (
            <Button type="button" onClick={handleNext} disabled={loading}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Complete Setup
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
