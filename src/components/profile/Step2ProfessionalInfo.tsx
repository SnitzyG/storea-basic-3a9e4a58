import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface Step2ProfessionalInfoProps {
  role: 'homeowner' | 'architect' | 'builder' | 'contractor';
  formData: any;
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

const specializationOptions = {
  architect: ['Residential', 'Commercial', 'Industrial', 'Landscape', 'Interior', 'Urban Planning'],
  builder: ['Residential', 'Commercial', 'Renovations', 'Extensions', 'Custom Homes', 'Multi-Unit'],
  contractor: ['Plumbing', 'Electrical', 'Carpentry', 'HVAC', 'Roofing', 'Painting', 'Landscaping', 'Flooring']
};

const projectTypeOptions = ['New Build', 'Renovation', 'Extension', 'Landscaping', 'Interior Design', 'Other'];

export const Step2ProfessionalInfo: React.FC<Step2ProfessionalInfoProps> = ({
  role,
  formData,
  onChange,
  errors = {}
}) => {
  const handleSpecializationToggle = (spec: string) => {
    const current = formData.specialization || [];
    const updated = current.includes(spec)
      ? current.filter((s: string) => s !== spec)
      : [...current, spec];
    onChange('specialization', updated);
  };

  // Homeowner fields
  if (role === 'homeowner') {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold">Property Information</h3>
          <p className="text-sm text-muted-foreground">
            Tell us about your project
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="property_address">Property Address *</Label>
          <Input
            id="property_address"
            value={formData.property_address || ''}
            onChange={(e) => onChange('property_address', e.target.value)}
            placeholder="123 Main St, City, State, ZIP"
            className={errors.property_address ? 'border-destructive' : ''}
          />
          {errors.property_address && (
            <p className="text-sm text-destructive">{errors.property_address}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="project_type">Project Type *</Label>
          <Select value={formData.project_type || ''} onValueChange={(value) => onChange('project_type', value)}>
            <SelectTrigger className={errors.project_type ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select project type" />
            </SelectTrigger>
            <SelectContent>
              {projectTypeOptions.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.project_type && (
            <p className="text-sm text-destructive">{errors.project_type}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="budget_range">Budget Range (Optional)</Label>
          <Select value={formData.budget_range || ''} onValueChange={(value) => onChange('budget_range', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select budget range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="under-50k">Under $50,000</SelectItem>
              <SelectItem value="50k-100k">$50,000 - $100,000</SelectItem>
              <SelectItem value="100k-250k">$100,000 - $250,000</SelectItem>
              <SelectItem value="250k-500k">$250,000 - $500,000</SelectItem>
              <SelectItem value="over-500k">Over $500,000</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="timeline">Timeline (Optional)</Label>
          <Select value={formData.timeline || ''} onValueChange={(value) => onChange('timeline', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select project timeline" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asap">ASAP</SelectItem>
              <SelectItem value="1-3-months">1-3 months</SelectItem>
              <SelectItem value="3-6-months">3-6 months</SelectItem>
              <SelectItem value="6-12-months">6-12 months</SelectItem>
              <SelectItem value="over-12-months">Over 12 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  // Professional fields (architect, builder, contractor)
  const specs = specializationOptions[role as keyof typeof specializationOptions] || [];

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">Professional Information</h3>
        <p className="text-sm text-muted-foreground">
          Tell us about your professional background
        </p>
      </div>

      {role !== 'contractor' && (
        <div className="space-y-2">
          <Label htmlFor="company">Company Name *</Label>
          <Input
            id="company"
            value={formData.company || ''}
            onChange={(e) => onChange('company', e.target.value)}
            placeholder="Your company name"
            className={errors.company ? 'border-destructive' : ''}
          />
          {errors.company && (
            <p className="text-sm text-destructive">{errors.company}</p>
          )}
        </div>
      )}

      {role === 'contractor' && (
        <div className="space-y-2">
          <Label htmlFor="company">Company Name (Optional for individuals)</Label>
          <Input
            id="company"
            value={formData.company || ''}
            onChange={(e) => onChange('company', e.target.value)}
            placeholder="Leave blank if operating as individual"
          />
          <p className="text-xs text-muted-foreground">
            Fill this out only if you represent a company
          </p>
        </div>
      )}

      {(role === 'architect' || role === 'builder') && (
        <div className="space-y-2">
          <Label htmlFor="company_position">Position/Title *</Label>
          <Select value={formData.company_position || ''} onValueChange={(value) => onChange('company_position', value)}>
            <SelectTrigger className={errors.company_position ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select your position" />
            </SelectTrigger>
            <SelectContent>
              {role === 'architect' ? (
                <>
                  <SelectItem value="Principal">Principal</SelectItem>
                  <SelectItem value="Senior Architect">Senior Architect</SelectItem>
                  <SelectItem value="Architect">Architect</SelectItem>
                  <SelectItem value="Junior Architect">Junior Architect</SelectItem>
                  <SelectItem value="Designer">Designer</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="Director">Director</SelectItem>
                  <SelectItem value="Project Manager">Project Manager</SelectItem>
                  <SelectItem value="Site Manager">Site Manager</SelectItem>
                  <SelectItem value="Builder">Builder</SelectItem>
                  <SelectItem value="Supervisor">Supervisor</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
          {errors.company_position && (
            <p className="text-sm text-destructive">{errors.company_position}</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="professional_license_number">
          {role === 'contractor' ? 'Trade License Number *' : 'Professional License Number *'}
        </Label>
        <Input
          id="professional_license_number"
          value={formData.professional_license_number || ''}
          onChange={(e) => onChange('professional_license_number', e.target.value)}
          placeholder="Enter your license number"
          className={errors.professional_license_number ? 'border-destructive' : ''}
        />
        {errors.professional_license_number && (
          <p className="text-sm text-destructive">{errors.professional_license_number}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="years_experience">Years of Experience *</Label>
        <Input
          id="years_experience"
          type="number"
          min="0"
          max="70"
          value={formData.years_experience || ''}
          onChange={(e) => onChange('years_experience', parseInt(e.target.value) || 0)}
          placeholder="0"
          className={errors.years_experience ? 'border-destructive' : ''}
        />
        {errors.years_experience && (
          <p className="text-sm text-destructive">{errors.years_experience}</p>
        )}
      </div>

      <div className="space-y-3">
        <Label>
          {role === 'contractor' ? 'Trade/Specialty *' : 'Specialization *'}
        </Label>
        <div className="grid grid-cols-2 gap-3">
          {specs.map(spec => (
            <div key={spec} className="flex items-center space-x-2">
              <Checkbox
                id={spec}
                checked={(formData.specialization || []).includes(spec)}
                onCheckedChange={() => handleSpecializationToggle(spec)}
              />
              <label
                htmlFor={spec}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {spec}
              </label>
            </div>
          ))}
        </div>
        {errors.specialization && (
          <p className="text-sm text-destructive">{errors.specialization}</p>
        )}
      </div>

      {role === 'builder' && (
        <div className="space-y-2">
          <Label htmlFor="business_registration_number">Business Registration Number/ABN *</Label>
          <Input
            id="business_registration_number"
            value={formData.business_registration_number || ''}
            onChange={(e) => onChange('business_registration_number', e.target.value)}
            placeholder="Enter your ABN or registration number"
            className={errors.business_registration_number ? 'border-destructive' : ''}
          />
          {errors.business_registration_number && (
            <p className="text-sm text-destructive">{errors.business_registration_number}</p>
          )}
        </div>
      )}

      {role === 'contractor' && (
        <div className="space-y-2">
          <Label htmlFor="insurance_details">Insurance Details *</Label>
          <Textarea
            id="insurance_details"
            value={formData.insurance_details || ''}
            onChange={(e) => onChange('insurance_details', e.target.value)}
            placeholder="Provide details of your public liability insurance"
            rows={3}
            className={errors.insurance_details ? 'border-destructive' : ''}
          />
          {errors.insurance_details && (
            <p className="text-sm text-destructive">{errors.insurance_details}</p>
          )}
        </div>
      )}

      {(role === 'architect' || role === 'builder') && (
        <div className="space-y-2">
          <Label htmlFor="linkedin_url">LinkedIn Profile (Optional)</Label>
          <Input
            id="linkedin_url"
            type="url"
            value={formData.linkedin_url || ''}
            onChange={(e) => onChange('linkedin_url', e.target.value)}
            placeholder="https://linkedin.com/in/yourprofile"
            className={errors.linkedin_url ? 'border-destructive' : ''}
          />
          {errors.linkedin_url && (
            <p className="text-sm text-destructive">{errors.linkedin_url}</p>
          )}
        </div>
      )}
    </div>
  );
};
