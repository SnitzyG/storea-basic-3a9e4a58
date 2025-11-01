// src/pages/PropertyZoning.tsx
import React from "react";

// Example property dataset
const property = {
  streetNumber: "53",
  streetName: "New Street",
  suburb: "Armadale",
  postcode: "3143",
};

export default function PropertyZoning() {
  // State pre-filled from property dataset
  const [streetNumber] = React.useState(property.streetNumber);
  const [streetName] = React.useState(property.streetName);
  const [suburb] = React.useState(property.suburb);
  const [postcode] = React.useState(property.postcode);

  // Open VicPlan map with pre-filled search
  const openVicPlanMap = () => {
    const fullAddress = `${streetNumber} ${streetName}, ${suburb} VIC ${postcode}`;
    const vicPlanUrl = `https://mapshare.vic.gov.au/vicplan/?search=${encodeURIComponent(fullAddress)}`;
    window.open(vicPlanUrl, "_blank");
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Property Zoning Lookup</h1>

      <div className="space-y-2">
        <p>
          <strong>Street:</strong> {streetNumber} {streetName}
        </p>
        <p>
          <strong>Suburb:</strong> {suburb}
        </p>
        <p>
          <strong>Postcode:</strong> {postcode}
        </p>
      </div>

      <div className="mt-6">
        <button
          onClick={openVicPlanMap}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          🔍 Open Planning Report in VicPlan
        </button>
      </div>

      <p className="mt-4 text-sm text-gray-600">
        Clicking the button opens VicPlan with the property pre-filled. From there, click "Planning Property Report" to generate the official PDF.
      </p>
    </div>
  );
}
