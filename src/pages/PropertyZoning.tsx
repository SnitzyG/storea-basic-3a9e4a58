// src/pages/PropertyZoning.tsx
import React, { useState } from "react";

export default function PropertyZoning() {
  const [streetNumber, setStreetNumber] = useState("");
  const [streetName, setStreetName] = useState("");
  const [suburb, setSuburb] = useState("");
  const [postcode, setPostcode] = useState("");

  // Open VicPlan map with pre-filled search
  const openVicPlanMap = () => {
    if (!streetNumber || !streetName || !suburb || !postcode) {
      alert("Please complete all address fields.");
      return;
    }

    const fullAddress = `${streetNumber} ${streetName}, ${suburb} VIC ${postcode}`;
    const vicPlanUrl = `https://mapshare.vic.gov.au/vicplan/?search=${encodeURIComponent(fullAddress)}`;

    // Open the map in a new tab
    window.open(vicPlanUrl, "_blank");
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Property Zoning Lookup</h1>

      <div className="space-y-3">
        <input
          type="text"
          placeholder="Street Number (e.g. 53)"
          value={streetNumber}
          onChange={(e) => setStreetNumber(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Street Name (e.g. New Street)"
          value={streetName}
          onChange={(e) => setStreetName(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Suburb (e.g. Armadale)"
          value={suburb}
          onChange={(e) => setSuburb(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Postcode (e.g. 3143)"
          value={postcode}
          onChange={(e) => setPostcode(e.target.value)}
          className="w-full border p-2 rounded"
        />
      </div>

      <div className="mt-6">
        <button
          onClick={openVicPlanMap}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          🔍 Open VicPlan Map
        </button>
      </div>

      <p className="mt-4 text-sm text-gray-600">
        Clicking the button opens VicPlan with your address pre-filled. From there, click "Planning Property Report" to generate the official PDF.
      </p>
    </div>
  );
}
