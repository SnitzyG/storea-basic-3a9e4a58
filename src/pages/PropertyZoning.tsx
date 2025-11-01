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

interface GeocodingResult {
  lat: number;
  lon: number;
  display_name: string;
}

interface VicmapAttribute {
  [key: string]: string | number;
}

interface VicmapResult {
  layerId: number;
  layerName: string;
  attributes: VicmapAttribute;
}

interface VicmapResponse {
  results: VicmapResult[];
}

interface ZoningData {
  address: string;
  latitude: number;
  longitude: number;
  zone: string;
  zoneCode: string;
  overlays: string[];
  lgaName: string;
  rawResponse: VicmapResponse;
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

  const geocodeAddress = async (addressText: string): Promise<{ lat: number; lon: number } | null> => {
    try {
      const encodedAddress = encodeURIComponent(addressText.trim());
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1&countrycodes=au`
      );

      if (!response.ok) {
        throw new Error("Geocoding failed");
      }

      const data: GeocodingResult[] = await response.json();

      if (!data || data.length === 0) {
        throw new Error("Address not found in geocoding service");
      }

      return {
        lat: parseFloat(data[0].lat.toString()),
        lon: parseFloat(data[0].lon.toString()),
      };
    } catch (err) {
      console.error("Geocoding error:", err);
      throw new Error("Could not locate address. Please check spelling and format.");
    }
  };

  const getVicmapZoning = async (latitude: number, longitude: number): Promise<ZoningData | null> => {
    try {
      const geometry = JSON.stringify({
        x: longitude,
        y: latitude,
      });

      const params = new URLSearchParams({
        geometry,
        geometryType: "esriGeometryPoint",
        layers: "1,2",
        tolerance: "1",
        imageDisplay: "400,300,96",
        returnGeometry: "true",
        f: "json",
      });

      const url = `https://plan-gis.mapshare.vic.gov.au/arcgis/rest/services/Planning/Vicplan_PlanningSchemeZones/MapServer/identify?${params.toString()}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Vicmap API error: ${response.statusText}`);
      }

      const data: VicmapResponse = await response.json();

      if (!data.results || data.results.length === 0) {
        throw new Error("No planning information found for this location");
      }

      let zone = "";
      let zoneCode = "";
      let lgaName = "";
      const overlays: string[] = [];

      // Process results
      for (const result of data.results) {
        if (result.layerId === 1 || result.layerName.includes("Zone")) {
          // This is a zone layer
          const attrs = result.attributes;
          zone = attrs.ZONE_NAME ? attrs.ZONE_NAME.toString() : zone;
          zoneCode = attrs.ZONE_CODE ? attrs.ZONE_CODE.toString() : zoneCode;
          lgaName = attrs.LGA_NAME ? attrs.LGA_NAME.toString() : lgaName;
        } else if (result.layerId === 2 || result.layerName.includes("Overlay")) {
          // This is an overlay layer
          const overlayName = result.attributes.OVERLAY_NAME || result.attributes.OVERLAY_TYPE;
          if (overlayName) {
            overlays.push(overlayName.toString());
          }
        }
      }

      if (!zone) {
        throw new Error("Could not determine planning zone for this location");
      }

      return {
        address: address.trim(),
        latitude,
        longitude,
        zone,
        zoneCode,
        overlays: [...new Set(overlays)], // Remove duplicates
        lgaName,
        rawResponse: data,
      };
    } catch (err) {
      console.error("Vicmap API error:", err);
      throw err;
    }
  };

  const handleSearch = async () => {
    setError(null);
    setResult(null);
    setIsSaved(false);

    if (!validateAddress()) return;

    setIsLoading(true);

    try {
      // Step 1: Geocode the address
      toast.loading("Locating address...");
      const coords = await geocodeAddress(address);

      if (!coords) {
        throw new Error("Could not find address. Please check spelling and format.");
      }

      // Step 2: Get zoning information from Vicmap
      toast.loading("Retrieving zoning information...");
      const zoningData = await getVicmapZoning(coords.lat, coords.lon);

      if (!zoningData) {
        throw new Error("No planning information available for this location");
      }

      setResult(zoningData);
      toast.success("Zoning information retrieved successfully!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to retrieve zoning information. Please try again.";
      setError(errorMessage);
      console.error("Search error:", err);
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
        zone_code: result.zoneCode,
        overlays: result.overlays,
        latitude: result.latitude,
        longitude: result.longitude,
        lga_name: result.lgaName,
        full_response: result.rawResponse,
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
    // Extract overlay code from overlay name (e.g., "Heritage Overlay HO123" -> "HO123")
    const overlayCode = overlay.match(/[A-Z]{2,3}\d+/)?.[0] || "";
    return `https://planning-schemes.delwp.vic.gov.au/${overlayCode}`;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Property Zoning Lookup</h1>
        <p className="text-muted-foreground">
          Search Victorian planning zones and overlays for your property using Vicmap Planning data
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
            {result.lgaName && (
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
                <span className="font-medium">Zone:</span>
              </div>
              <p className="text-2xl font-bold text-primary">{result.zone}</p>
              {result.zoneCode && (
                <p className="text-sm text-muted-foreground mt-1">Code: {result.zoneCode}</p>
              )}
            </div>

            {/* Coordinates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Ruler className="h-5 w-5 mt-0.5" />
                <div>
                  <span className="font-medium text-sm">Latitude:</span>
                  <p className="text-sm">{result.latitude.toFixed(6)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Ruler className="h-5 w-5 mt-0.5" />
                <div>
                  <span className="font-medium text-sm">Longitude:</span>
                  <p className="text-sm">{result.longitude.toFixed(6)}</p>
                </div>
              </div>
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
                <p className="text-muted-foreground">No overlays apply to this property</p>
              )}
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
                  View Planning Scheme Details
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
                  Zoning information has been saved to your project. Ready to continue with Stage 2: Permit Requirements.
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
            About This Search
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            This tool uses <strong>Vicmap Planning</strong> data from the Victorian Government to retrieve accurate zoning and overlay information.
          </p>
          <p>
            Address lookup is performed using <strong>OpenStreetMap Nominatim</strong> geocoding service.
          </p>
          <p>
            Data is current as of the last Vicmap update. For official queries, contact your local council planning department.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PropertyZoning;
