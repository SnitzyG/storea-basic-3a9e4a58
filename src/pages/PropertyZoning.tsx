import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function PropertyZoning() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  // 🔍 Step 1: Get lat/lon from address
  const geocodeAddress = async (addr: string) => {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        addr + ", Victoria, Australia"
      )}`
    );
    const data = await res.json();
    if (!data.length) throw new Error("Address not found");
    return { lat: data[0].lat, lon: data[0].lon };
  };

  // 🗺 Step 2: Query Vicmap Planning for zones/overlays
  const queryVicmap = async (lat: string, lon: string) => {
    const base =
      "https://services.arcgis.com/P744lA0wf4LlBZ84/arcgis/rest/services";
    const zoneUrl = `${base}/Vicmap_Planning/FeatureServer/3/query?geometry=${lon},${lat}&geometryType=esriGeometryPoint&inSR=4326&outFields=*&f=json`;
    const overlayUrl = `${base}/Planning/Vicplan_PlanningSchemeOverlays/MapServer/2/query?geometry=${lon},${lat}&geometryType=esriGeometryPoint&inSR=4326&outFields=*&f=json`;

    const [zonesRes, overlaysRes] = await Promise.all([
      fetch(zoneUrl),
      fetch(overlayUrl),
    ]);

    const zones = await zonesRes.json();
    const overlays = await overlaysRes.json();

    return {
      zones: zones.features || [],
      overlays: overlays.features || [],
    };
  };

  // 📄 Step 3: Generate PDF
  const generatePDF = (addr: string, data: any) => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    doc.setFontSize(18);
    doc.text("Planning Property Report", 14, 20);

    doc.setFontSize(12);
    doc.text(`Property Address: ${addr}`, 14, 35);
    doc.text("Data Source: Vicmap Planning (data.vic.gov.au)", 14, 45);

    // Zones
    const zoneRows =
      data.zones.length > 0
        ? data.zones.map((z: any) => [
            z.attributes.ZONE_CODE || "—",
            z.attributes.ZONE_DESC || "—",
          ])
        : [["—", "No zone data found"]];

    autoTable(doc, {
      startY: 55,
      head: [["Zone Code", "Zone Description"]],
      body: zoneRows,
    });

    // Overlays
    const overlayRows =
      data.overlays.length > 0
        ? data.overlays.map((o: any) => [
            o.attributes.OVERLAY_CODE || "—",
            o.attributes.OVERLAY_DESC || "—",
          ])
        : [["—", "No overlay data found"]];

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [["Overlay Code", "Overlay Description"]],
      body: overlayRows,
    });

    doc.text(
      "Generated automatically by PropertyZoning Demo",
      14,
      doc.lastAutoTable.finalY + 20
    );

    doc.save(`Planning-Property-Report-${addr}.pdf`);
  };

  // 🚀 Step 4: Orchestrate everything
  const handleGenerate = async () => {
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const { lat, lon } = await geocodeAddress(address);
      const data = await queryVicmap(lat, lon);
      setResult(data);
      generatePDF(address, data);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Property Zoning Report</h1>
      <p className="text-gray-600">
        Enter a property address in Victoria to generate a VicPlan-style
        Planning Report PDF with live data.
      </p>

      <div className="flex gap-3">
        <Input
          placeholder="e.g. 53 New Street, Armadale"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <Button onClick={handleGenerate} disabled={loading || !address}>
          {loading ? "Generating..." : "Generate Report"}
        </Button>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      {result && (
        <div className="mt-6 space-y-4">
          <h2 className="text-xl font-semibold">Preview</h2>

          <div>
            <h3 className="font-medium">Zones</h3>
            <ul className="list-disc ml-6">
              {result.zones.map((z: any, i: number) => (
                <li key={i}>
                  {z.attributes.ZONE_CODE} — {z.attributes.ZONE_DESC}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-medium">Overlays</h3>
            <ul className="list-disc ml-6">
              {result.overlays.map((o: any, i: number) => (
                <li key={i}>
                  {o.attributes.OVERLAY_CODE} — {o.attributes.OVERLAY_DESC}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
