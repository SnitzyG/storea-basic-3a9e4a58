import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';
import { geocodeAddress } from '@/utils/geocoding';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface TenderLocationMapProps {
  address: string;
  tenderTitle: string;
}

export const TenderLocationMap: React.FC<TenderLocationMapProps> = ({ address, tenderTitle }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current || !address) return;

    const initializeMap = async () => {
      try {
        setLoading(true);
        setError(null);

        // Geocode the address
        const coords = await geocodeAddress(address);
        
        if (!coords) {
          setError('Unable to locate address on map');
          setLoading(false);
          return;
        }

        // Initialize map if not already initialized
        if (!map.current) {
          map.current = L.map(mapContainer.current, {
            center: [coords.lat, coords.lng],
            zoom: 15,
            scrollWheelZoom: false,
            dragging: true,
            touchZoom: true,
            doubleClickZoom: true,
            attributionControl: false,
          });

          // Add OpenStreetMap tiles
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '',
            maxZoom: 19,
          }).addTo(map.current);
        } else {
          // Update map center if already initialized
          map.current.setView([coords.lat, coords.lng], 15);
        }

        // Add marker
        const marker = L.marker([coords.lat, coords.lng]).addTo(map.current);
        
        // Custom popup content
        const popupContent = `
          <div class="p-2">
            <h3 class="font-semibold text-sm mb-1">${tenderTitle}</h3>
            <p class="text-xs text-muted-foreground">${address}</p>
          </div>
        `;
        
        marker.bindPopup(popupContent).openPopup();

        setLoading(false);
      } catch (err) {
        console.error('Error initializing map:', err);
        setError('Failed to load map');
        setLoading(false);
      }
    };

    initializeMap();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [address, tenderTitle]);

  if (!address) {
    return (
      <div className="h-[200px] rounded-lg border bg-muted/50 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">No project address available</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[200px] rounded-lg border bg-muted/50 flex flex-col items-center justify-center gap-2">
        <MapPin className="h-6 w-6 text-muted-foreground" />
        <p className="text-xs text-muted-foreground text-center px-4">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative h-[200px] rounded-lg overflow-hidden border">
      {loading && (
        <div className="absolute inset-0 bg-muted/50 flex items-center justify-center z-10">
          <p className="text-xs text-muted-foreground">Loading map...</p>
        </div>
      )}
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
};
