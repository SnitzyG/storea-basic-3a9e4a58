import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Calendar, Clock, FileText, Users, Phone, Mail, Building, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import BidSubmissionForm from '@/components/tenders/BidSubmissionForm';

interface TenderDetails {
  id: string;
  title: string;
  description: string;
  deadline: string;
  budget: number;
  status: string;
  begin_date: string;
  requirements: any;
  project: {
    name: string;
    description: string;
    address: string;
    estimated_start_date: string;
    estimated_finish_date: string;
    homeowner_name: string;
    homeowner_phone: string;
    homeowner_email: string;
  };
  issuer_profile: {
    name: string;
    phone: string;
  };
}

const TenderResponse = () => {
  const { tenderId } = useParams<{ tenderId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [tender, setTender] = useState<TenderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(25);
  const [accessVerified, setAccessVerified] = useState(false);
  const [showBidForm, setShowBidForm] = useState(false);
  
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (!tenderId || !token || !email) {
      toast({
        title: "Invalid Access",
        description: "This tender invitation link is invalid or expired.",
        variant: "destructive",
      });
      navigate('/');
      return;
    }
    
    verifyAccess();
  }, [tenderId, token, email]);

  const verifyAccess = async () => {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // Store the full URL for redirect after auth
      const currentUrl = `/tender/${tenderId}?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
      navigate(`/auth?redirect_to=${encodeURIComponent(currentUrl)}`);
      return;
    }

    // Verify that the logged-in user's email matches the invited email
    if (user.email !== email) {
      toast({
        title: "Access Denied",
        description: "This invitation was sent to a different email address.",
        variant: "destructive",
      });
      navigate('/');
      return;
    }

    try {
      setLoading(true);
      
      // Basic validation for demo purposes
      if (!token || token.length < 10) {
        throw new Error('Invalid token format');
      }
      
      if (!email || !email.includes('@')) {
        throw new Error('Invalid email format');
      }

      // Get tender details with project information
      const { data: tenderData, error: tenderError } = await supabase
        .from('tenders')
        .select(`
          *,
          projects!inner (
            name,
            description,
            address,
            estimated_start_date,
            estimated_finish_date,
            homeowner_name,
            homeowner_phone,
            homeowner_email
          )
        `)
        .eq('id', tenderId)
        .single();

      if (tenderError || !tenderData) {
        throw new Error('Tender not found');
      }

      // Get issuer profile
      const { data: issuerProfile } = await supabase
        .from('profiles')
        .select('name, phone')
        .eq('user_id', tenderData.issued_by)
        .single();

      setTender({
        id: tenderData.id,
        title: tenderData.title,
        description: tenderData.description,
        deadline: tenderData.deadline,
        budget: tenderData.budget,
        status: tenderData.status,
        begin_date: tenderData.begin_date,
        requirements: tenderData.requirements || {},
        project: tenderData.projects,
        issuer_profile: issuerProfile || { name: 'Unknown', phone: '' }
      });
      
      setAccessVerified(true);
    } catch (error) {
      console.error('Access verification failed:', error);
      toast({
        title: "Access Denied",
        description: "Unable to verify your invitation. Please check your link or contact the project architect.",
        variant: "destructive",
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'default';
      case 'closed': return 'secondary';
      case 'awarded': return 'outline';
      default: return 'destructive';
    }
  };

  const isExpired = tender && new Date(tender.deadline) < new Date();
  const daysRemaining = tender ? Math.ceil((new Date(tender.deadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : 0;

  const handleBidSubmission = async (bidData: any) => {
    try {
      // In production, this would submit to Supabase
      console.log('Bid submitted:', bidData);
      
      toast({
        title: "Bid Submitted Successfully",
        description: "Your bid has been submitted and is under review.",
      });
      
      // Redirect back to tender details
      setShowBidForm(false);
      setProgress(100);
    } catch (error) {
      console.error('Bid submission failed:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your bid. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Verifying invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!accessVerified || !tender) {
    return null;
  }

  if (showBidForm) {
    return (
      <BidSubmissionForm
        tender={tender}
        onSubmit={handleBidSubmission}
        onBack={() => setShowBidForm(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <div className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">{tender.title}</h1>
                <Badge variant={getStatusColor(tender.status)} className="ml-2">
                  {tender.status.charAt(0).toUpperCase() + tender.status.slice(1)}
                </Badge>
              </div>
              <p className="text-lg text-muted-foreground">{tender.project.name}</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="text-center sm:text-right">
                <p className="text-sm text-muted-foreground">Submission Deadline</p>
                <p className="text-lg font-semibold text-foreground">
                  {format(new Date(tender.deadline), 'PPP')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isExpired ? 'Expired' : `${daysRemaining} days remaining`}
                </p>
              </div>
              {tender.budget && (
                <div className="text-center sm:text-right">
                  <p className="text-sm text-muted-foreground">Project Budget</p>
                  <p className="text-lg font-semibold text-foreground">
                    ${tender.budget.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Progress Indicator */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Response Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress value={progress} className="w-full" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Viewing Tender Details</span>
                <span>{progress}% Complete</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {isExpired && (
          <Alert className="mb-8 border-destructive">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              This tender submission deadline has passed. You may still view the details but cannot submit a response.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Project Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Project Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Project Description</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {tender.project.description || 'No description provided.'}
                  </p>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-semibold mb-2">Tender Scope</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {tender.description || 'No specific scope details provided.'}
                  </p>
                </div>

                {tender.requirements && Object.keys(tender.requirements).length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-2">Requirements & Specifications</h3>
                      <div className="space-y-2">
                        {Object.entries(tender.requirements).map(([key, value]) => (
                          <div key={key} className="flex justify-between py-1">
                            <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <span className="font-medium">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Project Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Project Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  {tender.project.estimated_start_date && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Estimated Start</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(tender.project.estimated_start_date), 'PPP')}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {tender.project.estimated_finish_date && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Estimated Completion</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(tender.project.estimated_finish_date), 'PPP')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                {tender.begin_date && (
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <p className="font-medium text-primary">Construction Commencement</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(tender.begin_date), 'PPP')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="flex-1"
                disabled={isExpired}
                onClick={() => setShowBidForm(true)}
              >
                <FileText className="h-4 w-4 mr-2" />
                {isExpired ? 'Submission Closed' : 'Start Bid Submission'}
              </Button>
              <Button variant="outline" size="lg">
                <Mail className="h-4 w-4 mr-2" />
                Contact Project Team
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Site Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Site Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tender.project.address && (
                  <div>
                    <p className="font-medium mb-1">Project Location</p>
                    <p className="text-sm text-muted-foreground">{tender.project.address}</p>
                  </div>
                )}
                
                <Separator />
                
                <div>
                  <p className="font-medium mb-2">Site Access Details</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Site inspection by appointment only</li>
                    <li>• Safety induction required</li>
                    <li>• Working hours: 7:00 AM - 6:00 PM</li>
                    <li>• Parking available on-site</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Project Contacts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium mb-1">Project Architect</p>
                  <p className="text-sm text-muted-foreground mb-2">{tender.issuer_profile.name}</p>
                  {tender.issuer_profile.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3 w-3" />
                      <span>{tender.issuer_profile.phone}</span>
                    </div>
                  )}
                </div>
                
                {tender.project.homeowner_name && (
                  <>
                    <Separator />
                    <div>
                      <p className="font-medium mb-1">Project Owner</p>
                      <p className="text-sm text-muted-foreground mb-2">{tender.project.homeowner_name}</p>
                      <div className="space-y-1">
                        {tender.project.homeowner_phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3" />
                            <span>{tender.project.homeowner_phone}</span>
                          </div>
                        )}
                        {tender.project.homeowner_email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3" />
                            <span>{tender.project.homeowner_email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Compliance Requirements */}
            <Card>
              <CardHeader>
                <CardTitle>Australian Compliance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Australian Building Codes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>WorkSafe Requirements</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>GST Compliance Required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Valid ABN Required</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenderResponse;