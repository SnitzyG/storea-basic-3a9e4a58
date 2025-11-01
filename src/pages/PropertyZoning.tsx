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
import { Loader2, MapPin, Shield, FileText, CheckCircle2, ExternalLink, ArrowRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ZoningData {
  address: string;
  zone: string;
  zoneCode: string;
  overlays: string[];
  lgaName: string;
}

const PropertyZoning = () => {
  const { user } = useAuth();
  const [address, setAddress] = useState("");
  const [projectId, setProjectId] = useState("");
  const [zone, setZone] = useState("");
  const [zoneCode, setZoneCode] = useState("");
  const [overlayInput, setOverlayInput] = useState("");
  const [overlays, setOverlays] = useState<string[]>([]);
  const [lgaName, setLgaName] = useState("");
  const [result, setResult] = useState<ZoningData | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("manual");

  const validateForm = (): boolean => {
    if (!address.trim()) {
      toast.error("Error", { description: "Please enter a property address" });
      return false;
    }
    if (!zone.trim()) {
      toast.error("Error", { description: "Please enter a planning zone" });
      return false;
    }
    return true;
  };

  const addOverlay = () => {
    if (overlayInput.trim() && !overlays.includes(overlayInput.trim())) {
      setOverlays([...overlays, overlayInput.trim()]);
      setOverlayInput("");
    }
  };

  const removeOverlay = (index: number) => {
    setOverlays(overlays.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const zoningData: ZoningData = {
      address: address.trim(),
      zone: zone.trim(),
      zoneCode: zoneCode.trim(),
      overlays,
      lgaName: lgaName.trim(),
    };

    setResult(zoningData);
    toast.success("Zone information ready to save");
  };

  const handleSaveToProject = async () => {
    if (!result || !user) {
      toast.error("Cannot save", {
        description: "No data to save or user not authenticated",
      });
      return;
    }

    try {
      const { error: saveError } = await supabase.from("property_zoning").insert({
        user_id: user.id,
        project_id: projectId.trim() || null,
        address: result.address,
        zone: result.zone,
        zone_code: result.zoneCode,
        overlays: result.overlays,
        lga_name: result.lgaName,
        full_response: result,
        api_called_at: new Date().toISOString(),
      });

      if (saveError) throw saveError;

      setIsSaved(true);
      toast.success("✓ Zoning information saved!", {
        description: "You can now continue with permit requirements.",
      });
    } catch (err) {
      console.error("Error saving to Supabase:", err);
      toast.error("Failed to save", {
        description: "Could not save zoning information to database.",
      });
    }
  };

  const handleNewSearch = () => {
    setAddress("");
    setProjectId("");
    setZone("");
    setZoneCode("");
    setOverlayInput("");
    setOverlays([]);
    setLgaName("");
    setResult(null);
    setIsSaved(false);
    setActiveTab("manual");
  };

  const openVicPlan = () => {
    const encodedAddress = encodeURIComponent(address.trim() || "Victoria Australia");
    window.open(`https://vicplan.vic.gov.au/?search=${encodedAddress}`, "_blank");
  };

  const commonZones = [
    "Residential Zone 1",
    "Residential Zone 2",
    "Residential Growth Zone",
    "Neighbourhood Residential Zone",
    "Commercial 1 Zone",
    "Commercial 2 Zone",
    "Industrial 1 Zone",
    "Industrial 2 Zone",
    "Mixed Use Zone",
    "Township Zone",
    "Rural Zone",
    "Farming Zone",
  ];

  const commonOverlays = [
    "Heritage Overlay",
    "Neighbourhood Character Overlay",
    "Vegetation Protection Overlay",
    "Significant Landscape Overlay",
    "Environmental Significance Overlay",
    "Flood Overlay",
    "Wildfire Management Overlay",
    "Airport Noise Overlay",
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Property Zoning Lookup</h1>
        <p className="text-muted-foreground">
          Find and record your property's planning zone and overlays
        </p>
      </div>

      {result ? (
        // Results view
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Zoning Information
            </CardTitle>
            <CardDescription className="text-base">
              {result.address}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Zone */}
            <div className="bg-primary/10 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="font-medium">Planning Zone:</span>
              </div>
              <p className="text-2xl font-bold text-primary">{result.zone}</p>
              {result.zoneCode && (
                <p className="text-sm text-muted-foreground mt-1">Code: {result.zoneCode}</p>
              )}
            </div>

            {/* LGA */}
            {result.lgaName && (
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div>
                  <span className="font-medium text-sm">Local Government Area:</span>
                  <p className="text-sm">{result.lgaName}</p>
                </div>
              </div>
            )}

            {/* Overlays */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5" />
                <span className="font-medium">Overlays:</span>
              </div>
              {result.overlays && result.overlays.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {result.overlays.map((overlay, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {overlay}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No overlays recorded</p>
              )}
            </div>

            {/* Important Note */}
            <Alert className="bg-blue-50 border-blue-200">
              <FileText className="h-4 w-4" />
              <AlertTitle>Always Verify</AlertTitle>
              <AlertDescription>
                Always verify this information with your local council or by checking 
                <a href="https://vicplan.vic.gov.au" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                  VicPlan.vic.gov.au
                </a>
                {" "}before submitting a planning application.
              </AlertDescription>
            </Alert>

            {/* Project ID */}
            <div className="space-y-2">
              <Label htmlFor="projectId">Project ID or Name (Optional)</Label>
              <Input
                id="projectId"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="e.g., Renovation Project 001"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              <Button
                onClick={handleSaveToProject}
                disabled={isSaved}
                className="flex-1"
              >
                {isSaved ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Saved
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Save to Project
                  </>
                )}
              </Button>

              <Button
                onClick={handleNewSearch}
                variant="secondary"
                className="flex-1"
              >
                New Search
              </Button>
            </div>

            {isSaved && (
              <Alert className="mt-4">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Saved!</AlertTitle>
                <AlertDescription>
                  Zoning information has been saved. Ready for Stage 2: Permit Requirements.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      ) : (
        // Input view
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="vicplan">VicPlan Guide</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Enter Zoning Information</CardTitle>
                <CardDescription>
                  Enter your property details and planning zone information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address">Property Address *</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g., 384 Barkly Street, Elwood VIC 3184"
                  />
                </div>

                {/* Zone Selection */}
                <div className="space-y-2">
                  <Label htmlFor="zone">Planning Zone *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="zone"
                      value={zone}
                      onChange={(e) => setZone(e.target.value)}
                      placeholder="e.g., Residential Zone 1"
                      list="zone-suggestions"
                    />
                  </div>
                  <datalist id="zone-suggestions">
                    {commonZones.map((z) => (
                      <option key={z} value={z} />
                    ))}
                  </datalist>
                  <div className="flex flex-wrap gap-2">
                    {commonZones.map((z) => (
                      <Button
                        key={z}
                        variant="outline"
                        size="sm"
                        onClick={() => setZone(z)}
                        className="text-xs"
                      >
                        {z}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Zone Code */}
                <div className="space-y-2">
                  <Label htmlFor="zoneCode">Zone Code (Optional)</Label>
                  <Input
                    id="zoneCode"
                    value={zoneCode}
                    onChange={(e) => setZoneCode(e.target.value)}
                    placeholder="e.g., RZ1, NRZ, VCZ"
                  />
                </div>

                {/* LGA */}
                <div className="space-y-2">
                  <Label htmlFor="lga">Local Government Area (Optional)</Label>
                  <Input
                    id="lga"
                    value={lgaName}
                    onChange={(e) => setLgaName(e.target.value)}
                    placeholder="e.g., Port Phillip, City of Melbourne"
                  />
                </div>

                {/* Overlays */}
                <div className="space-y-2">
                  <Label>Planning Overlays (Optional)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={overlayInput}
                      onChange={(e) => setOverlayInput(e.target.value)}
                      placeholder="e.g., Heritage Overlay"
                      onKeyDown={(e) => e.key === "Enter" && addOverlay()}
                      list="overlay-suggestions"
                    />
                    <Button onClick={addOverlay} variant="outline">
                      Add
                    </Button>
                  </div>
                  <datalist id="overlay-suggestions">
                    {commonOverlays.map((o) => (
                      <option key={o} value={o} />
                    ))}
                  </datalist>
                  
                  {overlays.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Selected overlays:</p>
                      <div className="flex flex-wrap gap-2">
                        {overlays.map((overlay, index) => (
                          <Badge key={index} variant="secondary" className="text-sm">
                            {overlay}
                            <button
                              onClick={() => removeOverlay(index)}
                              className="ml-1 hover:text-destructive"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {commonOverlays.map((o) => (
                      <Button
                        key={o}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (!overlays.includes(o)) {
                            setOverlays([...overlays, o]);
                          }
                        }}
                        className="text-xs"
                      >
                        {o}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <Button onClick={handleSubmit} className="w-full">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Continue
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vicplan" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Look Up on VicPlan</CardTitle>
                <CardDescription>
                  Follow these steps to find your planning zone
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertTitle>Step-by-Step Guide</AlertTitle>
                  <AlertDescription className="mt-3 space-y-3">
                    <ol className="list-decimal list-inside space-y-2">
                      <li><strong>Enter your address below</strong> and click "Open VicPlan"</li>
                      <li><strong>Search for your property</strong> on the VicPlan map</li>
                      <li><strong>Click on your property</strong> to see zone details</li>
                      <li><strong>Note the following:</strong>
                        <ul className="list-disc list-inside ml-4 mt-1">
                          <li>Zone name (e.g., "Residential Zone 1")</li>
                          <li>Zone code (e.g., "RZ1")</li>
                          <li>Any overlays that apply</li>
                          <li>Local council name</li>
                        </ul>
                      </li>
                      <li><strong>Return here</strong> and enter the information in the "Manual Entry" tab</li>
                    </ol>
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="address2">Property Address</Label>
                  <Input
                    id="address2"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g., 384 Barkly Street, Elwood VIC 3184"
                    onKeyDown={(e) => e.key === "Enter" && openVicPlan()}
                  />
                </div>

                <Button onClick={openVicPlan} disabled={!address.trim()} className="w-full">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open VicPlan Map
                </Button>

                <Button onClick={() => setActiveTab("manual")} variant="secondary" className="w-full">
                  Ready to Enter Data
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            About This Tool
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <p>
            This tool helps you record your property's planning zone and overlays from Victoria's official planning data.
          </p>
          <p>
            <strong>You can:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Manually enter zone information you've looked up</li>
            <li>Get guided help using VicPlan's official map</li>
            <li>Save information to your project for later stages</li>
          </ul>
          <p className="text-xs mt-4">
            <strong>Important:</strong> Always verify zone information on <a href="https://vicplan.vic.gov.au" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">VicPlan.vic.gov.au</a> or with your local council before submitting applications.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PropertyZoning;
