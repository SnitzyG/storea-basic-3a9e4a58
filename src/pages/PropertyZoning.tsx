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
import { Loader2, MapPin, Shield, Ruler, Building2, FileText, CheckCircle2, ExternalLink } from "lucide-react";

interface VicPlanResponse {
  address: string;
  zone: string;
  overlays: string[];
  heightLimit: string;
  buildingCoverage: string;
  planningScheme: string;
}

const PropertyZoning = () => {
  const { user } = useAuth();
  const [address, setAddress] = useState("");
  const [projectId, setProjectId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VicPlanResponse | null>(null);
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
      const encodedAddress = encodeURIComponent(address.trim());
      const apiUrl = `https://api.planning.vic.gov.au/v1/planningSchemes?address=${encodedAddress}`;
      
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("This address was not found. Please check the spelling or try a different format.");
        }
        if (response.status === 400) {
          throw new Error("Address format invalid. Try: '123 Street Name, Suburb VIC 3000'");
        }
        throw new Error("Failed to fetch zoning information. Please try again.");
      }

      const data: VicPlanResponse = await response.json();
      setResult(data);
      
      toast.success("Zoning information retrieved successfully!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Connection error. Please check your internet and try again.";
      setError(errorMessage);
      console.error("VicPlan API error:", err);
      
      toast.error("Failed to load zoning data", {
        description: errorMessage,
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
        height_limit: result.heightLimit,
        building_coverage: result.buildingCoverage,
        planning_scheme: result.planningScheme,
        full_response: result as any,
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

  const getOverlayLink = (overlay: string) => {
    const overlayCode = overlay.match(/[A-Z]{2,3}\d+/)?.[0] || "";
    return `https://planning-schemes.delwp.vic.gov.au/${overlayCode}`;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Property Zoning Lookup</h1>
        <p className="text-muted-foreground">
          Search Victorian planning zones and overlays for your property
        </p>
      </div>

      {/* Search Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Address Input</CardTitle>
          <CardDescription>
            Enter the full street address with suburb and postcode
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
              Enter the full street address with suburb and postcode
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectId">Project ID or Name</Label>
            <Input
              id="projectId"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="e.g., Renovation Project 001"
              disabled={isLoading}
            />
          </div>

          <Button
            onClick={handleSearch}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching... please wait
              </>
            ) : (
              "Search Zoning Information"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="mt-2">
            {error}
            <div className="mt-3">
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
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Zone */}
            <div className="bg-primary/10 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="font-medium">Zone:</span>
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
                    <Badge
                      key={index}
                      variant="secondary"
                      className="text-sm"
                    >
                      <a
                        href={getOverlayLink(overlay)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:underline"
                      >
                        {overlay}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No overlays apply</p>
              )}
            </div>

            {/* Height Limit */}
            <div className="flex items-start gap-3">
              <Ruler className="h-5 w-5 mt-0.5" />
              <div>
                <span className="font-medium">Maximum Height:</span>
                <p className="text-lg">{result.heightLimit || "Not restricted"}</p>
              </div>
            </div>

            {/* Building Coverage */}
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 mt-0.5" />
              <div>
                <span className="font-medium">Building Coverage:</span>
                <p className="text-lg">{result.buildingCoverage || "Not specified"}</p>
              </div>
            </div>

            {/* Planning Scheme */}
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 mt-0.5" />
              <div>
                <span className="font-medium">Planning Scheme:</span>
                <p className="text-lg">
                  <a
                    href="https://planning-schemes.delwp.vic.gov.au"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    {result.planningScheme}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              <Button
                variant="outline"
                asChild
                className="flex-1"
              >
                <a
                  href="https://planning-schemes.delwp.vic.gov.au"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Full Planning Scheme
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
              <Alert variant="success" className="mt-4">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Success!</AlertTitle>
                <AlertDescription>
                  Zoning information has been saved to your project.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PropertyZoning;
