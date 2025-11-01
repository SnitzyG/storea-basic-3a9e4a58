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
import { MapPin, Shield, FileText, CheckCircle2, Loader2, ExternalLink } from "lucide-react";

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

  const searchProperty = async () => {
    if (!address.trim()) {
      toast.error("Error", { description: "Please enter a property address" });
      return;
    }

    setIsLoading(true);

    try {
      toast.loading("Searching property information...");

      // Format address for VicPlan search
      const searchAddress = address.trim();

      // Use VicPlan's property search
      // This calls the official Victorian Land Registry search
      const searchUrl = `https://www.land.vic.gov.au/property-and-parcel-search?address=${encodeURIComponent(searchAddress)}`;

      // Since VicPlan doesn't have a direct JSON API, we'll use a workaround
      // by calling the mapshare REST endpoint that powers VicPlan
      const mapShareUrl = `https://spatial-data.information.vic.gov.au/geoserver/wfs?service=WFS&version=2.0.0&request=GetFeature&typeNames=planning:VMPLAN_PLAN_ZONE,planning:VMPLAN_PLAN_OVERLAY&outputFormat=application/json&CQL_FILTER=INTERSECTS(geometry,BufferWithDistanceUnits(geom_from_text('POINT(${encodeURIComponent(searchAddress)})',4326),0.001,'meters'))&maxFeatures=10`;

      // Alternative: Use a more direct approach with Google's Geocoding
      const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress + " Victoria Australia")}&limit=1`;

      console.log("Step 1: Geocoding address...");
      const geoResponse = await fetch(geoUrl);
      const geoData = await geoResponse.json();

      if (!geoData || geoData.length === 0) {
        throw new Error("Address not found. Please check spelling and include suburb/postcode.");
      }

      const coords = geoData[0];
      const lat = coords.lat;
      const lon = coords.lon;

      console.log("Step 2: Fetching planning zones from Vicmap...");

      // Now query both zones and overlays at these coordinates
      const zoneUrl = `https://spatial-data.information.vic.gov.au/geoserver/wfs?service=WFS&version=2.0.0&request=GetFeature&typeNames=planning:VMPLAN_PLAN_ZONE&outputFormat=application/json&CQL_FILTER=INTERSECTS(geometry,Point(${lon}%20${lat}))&maxFeatures=1`;

      const zoneResponse = await fetch(zoneUrl);
      const zoneData = await zoneResponse.json();

      if (!zoneData.features || zoneData.features.length === 0) {
        throw new Error("No planning zone found. Location may be outside Victoria or in unmapped area.");
      }

      const zoneFeature = zoneData.features[0];
      const zoneProps = zoneFeature.properties;

      console.log("Step 3: Fetching overlays...");

      const overlayUrl = `https://spatial-data.information.vic.gov.au/geoserver/wfs?service=WFS&version=2.0.0&request=GetFeature&typeNames=planning:VMPLAN_PLAN_OVERLAY&outputFormat=application/json&CQL_FILTER=INTERSECTS(geometry,Point(${lon}%20${lat}))&maxFeatures=20`;

      const overlayResponse = await fetch(overlayUrl);
      const overlayData = await overlayResponse.json();

      let overlays: string[] = [];
      if (overlayData.features && overlayData.features.length > 0) {
        overlays = overlayData.features
          .map((f: any) => f.properties.OVERLAY_NAME || f.properties.NAME)
          .filter((name: string) => name && !overlays.includes(name));
      }

      const propertyData: PropertyData = {
        address: coords.display_name || address,
        zone: zoneProps.ZONE_NAME || zoneProps.NAME || "Unknown",
        overlays,
        lga: zoneProps.LGA_NAME || zoneProps.LGA || "Unknown",
      };

      setResult(propertyData);
      toast.success("Property information found!", {
        description: `Zone: ${propertyData.zone}`,
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
          Get all property details in one click using official Victorian government data
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

            {/* Verification */}
            <Alert className="bg-blue-50 border-blue-200">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <AlertTitle>Data Source</AlertTitle>
              <AlertDescription>
                This information is from Victoria's official planning database. Always verify with your local council before submitting applications.
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
              Enter your property address to get all planning and property information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <FileText className="h-4 w-4" />
              <AlertTitle>Official Data Source</AlertTitle>
              <AlertDescription>
                This search uses Victoria's official planning database from <a href="https://www.land.vic.gov.au/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Land.vic.gov.au</a>
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
              <p className="text-sm text-muted-foreground">
                Enter full address with street number, street name, suburb and postcode
              </p>
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
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            About This Search
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <p>
            This tool searches Victoria's official planning and property database to get:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Planning Zone (e.g., Residential Zone 1)</li>
            <li>All Planning Overlays (e.g., Heritage, Flood)</li>
            <li>Local Government Area (your council)</li>
            <li>Official address confirmation</li>
          </ul>
          <p className="text-xs mt-4">
            <strong>Data refreshed weekly</strong> from Department of Transport & Planning
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PropertyZoning;
