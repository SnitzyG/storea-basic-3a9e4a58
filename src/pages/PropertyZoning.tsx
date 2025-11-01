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
import { MapPin, Shield, FileText, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

interface PropertyData {
  address: string;
  zone: string;
  overlays: string[];
  lga: string;
  latitude?: number;
  longitude?: number;
}

const PropertyZoning = () => {
  const { user } = useAuth();
  const [address, setAddress] = useState("");
  const [projectId, setProjectId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PropertyData | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const searchProperty = async () => {
    if (!address.trim()) {
      toast.error("Error", { description: "Please enter a property address" });
      return;
    }

    setIsLoading(true);

    try {
      toast.loading("Locating property...");

      // Step 1: Geocode using OpenStreetMap (free, no API key needed)
      const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&countrycodes=au&limit=1`;
      
      const geoResponse = await fetch(geoUrl);
      const geoData = await geoResponse.json();

      if (!geoData || geoData.length === 0) {
        throw new Error("Address not found. Try: '123 Street Name, Suburb VIC 3000'");
      }

      const location = geoData[0];
      const lat = parseFloat(location.lat);
      const lon = parseFloat(location.lon);

      console.log("Found coordinates:", { lat, lon, address: location.display_name });

      toast.loading("Retrieving planning zone...");

      // Step 2: Query the Vicplan MapServer using DIRECT coordinates
      // The key is to use the correct service URL and parameters
      const mapServerUrl = `https://plan-gis.mapshare.vic.gov.au/arcgis/rest/services/Planning/Vicplan_PlanningSchemeZones/MapServer/0/query`;

      const params = new URLSearchParams({
        geometry: JSON.stringify({ x: lon, y: lat, spatialReference: { wkid: 4326 } }),
        geometryType: "esriGeometryPoint",
        inSR: "4326",
        outSR: "4326",
        returnGeometry: "false",
        returnCentroid: "false",
        outFields: "*",
        f: "json",
      });

      const mapResponse = await fetch(`${mapServerUrl}?${params.toString()}`);
      const mapData = await mapResponse.json();

      console.log("MapServer response:", mapData);

      if (!mapData.features || mapData.features.length === 0) {
        // If no results, try alternative layer
        console.log("No results from layer 0, trying alternate approach...");
        
        // Use identify endpoint instead
        const identifyUrl = `https://plan-gis.mapshare.vic.gov.au/arcgis/rest/services/Planning/Vicplan_PlanningSchemeZones/MapServer/identify`;
        const identifyParams = new URLSearchParams({
          geometry: JSON.stringify({ x: lon, y: lat }),
          geometryType: "esriGeometryPoint",
          layers: "all",
          tolerance: "10",
          mapExtent: `${lon-0.1},${lat-0.1},${lon+0.1},${lat+0.1}`,
          imageDisplay: "400,300,96",
          returnGeometry: "false",
          f: "json",
        });

        const identifyResponse = await fetch(`${identifyUrl}?${identifyParams.toString()}`);
        const identifyData = await identifyResponse.json();

        console.log("Identify response:", identifyData);

        if (!identifyData.results || identifyData.results.length === 0) {
          throw new Error("No planning zone found for this location. Please try a different address.");
        }

        // Process identify results
        let zone = "";
        let lga = "";
        
        for (const result of identifyData.results) {
          const attrs = result.attributes || {};
          if (attrs.ZONE_NAME) {
            zone = attrs.ZONE_NAME;
            lga = attrs.LGA_NAME || "";
            break;
          }
        }

        if (!zone) {
          throw new Error("Could not determine planning zone. Try entering the full address with postcode.");
        }

        // Get overlays
        toast.loading("Retrieving overlays...");
        
        const overlayUrl = `https://plan-gis.mapshare.vic.gov.au/arcgis/rest/services/Planning/Vicplan_PlanningSchemeOverlays/MapServer/identify`;
        const overlayParams = new URLSearchParams({
          geometry: JSON.stringify({ x: lon, y: lat }),
          geometryType: "esriGeometryPoint",
          layers: "all",
          tolerance: "10",
          mapExtent: `${lon-0.1},${lat-0.1},${lon+0.1},${lat+0.1}`,
          imageDisplay: "400,300,96",
          returnGeometry: "false",
          f: "json",
        });

        const overlayResponse = await fetch(`${overlayUrl}?${overlayParams.toString()}`);
        const overlayData = await overlayResponse.json();

        let overlays: string[] = [];
        if (overlayData.results && overlayData.results.length > 0) {
          overlays = [
            ...new Set(
              overlayData.results
                .map((r: any) => r.attributes?.OVERLAY_NAME || r.attributes?.OVERLAY_TYPE)
                .filter((name: any) => name && typeof name === "string")
            ),
          ] as string[];
        }

        const propertyData: PropertyData = {
          address: location.display_name || address,
          zone,
          overlays,
          lga: lga || "Unknown",
          latitude: lat,
          longitude: lon,
        };

        setResult(propertyData);
        toast.success("Property information found!", {
          description: `${zone}${overlays.length > 0 ? ` + ${overlays.length} overlay(s)` : ""}`,
        });
        return;
      }

      // Process query results
      const feature = mapData.features[0];
      const attrs = feature.attributes || {};

      let zone = attrs.ZONE_NAME || attrs.NAME || "Unknown";
      let lga = attrs.LGA_NAME || attrs.LGA || "Unknown";

      // Get overlays
      toast.loading("Retrieving overlays...");

      const overlayUrl = `https://plan-gis.mapshare.vic.gov.au/arcgis/rest/services/Planning/Vicplan_PlanningSchemeOverlays/MapServer/0/query`;
      const overlayParams = new URLSearchParams({
        geometry: JSON.stringify({ x: lon, y: lat, spatialReference: { wkid: 4326 } }),
        geometryType: "esriGeometryPoint",
        inSR: "4326",
        outSR: "4326",
        returnGeometry: "false",
        outFields: "*",
        f: "json",
      });

      const overlayResponse = await fetch(`${overlayUrl}?${overlayParams.toString()}`);
      const overlayData = await overlayResponse.json();

      let overlays: string[] = [];
      if (overlayData.features && overlayData.features.length > 0) {
        overlays = [
          ...new Set(
            overlayData.features
              .map((f: any) => f.attributes?.OVERLAY_NAME || f.attributes?.NAME)
              .filter((name: any) => name && typeof name === "string")
          ),
        ] as string[];
      }

      const propertyData: PropertyData = {
        address: location.display_name || address,
        zone,
        overlays,
        lga,
        latitude: lat,
        longitude: lon,
      };

      setResult(propertyData);
      toast.success("Property information found!", {
        description: `${zone}${overlays.length > 0 ? ` + ${overlays.length} overlay(s)` : ""}`,
      });
    } catch (err) {
      console.error("Search error:", err);
      const errorMessage = err instanceof Error ? err.message : "Could not retrieve property information";
      toast.error("Search failed", { description: errorMessage });
      setResult(null);
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
        zone_code: "",
        overlays: result.overlays,
        lga_name: result.lga,
        latitude: result.latitude,
        longitude: result.longitude,
        full_response: result,
        api_called_at: new Date().toISOString(),
      });

      if (saveError) throw saveError;

      setIsSaved(true);
      toast.success("✓ Property information saved!", {
        description: "Ready to continue with next stage.",
      });
    } catch (err) {
      console.error("Error saving:", err);
      toast.error("Failed to save", {
        description: "Could not save property information.",
      });
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
        <h1 className="text-3xl font-bold mb-2">Property Information Search</h1>
        <p className="text-muted-foreground">
          Get all property details in one click
        </p>
      </div>

      {result ? (
        // Results view
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Property Information
            </CardTitle>
            <CardDescription className="text-base">
              {result.address}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Zone */}
            <div className="bg-primary/10 p-4 rounded-lg border-2 border-primary">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="font-medium">Planning Zone:</span>
              </div>
              <p className="text-3xl font-bold text-primary">{result.zone}</p>
            </div>

            {/* LGA */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5" />
                <span className="font-medium">Local Government Area:</span>
              </div>
              <p className="text-lg font-semibold">{result.lga}</p>
            </div>

            {/* Coordinates */}
            {result.latitude && result.longitude && (
              <div className="bg-gray-50 p-4 rounded-lg text-sm">
                <p className="text-muted-foreground">
                  <strong>Coordinates:</strong> {result.latitude.toFixed(6)}, {result.longitude.toFixed(6)}
                </p>
              </div>
            )}

            {/* Overlays */}
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
                <p className="text-muted-foreground text-sm">No overlays apply to this property</p>
              )}
            </div>

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
                size="lg"
              >
                {isSaved ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Saved to Project
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
                size="lg"
              >
                Search Another Property
              </Button>
            </div>

            {isSaved && (
              <Alert className="mt-4 bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-900">Success!</AlertTitle>
                <AlertDescription className="text-green-800">
                  Property information has been saved to your project.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      ) : (
        // Search view
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search Property Address</CardTitle>
            <CardDescription>
              Enter your property address to get planning zone and overlays
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Tips for best results</AlertTitle>
              <AlertDescription>
                Include street number, street name, suburb and postcode. Example: "123 Main Street, Elwood VIC 3184"
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="address">Property Address *</Label>
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
                <>
                  <MapPin className="mr-2 h-4 w-4" />
                  Search Property
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base">About This Search</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>This tool retrieves:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Planning Zone from Vicmap</li>
            <li>All Planning Overlays</li>
            <li>Local Government Area</li>
            <li>Precise coordinates</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default PropertyZoning;
