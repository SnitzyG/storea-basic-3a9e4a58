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
  const [locationFound, setLocationFound] = useState(false);

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

  const geocodeAddress = async (addressText: string): Promise<{ lat: number; lon: number } | null> => {
    try {
      const encodedAddress = encodeURIComponent(addressText.trim());
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1&countrycodes=au`
      );

      if (!response.ok) {
        throw new Error("Geocoding failed");
      }

      const data = await response.json();

      if (!data || data.length === 0) {
        throw new Error("Address not found");
      }

      return {
        lat: parseFloat(data[0].lat.toString()),
        lon: parseFloat(data[0].lon.toString()),
      };
    } catch (err) {
      console.error("Geocoding error:", err);
      return null;
    }
  };

  const getVicmapZoning = async (latitude: number, longitude: number): Promise<{ zone: string; zoneCode: string; overlays: string[]; lga: string } | null> => {
    try {
      const geometry = JSON.stringify({
        x: longitude,
        y: latitude,
      });

      const params = new URLSearchParams({
        geometry,
        geometryType: "esriGeometryPoint",
        layers: "0",
        tolerance: "100",
        imageDisplay: "400,300,96",
        returnGeometry: "false",
        f: "json",
      });

      // Query zones
      const zonesUrl = `https://plan-gis.mapshare.vic.gov.au/arcgis/rest/services/Planning/Vicplan_PlanningSchemeZones/MapServer/identify?${params.toString()}`;
      
      const zonesResponse = await fetch(zonesUrl);
      const zonesData = await zonesResponse.json();

      let zone = "";
      let zoneCode = "";
      let lga = "";

      if (zonesData.results && zonesData.results.length > 0) {
        const attrs = zonesData.results[0].attributes;
        zone = attrs.ZONE_NAME || "";
        zoneCode = attrs.ZONE_CODE || "";
        lga = attrs.LGA_NAME || "";
      }

      // Query overlays
      const overlaysUrl = `https://plan-gis.mapshare.vic.gov.au/arcgis/rest/services/Planning/Vicplan_PlanningSchemeOverlays/MapServer/identify?${params.toString()}`;
      
      const overlaysResponse = await fetch(overlaysUrl);
      const overlaysData = await overlaysResponse.json();

      const overlays: string[] = [];
      if (overlaysData.results && overlaysData.results.length > 0) {
        for (const result of overlaysData.results) {
          const overlayName = result.attributes.OVERLAY_NAME || result.attributes.NAME;
          if (overlayName && !overlays.includes(overlayName.toString())) {
            overlays.push(overlayName.toString());
          }
        }
      }

      if (!zone) {
        return null;
      }

      return { zone, zoneCode, overlays, lga };
    } catch (err) {
      console.error("Vicmap API error:", err);
      return null;
    }
  };

  const searchAddress = async () => {
    if (!address.trim()) {
      toast.error("Error", { description: "Please enter a property address" });
      return;
    }

    setIsLoading(true);

    try {
      toast.loading("Locating address...");

      // Step 1: Geocode address
      const coords = await geocodeAddress(address);

      if (!coords) {
        throw new Error("Could not find address. Please check the spelling and ensure it includes suburb and postcode.");
      }

      toast.loading("Retrieving planning zone...");

      // Step 2: Get planning zone from Vicmap
      const vicmapData = await getVicmapZoning(coords.lat, coords.lon);

      if (!vicmapData) {
        throw new Error("Could not retrieve planning zone. The location may be outside mapped areas or the service may be temporarily unavailable.");
      }

      // Auto-fill the form
      setZone(vicmapData.zone);
      setZoneCode(vicmapData.zoneCode);
      setOverlays(vicmapData.overlays);
      setLgaName(vicmapData.lga);
      setLocationFound(true);

      toast.success("Planning zone found!", {
        description: `Zone: ${vicmapData.zone}${vicmapData.overlays.length > 0 ? ` + ${vicmapData.overlays.length} overlay(s)` : ""}`,
      });
    } catch (err) {
      console.error("Search error:", err);
      const errorMessage = err instanceof Error ? err.message : "Search failed";
      toast.error("Could not retrieve zone", { description: errorMessage });
      setLocationFound(false);
    } finally {
      setIsLoading(false);
    }
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
    setLocationFound(false);
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
          Find your property's planning zone and overlays automatically
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
                Always verify this information with your local council before submitting a planning application.
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
          {/* Search Card */}
          <Card>
            <CardHeader>
              <CardTitle>Search Property Address</CardTitle>
              <CardDescription>
                Enter your property address to automatically retrieve planning zone information
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
                  onKeyDown={(e) => e.key === "Enter" && searchAddress()}
                />
                <p className="text-sm text-muted-foreground">
                  Enter your full address with suburb and postcode
                </p>
              </div>

              <Button
                onClick={searchAddress}
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
                    Search & Auto-Fill
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Zone Details Card */}
          {locationFound && (
            <Card>
              <CardHeader>
                <CardTitle>Zone Information Found</CardTitle>
                <CardDescription>
                  Review and edit the automatically retrieved information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-900">Zone Retrieved!</AlertTitle>
                  <AlertDescription className="text-green-800 mt-2">
                    <p><strong>Zone:</strong> {zone}</p>
                    {zoneCode && <p><strong>Zone Code:</strong> {zoneCode}</p>}
                    {lgaName && <p><strong>LGA:</strong> {lgaName}</p>}
                    {overlays.length > 0 && <p><strong>Overlays:</strong> {overlays.join(", ")}</p>}
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
          )}
        </div>
      )}

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200 mt-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            How This Works
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <ol className="list-decimal list-inside space-y-1">
            <li>Enter your property address</li>
            <li>System automatically locates your address</li>
            <li>System queries Vicmap Planning to get your zone and overlays</li>
            <li>Zone information is auto-filled in the form</li>
            <li>Review and edit if needed</li>
            <li>Save to your project</li>
          </ol>
          <p className="text-xs mt-4">
            <strong>Data source:</strong> Vicmap Planning (mapshare.vic.gov.au)
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PropertyZoning;
