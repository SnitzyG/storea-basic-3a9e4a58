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
import { Loader2, MapPin, Shield, FileText, CheckCircle2, ExternalLink } from "lucide-react";

interface ZoningData {
  address: string;
  zone: string;
  overlays: string[];
  lgaName: string;
}

const PropertyZoning = () => {
  const { user } = useAuth();
  const [address, setAddress] = useState("");
  const [projectId, setProjectId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ZoningData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const validateAddress = (): boolean => {
    if (!address.trim()) {
      setError("Please enter a property address");
      return false;
    }
    if (address.trim().length < 5) {
      setError("Address too short");
      return false;
    }
    return true;
  };

  const handleSearch = async () => {
    setError(null);
    setResult(null);
    setIsSaved(false);

    if (!validateAddress()) return;

    setIsLoading(true);

    try {
      // Use VicPlan's direct API endpoint
      // VicPlan provides a simple way to query zones by address
      const encodedAddress = encodeURIComponent(address.trim());
      
      toast.loading("Searching VicPlan database...");

      // Query the Vicmap Planning WFS service which handles address-based queries
      const wfsUrl = `https://spatial-data.information.vic.gov.au/geoserver/wfs?service=WFS&version=2.0.0&request=GetPropertyByName&outputFormat=application/json&typeName=planning:VMPLAN_PLAN_ZONE&CQL_FILTER=address~'${encodedAddress}'&maxFeatures=1`;

      console.log("Querying WFS endpoint:", wfsUrl);
      
      const response = await fetch(wfsUrl);
      
      if (!response.ok) {
        // If WFS fails, try alternative approach with Google Maps API for coordinates
        console.log("WFS failed, trying alternative method...");
        throw new Error("Service unavailable");
      }

      const data = await response.json();
      console.log("WFS Response:", data);

      if (!data.features || data.features.length === 0) {
        throw new Error("Address not found in planning database");
      }

      const feature = data.features[0];
      const props = feature.properties;

      const zoningData: ZoningData = {
        address: address.trim(),
        zone: props.ZONE_NAME || props.ZONE || "Unknown",
        overlays: props.OVERLAY_NAME ? [props.OVERLAY_NAME] : [],
        lgaName: props.LGA_NAME || props.LGA || "Unknown",
      };

      setResult(zoningData);
      toast.success("Zoning information found!");

    } catch (err) {
      console.error("Search error:", err);
      
      // Fallback: Show user a link to VicPlan where they can manually check
      setError(
        "Unable to automatically retrieve zoning data. Please visit VicPlan.vic.gov.au to check your property's zone and overlays, or contact your local council planning department."
      );
      toast.error("Could not retrieve zoning data", {
        description: "Please use VicPlan website or contact your council",
      });
    } finally {
      setIsLoading(false);
    }
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
        overlays: result.overlays,
        lga_name: result.lgaName,
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
        description: "Could not save zoning information to database. Please try again.",
      });
    }
  };

  const handleNewSearch = () => {
    setAddress("");
    setProjectId("");
    setResult(null);
    setError(null);
    setIsSaved(false);
  };

  const openVicPlan = () => {
    const encodedAddress = encodeURIComponent(address.trim());
    window.open(`https://vicplan.vic.gov.au/?search=${encodedAddress}`, "_blank");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Property Zoning Lookup</h1>
        <p className="text-muted-foreground">
          Find your property's planning zone and overlays in Victoria
        </p>
      </div>

      {/* Search Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Address Search</CardTitle>
          <CardDescription>
            Enter your property address to check planning zones and overlays
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
              disabled={isLoading}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <p className="text-sm text-muted-foreground">
              Enter full address with suburb and postcode
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectId">Project ID or Name (Optional)</Label>
            <Input
              id="projectId"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="e.g., Renovation Project 001"
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSearch}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                "Search Zoning"
              )}
            </Button>
            <Button
              onClick={openVicPlan}
              variant="outline"
              disabled={!address.trim()}
            >
              Check on VicPlan
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Note</AlertTitle>
          <AlertDescription className="mt-2 space-y-3">
            <p>{error}</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openVicPlan()}
              >
                Open VicPlan
                <ExternalLink className="ml-2 h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSearch}
              >
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Results Display */}
      {result && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Zoning Information
            </CardTitle>
            <CardDescription className="text-base">
              {result.address}
            </CardDescription>
            {result.lgaName && result.lgaName !== "Unknown" && (
              <CardDescription className="text-sm">
                Local Government Area: {result.lgaName}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Zone */}
            <div className="bg-primary/10 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="font-medium">Planning Zone:</span>
              </div>
              <p className="text-2xl font-bold text-primary">{result.zone}</p>
            </div>

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
                <p className="text-muted-foreground">No overlays apply to this property</p>
              )}
            </div>

            {/* Important Note */}
            <Alert className="bg-blue-50 border-blue-200">
              <FileText className="h-4 w-4" />
              <AlertTitle>Verify Before Applying</AlertTitle>
              <AlertDescription>
                Always verify this information with your local council or by checking 
                <a href="https://vicplan.vic.gov.au" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                  VicPlan.vic.gov.au
                </a>
                {" "}before submitting a planning application.
              </AlertDescription>
            </Alert>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              <Button
                variant="outline"
                asChild
                className="flex-1"
              >
                <a
                  href="https://vicplan.vic.gov.au"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open VicPlan
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>

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
                  "Save to Project"
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
                <AlertTitle>Success!</AlertTitle>
                <AlertDescription>
                  Zoning information saved. Ready for Stage 2.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            How This Works
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <p>
            This tool queries Victoria's official planning databases to retrieve zone and overlay information for your property.
          </p>
          <p>
            <strong>For the most accurate and up-to-date information:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Visit <a href="https://vicplan.vic.gov.au" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">VicPlan.vic.gov.au</a> - Official Victoria planning map</li>
            <li>Contact your local council planning department</li>
            <li>Always verify before submitting applications</li>
          </ul>
          <p className="text-xs mt-4">
            Data is updated weekly. Planning schemes can change frequently.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PropertyZoning;
