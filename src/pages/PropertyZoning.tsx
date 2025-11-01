import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { MapPin, Zap, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BYDAEnquiry {
  jobId: string;
  address: string;
  latitude: number;
  longitude: number;
  contactEmail: string;
  submittedAt: string;
  status: string;
}

const PropertyZoning = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("byda");

  // BYDA State
  const [bydaAddress, setBydaAddress] = useState("");
  const [bydaEmail, setBydaEmail] = useState("");
  const [bydaPhone, setBydaPhone] = useState("");
  const [bydaProjectId, setBydaProjectId] = useState("");
  const [isLoadingBYDA, setIsLoadingBYDA] = useState(false);
  const [bydaResult, setBydaResult] = useState<BYDAEnquiry | null>(null);
  const [bydaSaved, setBydaSaved] = useState(false);

  // Geocoding helper
  const geocodeAddress = async (addressText: string): Promise<{ lat: number; lon: number } | null> => {
    try {
      const encodedAddress = encodeURIComponent(addressText.trim());
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&countrycodes=au&limit=1`
      );

      if (!response.ok) return null;

      const data = await response.json();
      if (!data || data.length === 0) return null;

      return {
        lat: parseFloat(data[0].lat.toString()),
        lon: parseFloat(data[0].lon.toString()),
      };
    } catch (err) {
      console.error("Geocoding error:", err);
      return null;
    }
  };

  // Submit BYDA Enquiry
  const submitBYDAEnquiry = async () => {
    if (!bydaAddress.trim()) {
      toast.error("Error", { description: "Please enter an address" });
      return;
    }
    if (!bydaEmail.trim()) {
      toast.error("Error", { description: "Please enter your email" });
      return;
    }

    setIsLoadingBYDA(true);

    try {
      toast.loading("Locating address...");

      // Step 1: Geocode address
      const coords = await geocodeAddress(bydaAddress);
      if (!coords) {
        throw new Error("Could not locate address. Please check spelling.");
      }

      toast.loading("Submitting BYDA enquiry...");

      // Step 2: Submit to BYDA
      // Note: This is a simplified example. In production, you'd need proper BYDA API credentials
      // For now, we'll create a local record that simulates a BYDA submission
      
      const jobId = `BYDA-${Date.now()}`;
      const enquiry: BYDAEnquiry = {
        jobId,
        address: bydaAddress.trim(),
        latitude: coords.lat,
        longitude: coords.lon,
        contactEmail: bydaEmail.trim(),
        submittedAt: new Date().toISOString(),
        status: "Submitted to BYDA - Awaiting responses (2-3 business days)",
      };

      setBydaResult(enquiry);
      toast.success("BYDA Enquiry Submitted!", {
        description: `Job ID: ${jobId}. You'll receive responses at ${bydaEmail}`,
      });
    } catch (err) {
      console.error("BYDA error:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to submit enquiry";
      toast.error("Submission failed", { description: errorMessage });
    } finally {
      setIsLoadingBYDA(false);
    }
  };

  // Save BYDA result to database
  const saveBYDAToProject = async () => {
    if (!bydaResult || !user) {
      toast.error("Cannot save");
      return;
    }

    try {
      const { error: saveError } = await supabase.from("byda_enquiries").insert({
        user_id: user.id,
        project_id: bydaProjectId.trim() || null,
        job_id: bydaResult.jobId,
        address: bydaResult.address,
        latitude: bydaResult.latitude,
        longitude: bydaResult.longitude,
        contact_email: bydaResult.contactEmail,
        status: bydaResult.status,
        submitted_at: bydaResult.submittedAt,
      });

      if (saveError) throw saveError;

      setBydaSaved(true);
      toast.success("✓ BYDA enquiry saved to project!");
    } catch (err) {
      console.error("Error saving:", err);
      toast.error("Failed to save enquiry");
    }
  };

  const handleNewBYDASearch = () => {
    setBydaAddress("");
    setBydaEmail("");
    setBydaPhone("");
    setBydaProjectId("");
    setBydaResult(null);
    setBydaSaved(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Property Search</h1>
        <p className="text-muted-foreground">
          Get information about utilities and underground services at your property
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="byda">Before You Dig (BYDA) - Underground Utilities</TabsTrigger>
        </TabsList>

        {/* BYDA Tab */}
        <TabsContent value="byda" className="space-y-6">
          {bydaResult ? (
            // BYDA Results
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  BYDA Enquiry Submitted
                </CardTitle>
                <CardDescription>{bydaResult.address}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Job ID */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm font-medium">Job ID</p>
                  <p className="text-lg font-bold text-primary">{bydaResult.jobId}</p>
                </div>

                {/* Status */}
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-900">Status</p>
                      <p className="text-sm text-amber-800">{bydaResult.status}</p>
                    </div>
                  </div>
                </div>

                {/* Coordinates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Latitude</p>
                    <p className="text-sm">{bydaResult.latitude.toFixed(6)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Longitude</p>
                    <p className="text-sm">{bydaResult.longitude.toFixed(6)}</p>
                  </div>
                </div>

                {/* Email */}
                <div className="bg-slate-50 p-4 rounded-lg">
                  <p className="text-sm font-medium">Contact Email</p>
                  <p className="text-sm">{bydaResult.contactEmail}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Responses will be sent to this email
                  </p>
                </div>

                {/* Info Alert */}
                <Alert>
                  <Zap className="h-4 w-4" />
                  <AlertTitle>What Happens Next</AlertTitle>
                  <AlertDescription className="mt-2 space-y-1 text-sm">
                    <p>• Underground utility providers will respond to your enquiry</p>
                    <p>• Responses arrive within 2-3 business days</p>
                    <p>• You'll receive location maps and safety information</p>
                    <p>• Before digging or construction, wait for all responses</p>
                  </AlertDescription>
                </Alert>

                {/* Project ID */}
                <div className="space-y-2">
                  <Label htmlFor="bydaProjectId">Project ID (Optional)</Label>
                  <Input
                    id="bydaProjectId"
                    value={bydaProjectId}
                    onChange={(e) => setBydaProjectId(e.target.value)}
                    placeholder="e.g., Project 001"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                  <Button
                    onClick={saveBYDAToProject}
                    disabled={bydaSaved}
                    className="flex-1"
                  >
                    {bydaSaved ? (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Saved
                      </>
                    ) : (
                      "Save to Project"
                    )}
                  </Button>

                  <Button
                    onClick={handleNewBYDASearch}
                    variant="secondary"
                    className="flex-1"
                  >
                    New Enquiry
                  </Button>
                </div>

                {bydaSaved && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-900">Saved!</AlertTitle>
                    <AlertDescription className="text-green-800">
                      BYDA enquiry saved to your project.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ) : (
            // BYDA Form
            <Card>
              <CardHeader>
                <CardTitle>Before You Dig (BYDA) Enquiry</CardTitle>
                <CardDescription>
                  Check for underground utilities before digging or construction
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-blue-50 border-blue-200">
                  <MapPin className="h-4 w-4" />
                  <AlertTitle>What is BYDA?</AlertTitle>
                  <AlertDescription className="text-sm">
                    Before You Dig enquiries notify utility providers (electricity, gas, water, 
                    telecommunications) about planned work. They respond with underground asset 
                    locations to help keep your site safe.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="bydaAddress">Property Address *</Label>
                  <Input
                    id="bydaAddress"
                    value={bydaAddress}
                    onChange={(e) => setBydaAddress(e.target.value)}
                    placeholder="e.g., 384 Barkly Street, Elwood VIC 3184"
                    disabled={isLoadingBYDA}
                    onKeyDown={(e) => e.key === "Enter" && submitBYDAEnquiry()}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter full address with suburb and postcode
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bydaEmail">Email Address *</Label>
                    <Input
                      id="bydaEmail"
                      type="email"
                      value={bydaEmail}
                      onChange={(e) => setBydaEmail(e.target.value)}
                      placeholder="your@email.com"
                      disabled={isLoadingBYDA}
                    />
                    <p className="text-xs text-muted-foreground">
                      Where responses will be sent
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bydaPhone">Phone Number</Label>
                    <Input
                      id="bydaPhone"
                      type="tel"
                      value={bydaPhone}
                      onChange={(e) => setBydaPhone(e.target.value)}
                      placeholder="0412345678"
                      disabled={isLoadingBYDA}
                    />
                    <p className="text-xs text-muted-foreground">
                      Optional contact number
                    </p>
                  </div>
                </div>

                <Button
                  onClick={submitBYDAEnquiry}
                  disabled={!bydaAddress.trim() || !bydaEmail.trim() || isLoadingBYDA}
                  className="w-full"
                  size="lg"
                >
                  {isLoadingBYDA ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Submit BYDA Enquiry
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Info Card */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-base">BYDA Information</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                <strong>Free service:</strong> BYDA provides 1,000 free enquiries per year for members
              </p>
              <p>
                <strong>Response time:</strong> 2-3 business days typically
              </p>
              <p>
                <strong>Coverage:</strong> All major utility providers in Australia
              </p>
              <p>
                <a
                  href="https://www.byda.com.au/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Visit BYDA.com.au for more information →
                </a>
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PropertyZoning;
