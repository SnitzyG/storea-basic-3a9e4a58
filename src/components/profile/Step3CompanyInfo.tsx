import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Step3CompanyInfoProps {
  formData: any;
  onChange: (field: string, value: any) => void;
  errors?: Record<string, string>;
}

export const Step3CompanyInfo: React.FC<Step3CompanyInfoProps> = ({
  formData,
  onChange,
  errors = {}
}) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('No user');

      const fileName = `${user.id}/company-logo.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('company-logos')
        .getPublicUrl(filePath);

      onChange('company_logo_url', data.publicUrl);
      // Keep profile avatar in sync with company logo
      onChange('avatar_url', data.publicUrl);
      
      toast({
        title: "Logo uploaded",
        description: "Company logo has been updated"
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">Company Details</h3>
        <p className="text-sm text-muted-foreground">
          Additional information about your business
        </p>
      </div>

      <div className="space-y-2">
        <Label>Company Logo</Label>
        <div className="flex items-center gap-4">
          {formData.company_logo_url && (
            <img
              src={formData.company_logo_url}
              alt="Company logo"
              className="h-16 w-16 object-contain rounded border"
            />
          )}
          <label htmlFor="logo-upload">
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              onClick={() => document.getElementById('logo-upload')?.click()}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Logo
                </>
              )}
            </Button>
            <input
              id="logo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="company_address">Company Address</Label>
        <Input
          id="company_address"
          value={formData.company_address || ''}
          onChange={(e) => onChange('company_address', e.target.value)}
          placeholder="123 Business St, City, State, ZIP"
          className={errors.company_address ? 'border-destructive' : ''}
        />
        {errors.company_address && (
          <p className="text-sm text-destructive">{errors.company_address}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="company_phone">Company Phone</Label>
        <Input
          id="company_phone"
          type="tel"
          value={formData.company_phone || ''}
          onChange={(e) => onChange('company_phone', e.target.value)}
          placeholder="+1 (555) 000-0000"
          className={errors.company_phone ? 'border-destructive' : ''}
        />
        {errors.company_phone && (
          <p className="text-sm text-destructive">{errors.company_phone}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="company_website">Company Website</Label>
        <Input
          id="company_website"
          type="url"
          value={formData.company_website || ''}
          onChange={(e) => onChange('company_website', e.target.value)}
          placeholder="https://yourcompany.com"
          className={errors.company_website ? 'border-destructive' : ''}
        />
        {errors.company_website && (
          <p className="text-sm text-destructive">{errors.company_website}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="number_of_employees">Number of Employees</Label>
        <Input
          id="number_of_employees"
          type="number"
          min="1"
          value={formData.number_of_employees || ''}
          onChange={(e) => onChange('number_of_employees', parseInt(e.target.value) || undefined)}
          placeholder="e.g., 10"
        />
      </div>
    </div>
  );
};
