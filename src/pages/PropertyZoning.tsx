// src/pages/PropertyZoning.tsx
import React from "react";

// Example property list
const properties = [
  { id: 1, streetNumber: "53", streetName: "New Street", suburb: "Armadale", postcode: "3143" },
  { id: 2, streetNumber: "22", streetName: "Pardoner Road", suburb: "Rye", postcode: "3941" },
  { id: 3, streetNumber: "17", streetName: "Porter Avenue", suburb: "Highton", postcode: "3216" },
];

export default function PropertyZoning() {
  // Open VicPlan map for a single property
  const openVicPlanMap = (property: typeof properties[0]) => {
    const { streetNumber, streetName, suburb, postcode } = property;
    const fullAddress = `${streetNumber} ${streetName}, ${suburb} VIC ${postcode}`;
    const vicPlanUrl = `https://mapshare.vic.gov.au/vicplan/?search=${encodeURIComponent(fullAddress)}`;
    window.open(vicPlanUrl, "_blank");
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Property Zoning Lookup</h1>

      <div className="space-y-4">
        {properties.map((property) => (
          <div
            key={property.id}
            className="border p-4 rounded flex flex-col sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="mb-2 sm:mb-0">
              <p>
                <strong>Address:</strong> {property.streetNumber} {property.streetName}, {property.suburb} VIC {property.postcode}
              </p>
            </div>

            <button
              onClick={() => openVicPlanMap(property)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              🔍 Open in VicPlan
            </button>
          </div>
        ))}
      </div>

      <p className="mt-6 text-sm text-gray-600">
        Clicking a button opens VicPlan with the property pre-filled. From there, click "Planning Property Report" to generate the official PDF.
      </p>
    </div>
  );
}

