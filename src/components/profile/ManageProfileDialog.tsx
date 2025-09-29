import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { User, Lock, Mail, Building2, Upload, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ManageProfileDialogProps {
  children: React.ReactNode;
}

export const ManageProfileDialog = ({ children }: ManageProfileDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [resetPasswordEmail, setResetPasswordEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyPosition, setCompanyPosition] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyLogoUrl, setCompanyLogoUrl] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [linkedCompanyName, setLinkedCompanyName] = useState<string | null>(null);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const fetchLinkedCompany = async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .single();
      
      if (error) throw error;
      setLinkedCompanyName(data.name);
    } catch (error) {
      console.error('Error fetching company:', error);
      setLinkedCompanyName(null);
    }
  };

  React.useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      setCompanyName(profile.company_name || '');
      setCompanyPosition(profile.company_position || '');
      setCompanyAddress(profile.company_address || '');
      setCompanyLogoUrl(profile.company_logo_url || '');
      // setCompanyWebsite(profile.company_website || ''); // Will be enabled after types update
      
      // Fetch linked company name if company_id exists
      if (profile.company_id) {
        fetchLinkedCompany(profile.company_id);
      } else {
        setLinkedCompanyName(null);
      }
    }
    if (user) {
      setResetPasswordEmail(user.email || '');
    }
  }, [profile, user]);

  const updateProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: name.trim(),
          phone: phone.trim(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateCompanyInfo = async () => {
    if (!user) return;
    
    setCompanyLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          company_name: companyName.trim(),
          company_position: companyPosition.trim(),
          company_address: companyAddress.trim(),
          company_logo_url: companyLogoUrl,
          company_website: companyWebsite.trim(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Company information updated",
        description: "Your company information has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating company info:', error);
      toast({
        title: "Error",
        description: "Failed to update company information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCompanyLoading(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 2MB.",
        variant: "destructive",
      });
      return;
    }

    setLogoUploading(true);
    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/company-logo-${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setCompanyLogoUrl(publicUrl);

      toast({
        title: "Logo uploaded",
        description: "Company logo uploaded successfully. Click 'Save Company Information' to save.",
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Error",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLogoUploading(false);
    }
  };

  const removeLogo = () => {
    setCompanyLogoUrl('');
    toast({
      title: "Logo removed",
      description: "Company logo removed. Click 'Save Company Information' to save.",
    });
  };

  const resetPassword = async () => {
    if (!resetPasswordEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetPasswordEmail, {
        redirectTo: `${window.location.origin}/auth?type=recovery`,
      });

      if (error) throw error;

      toast({
        title: "Reset email sent",
        description: "Check your email for password reset instructions.",
      });
    } catch (error) {
      console.error('Error sending reset email:', error);
      toast({
        title: "Error",
        description: "Failed to send reset email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Manage Profile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  value={user?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Email cannot be changed
                </p>
              </div>
              <div>
                <Label>Role</Label>
                <Input
                  value={profile?.role || 'member'}
                  disabled
                  className="bg-muted capitalize"
                />
              </div>
              <Button 
                onClick={updateProfile} 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Updating...' : 'Update Profile'}
              </Button>
            </CardContent>
          </Card>

          <Separator />

          {/* Company Information - Hide for clients */}
          {profile?.role !== 'client' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Company Information
                </CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 {/* Show linked company from signup */}
                 {linkedCompanyName && (
                   <div className="p-3 bg-muted/50 rounded-lg border">
                     <Label className="text-sm font-medium">Linked Company (from signup)</Label>
                     <p className="text-sm text-foreground mt-1">{linkedCompanyName}</p>
                     <p className="text-xs text-muted-foreground mt-1">
                       This company was automatically linked when you signed up
                     </p>
                   </div>
                 )}
                 
                 <div>
                   <Label htmlFor="company-name">Additional Company Details</Label>
                   <Input
                     id="company-name"
                     value={companyName}
                     onChange={(e) => setCompanyName(e.target.value)}
                     placeholder="Additional company information"
                   />
                 </div>
                 <div>
                   <Label htmlFor="company-position">Position/Title</Label>
                   <Input
                     id="company-position"
                     value={companyPosition}
                     onChange={(e) => setCompanyPosition(e.target.value)}
                     placeholder="Enter your position or title"
                   />
                 </div>
                   <div>
                     <Label htmlFor="company-address">Company Address</Label>
                     <Input
                       id="company-address"
                       value={companyAddress}
                       onChange={(e) => setCompanyAddress(e.target.value)}
                       placeholder="Enter company address"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="company-website">Company Website</Label>
                    <Input
                      id="company-website"
                      value={companyWebsite}
                      onChange={(e) => setCompanyWebsite(e.target.value)}
                      placeholder="https://company.com"
                    />
                  </div>

                 {/* Company Logo Upload */}
                 <div>
                   <Label>Company Logo</Label>
                   <div className="space-y-3">
                     {companyLogoUrl && (
                       <div className="flex items-center gap-3 p-3 border rounded-lg">
                         <img 
                           src={companyLogoUrl} 
                           alt="Company logo" 
                           className="w-12 h-12 object-cover rounded"
                         />
                         <div className="flex-1">
                           <p className="text-sm font-medium">Current logo</p>
                           <p className="text-xs text-muted-foreground">Logo will appear behind profile initials</p>
                         </div>
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={removeLogo}
                           disabled={logoUploading}
                         >
                           <X className="h-4 w-4" />
                         </Button>
                       </div>
                     )}
                     <div className="flex items-center gap-2">
                       <Input
                         type="file"
                         accept="image/*"
                         onChange={handleLogoUpload}
                         disabled={logoUploading}
                         className="hidden"
                         id="logo-upload"
                       />
                       <Button
                         variant="outline"
                         onClick={() => document.getElementById('logo-upload')?.click()}
                         disabled={logoUploading}
                         className="flex-1"
                       >
                         <Upload className="h-4 w-4 mr-2" />
                         {logoUploading ? 'Uploading...' : 'Upload Logo'}
                       </Button>
                     </div>
                     <p className="text-xs text-muted-foreground">
                       Upload a company logo (max 2MB). Supported formats: JPG, PNG, GIF.
                     </p>
                   </div>
                 </div>

                 <Button 
                   onClick={updateCompanyInfo} 
                   disabled={companyLoading}
                   className="w-full"
                 >
                   {companyLoading ? 'Saving...' : 'Save Company Information'}
                 </Button>
               </CardContent>
             </Card>
           )}

          <Separator />

          {/* Password Reset */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Password Reset
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="reset-email">Email Address</Label>
                <Input
                  id="reset-email"
                  type="email"
                  value={resetPasswordEmail}
                  onChange={(e) => setResetPasswordEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </div>
              <Button 
                onClick={resetPassword} 
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                <Mail className="h-4 w-4 mr-2" />
                {loading ? 'Sending...' : 'Send Reset Email'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};