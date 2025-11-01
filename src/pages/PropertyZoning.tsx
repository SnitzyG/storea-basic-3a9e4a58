import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const PropertyZoning = () => {
  const [streetNumber, setStreetNumber] = useState("");
  const [streetName, setStreetName] = useState("");
  const [suburb, setSuburb] = useState("");
  const [postcode, setPostcode] = useState("");

  // Generate Planning Report PDF (opens VicPlan)
  const generatePlanningReport = async (
    streetNumber: string,
    streetName: string,
    suburb: string,
    postcode: string
  ) => {
    try {
      toast.loading("Generating planning report...");

      const fullAddress = `${streetNumber} ${streetName}, ${suburb} VIC ${postcode}`;
      const reportName = `${streetNumber}-${streetName.replace(/\s+/g, '-')}-${suburb}-(ID${Date.now()})-Vicplan-Planning-Property-Report.pdf`;

      toast.success("Planning Report Ready!", {
        description: "Opening VicPlan planning report...",
      });

      // Open VicPlan map for report
      window.open(
        `https://mapshare.vic.gov.au/vicplan/?search=${encodeURIComponent(fullAddress)}`,
        "_blank"
      );
    } catch (err) {
      console.error("Report generation error:", err);
      toast.error("Failed to generate report");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Generate Planning Report</CardTitle>
          <CardDescription>
            Create a planning report from VicPlan for your selected property.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="streetNumber">Street Number *</Label>
              <Input
                id="streetNumber"
                value={streetNumber}
                onChange={(e) => setStreetNumber(e.target.value)}
                placeholder="e.g., 22"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="streetName">Street Name *</Label>
              <Input
                id="streetName"
                value={streetName}
                onChange={(e) => setStreetName(e.target.value)}
                placeholder="e.g., Pardoner Rd"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="suburb">Suburb *</Label>
              <Input
                id="suburb"
                value={suburb}
                onChange={(e) => setSuburb(e.target.value)}
                placeholder="e.g., Rye"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postcode">Postcode *</Label>
              <Input
                id="postcode"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                placeholder="e.g., 3941"
              />
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded text-sm">
            <p className="font-medium">Full Address:</p>
            <p className="text-primary font-semibold">
              {streetNumber && streetName && suburb && postcode
                ? `${streetNumber} ${streetName}, ${suburb} VIC ${postcode}`
                : "Complete all fields to see full address"}
            </p>
          </div>

          <Button
            onClick={() => generatePlanningReport(streetNumber, streetName, suburb, postcode)}
            disabled={!streetNumber || !streetName || !suburb || !postcode}
            className="w-full mt-4"
          >
            📄 Generate Planning Report
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PropertyZoning;
