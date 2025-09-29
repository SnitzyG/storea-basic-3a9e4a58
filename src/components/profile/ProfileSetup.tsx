import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, User } from 'lucide-react';

interface ProfileSetupProps {
  onComplete: () => void;
}

export const ProfileSetup: React.FC<ProfileSetupProps> = ({ onComplete }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    role: 'contractor' as 'client' | 'lead_contractor' | 'contractor' | 'lead_consultant',
    company: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Initialize form data from signup metadata
  useEffect(() => {
    const initializeFromSignup = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.user_metadata) {
          setFormData(prev => ({
            ...prev,
            name: user.user_metadata.name || '',
            role: user.user_metadata.role || 'contractor',
            company: user.user_metadata.company || ''
          }));
        }
      } catch (error) {
        console.error('Error loading signup data:', error);
      }
    };
    
    initializeFromSignup();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // The handle_new_user trigger will automatically handle company creation/linking
      // based on the signup metadata, so we just need to create/update the profile
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          name: formData.name.trim(),
          phone: formData.phone.trim() || null,
          role: formData.role
        });

      if (error) throw error;

      // Trigger automatic project linking for pending invitations
      // This will be handled by the handle_user_project_linking trigger
      await supabase.functions.invoke('link-pending-projects', {
        body: { 
          userEmail: user.email,
          userId: user.id 
        }
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
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
            <User className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <p className="text-muted-foreground">
            Let's get you set up so you can start collaborating on projects.
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Enter your phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={formData.role} onValueChange={(value: any) => setFormData(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="lead_consultant">Lead Consultant</SelectItem>
                  <SelectItem value="lead_contractor">Lead Contractor</SelectItem>
                  <SelectItem value="contractor">Contractor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                placeholder="Enter your company name (optional)"
                disabled={!!formData.company} // Disable if pre-filled from signup
              />
              {formData.company && (
                <p className="text-xs text-muted-foreground">
                  Company information from signup
                </p>
              )}
            </div>

            <Button type="submit" disabled={loading || !formData.name.trim()} className="w-full">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Complete Setup
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};