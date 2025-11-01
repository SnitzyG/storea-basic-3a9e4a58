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
import { MapPin, Shield, FileText, CheckCircle2, Loader2 } from "lucide-react";

interface PropertyData {
  address: string;
  zone: string;
  overlays: string[];
  lga: string;
}

const PropertyZoning = () => {
  const { user } = useAuth();
  const [address, setAddress] = useState("");
  const [projectId, setProjectId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PropertyData | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  // Simple coordinate conversion approximation for Victoria
  // This converts WGS84 (4326) to GDA94 (4283)
  const convertToGDA94 = (lat: number, lon: number) => {
    // Simplified transformation - good enough for Victoria
    // More accurate: use proj4js library, but this works for most cases
    return {
      lat: lat - 0.00051,
      lon: lon + 0.00314,
    };
  };

  const searchProperty = async () => {
    if (!address.trim()) {
      toast.error("Error", { description: "Please enter a property address" });
      return;
    }

    setIsLoading(true);

    try {
      toast.loading("Searching for property...");

      // Step 1: Geocode the address
      const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=au&limit=1`;
      
      const geoResponse = await fetch(geoUrl);
      const geoData = await geoResponse.json();

      if (!geoData || geoData.length === 0) {
        throw new Error("Address not found");
      }

      const location = geoData[0];
      let lat = parseFloat(location.lat);
      let lon = parseFloat(location.lon);

      console.log("Original coordinates (WGS84):", { lat, lon });

      // Convert to GDA94 (4283) which is what the mapserver uses
      const converted = convertToGDA94(lat, lon);
      lat = converted.lat;
      lon = converted.lon;

      console.log("Converted coordinates (GDA94):", { lat, lon });

      toast.loading("Retrieving planning zone...");

      // Step 2: Query Vicplan using the IDENTIFY endpoint with proper WKID
      const mapServerUrl = `https://plan-gis.mapshare.vic.gov.au/arcgis/rest/services/Planning/Vicplan_PlanningSchemeZones/MapServer/identify`;

      const identifyParams = new URLSearchParams({
        geometry: JSON.stringify({
          x: lon,
          y: lat,
          spatialReference: { wkid: 4283 }, // GDA94
        }),
        geometryType: "esriGeometryPoint",
        layers: "all",
        tolerance: "50",
        mapExtent: `${lon - 1},${lat - 1},${lon + 1},${lat + 1}`,
        imageDisplay: "400,300,96",
        returnGeometry: "false",
        f: "json",
      });

      console.log("Querying MapServer with params:", identifyParams.toString());

      const mapResponse = await fetch(`${mapServerUrl}?${identifyParams.toString()}`);
      const mapData = await mapResponse.json();

      console.log("MapServer response:", mapData);

      if (!mapData.results || mapData.results.length === 0) {
        throw new Error("No planning zone found for this location");
      }

      // Extract zone information
      let zone = "";
      let lga = "";

      for (const result of mapData.results) {
        const attrs = result.attributes || {};
        console.log("Result attributes:", attrs);

        if (attrs.ZONE_NAME) {
          zone = attrs.ZONE_NAME;
          lga = attrs.LGA_NAME || "";
          break;
        }
      }

      if (!zone) {
        throw new Error("Could not extract zone information from results");
      }

      toast.loading("Retrieving overlays...");

      // Step 3: Get overlays
      const overlayUrl = `https://plan-gis.mapshare.vic.gov.au/arcgis/rest/services/Planning/Vicplan_PlanningSchemeOverlays/MapServer/identify`;

      const overlayParams = new URLSearchParams({
        geometry: JSON.stringify({
          x: lon,
          y: lat,
          spatialReference: { wkid: 4283 }, // GDA94
        }),
        geometryType: "esriGeometryPoint",
        layers: "all",
        tolerance: "50",
        mapExtent: `${lon - 1},${lat - 1},${lon + 1},${lat + 1}`,
        imageDisplay: "400,300,96",
        returnGeometry: "false",
        f: "json",
      });

      const overlayResponse = await fetch(`${overlayUrl}?${overlayParams.toString()}`);
      const overlayData = await overlayResponse.json();

      console.log("Overlay response:", overlayData);

      let overlays: string[] = [];
      if (overlayData.results && overlayData.results.length > 0) {
        overlays = [
          ...new Set(
            overlayData.results
              .map((r: any) => r.attributes?.OVERLAY_NAME || r.attributes?.NAME)
              .filter((name: any) => name && typeof name === "string")
          ),
        ] as string[];
      }

      const propertyData: PropertyData = {
        address: location.display_name || address,
        zone,
        overlays,
        lga: lga || "Unknown",
      };

      setResult(propertyData);
      toast.success("Property information found!", {
        description: `Zone: ${zone}`,
      });
    } catch (err) {
      console.error("Search error:", err);
      const errorMessage = err instanceof Error ? err.message : "Search failed";
      toast.error("Search failed", { description: errorMessage });
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
        lga_name: result.lga,
        full_response: result,
        api_called_at: new Date().toISOString(),
      });

      if (saveError) throw saveError;

      setIsSaved(true);
      toast.success("✓ Saved!", {
        description: "Property information saved to project.",
      });
    } catch (err) {
      console.error("Error saving:", err);
      toast.error("Failed to save");
    }
  };

  const handleNewSearch = () => {
    setAddress("");
    setProjectId("");
    setResult(null);
    setIsSaved(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Property Zoning Search</h1>
        <p className="text-muted-foreground">Enter address to get zone information</p>
      </div>

      {result ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Property Information
            </CardTitle>
            <CardDescription>{result.address}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-primary/10 p-4 rounded-lg border-2 border-primary">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="font-medium">Planning Zone:</span>
              </div>
              <p className="text-3xl font-bold text-primary">{result.zone}</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5" />
                <span className="font-medium">Local Government Area:</span>
              </div>
              <p className="text-lg font-semibold">{result.lga}</p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-5 w-5" />
                <span className="font-medium">Planning Overlays:</span>
              </div>
              {result.overlays && result.overlays.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {result.overlays.map((overlay, index) => (
                    <Badge key={index} variant="secondary" className="text-sm py-2 px-3">
                      {overlay}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No overlays</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectId">Project ID (Optional)</Label>
              <Input
                id="projectId"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="e.g., Project 001"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              <Button
                onClick={handleSaveToProject}
                disabled={isSaved}
                className="flex-1"
                size="lg"
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
                size="lg"
              >
                Search Another
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search Property</CardTitle>
            <CardDescription>Enter your property address</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g., 384 Barkly Street, Elwood VIC 3184"
                disabled={isLoading}
                onKeyDown={(e) => e.key === "Enter" && searchProperty()}
              />
            </div>

            <Button
              onClick={searchProperty}
              disabled={!address.trim() || isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                "Search"
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PropertyZoning;
