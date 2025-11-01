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
import { MapPin, Shield, FileText, CheckCircle2, ExternalLink, Loader2 } from "lucide-react";

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
  const [overlays, setOverlays] = useState<string[]>([]);
  const [lgaName, setLgaName] = useState("");
  const [overlayInput, setOverlayInput] = useState("");
  const [result, setResult] = useState<ZoningData | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const addOverlay = () => {
    if (overlayInput.trim() && !overlays.includes(overlayInput.trim())) {
      setOverlays([...overlays, overlayInput.trim()]);
      setOverlayInput("");
    }
  };

  const removeOverlay = (index: number) => {
    setOverlays(overlays.filter((_, i) => i !== index));
  };

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

  const handleOpenVicPlan = () => {
    // Open VicPlan in new window
    const vicplanUrl = `https://mapshare.vic.gov.au/vicplan/`;
    window.open(vicplanUrl, "vicplan", "width=1200,height=800");
    
    toast.info("VicPlan opened", {
      description: "Search for your property and note the zone and overlays, then come back here to enter the details.",
    });
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
                Always verify this information on{" "}
                <a
                  href="https://mapshare.vic.gov.au/vicplan/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  VicPlan MapShare
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
        <div className="space-y-6">
          {/* Address Input Card */}
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Enter Your Address</CardTitle>
              <CardDescription>
                Enter your property address
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Property Address *</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g., 384 Barkly Street, Elwood VIC 3184"
                  onKeyDown={(e) => e.key === "Enter" && handleOpenVicPlan()}
                />
                <p className="text-sm text-muted-foreground">
                  Enter your full address with suburb and postcode
                </p>
              </div>

              <Button 
                onClick={handleOpenVicPlan} 
                disabled={!address.trim()}
                className="w-full" 
                size="lg"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Search on VicPlan
              </Button>
            </CardContent>
          </Card>

          {/* Zone Entry Card */}
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Enter Zone Information</CardTitle>
              <CardDescription>
                From VicPlan, enter the planning zone and overlay details for {address || "your property"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-amber-50 border-amber-200">
                <FileText className="h-4 w-4" />
                <AlertTitle>Instructions</AlertTitle>
                <AlertDescription className="mt-2">
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Click "Search on VicPlan" above</li>
                    <li>Search for your address in the map</li>
                    <li>Click on your property to see details</li>
                    <li>Note the Planning Zone and any Overlays</li>
                    <li>Come back and enter the details below</li>
                  </ol>
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Zone */}
                <div className="space-y-2">
                  <Label htmlFor="zone">Planning Zone *</Label>
                  <Input
                    id="zone"
                    value={zone}
                    onChange={(e) => setZone(e.target.value)}
                    placeholder="e.g., Residential Zone 1"
                    list="zone-suggestions"
                  />
                  <datalist id="zone-suggestions">
                    {commonZones.map((z) => (
                      <option key={z} value={z} />
                    ))}
                  </datalist>
                </div>

                {/* Zone Code */}
                <div className="space-y-2">
                  <Label htmlFor="zoneCode">Zone Code (Optional)</Label>
                  <Input
                    id="zoneCode"
                    value={zoneCode}
                    onChange={(e) => setZoneCode(e.target.value)}
                    placeholder="e.g., RZ1, NRZ"
                  />
                </div>

                {/* LGA */}
                <div className="space-y-2">
                  <Label htmlFor="lga">Local Government Area (Optional)</Label>
                  <Input
                    id="lga"
                    value={lgaName}
                    onChange={(e) => setLgaName(e.target.value)}
                    placeholder="e.g., Port Phillip"
                  />
                </div>
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

              {/* Continue Button */}
              <Button onClick={handleSubmit} className="w-full" size="lg">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Continue to Review
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200 mt-6">
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
          <ol className="list-decimal list-inside space-y-1">
            <li>Enter your address</li>
            <li>Look it up on VicPlan MapShare</li>
            <li>Enter the zone and overlay information</li>
            <li>Save to your project</li>
          </ol>
          <p className="text-xs mt-4">
            <strong>Data source:</strong> <a href="https://mapshare.vic.gov.au/vicplan/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">VicPlan MapShare</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PropertyZoning;
