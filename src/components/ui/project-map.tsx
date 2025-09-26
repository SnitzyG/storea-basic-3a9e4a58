import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdvancedProject } from '@/hooks/useAdvancedProjects';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create custom colored markers for different project statuses
const createStatusIcon = (status: string) => {
  const colors = {
    active: '#10B981', // Green
    planning: '#3B82F6', // Blue  
    on_hold: '#F59E0B', // Orange
    completed: '#6B7280', // Gray
    cancelled: '#EF4444' // Red
  };
  
  const color = colors[status as keyof typeof colors] || colors.active;
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 25px;
        height: 25px;
        border-radius: 50% 50% 50% 0;
        border: 3px solid white;
        transform: rotate(-45deg);
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        <div style="
          width: 8px;
          height: 8px;
          background-color: white;
          border-radius: 50%;
          margin: 6px 0 0 6px;
        "></div>
      </div>
    `,
    iconSize: [25, 25],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24]
  });
};

interface ProjectMapProps {
  projects: AdvancedProject[];
  onGeocodeComplete?: (projectId: string, lat: number, lng: number) => void;
}

export const ProjectMap: React.FC<ProjectMapProps> = ({ projects, onGeocodeComplete }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const [loading, setLoading] = useState(false);
  const [geocodingErrors, setGeocodingErrors] = useState<string[]>([]);

  // Geocoding function using Nominatim (free OSM service)
  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const encodedAddress = encodeURIComponent(address);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=au,us,gb,ca,nz`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
      
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  // Filter projects that have addresses
  const projectsWithAddresses = projects.filter(project => project.address && project.address.trim() !== '');

  // Geocode projects that don't have coordinates yet
  useEffect(() => {
    const geocodeProjects = async () => {
      setLoading(true);
      setGeocodingErrors([]);
      const errors: string[] = [];

      for (const project of projectsWithAddresses) {
        // Skip if already geocoded
        if (project.latitude && project.longitude) {
          continue;
        }

        try {
          console.log('Geocoding project:', project.name, 'Address:', project.address);
          const coords = await geocodeAddress(project.address!);
          
          if (coords && onGeocodeComplete) {
            await onGeocodeComplete(project.id, coords.lat, coords.lng);
          } else {
            errors.push(`Failed to geocode: ${project.name} (${project.address})`);
          }
          
          // Rate limiting: wait 1 second between requests to be respectful to Nominatim
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error('Error geocoding project:', project.name, error);
          errors.push(`Error geocoding: ${project.name}`);
        }
      }

      setGeocodingErrors(errors);
      setLoading(false);
    };

    // Only geocode if we have projects without coordinates
    const needsGeocoding = projectsWithAddresses.some(p => !p.latitude || !p.longitude);
    if (needsGeocoding && onGeocodeComplete) {
      geocodeProjects();
    }
  }, [projectsWithAddresses.length, onGeocodeComplete]);

  // Initialize map and add markers
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map
    map.current = L.map(mapContainer.current, {
      center: [-37.8136, 144.9631], // Melbourne, Australia default
      zoom: 10,
      scrollWheelZoom: true,
      dragging: true,
      touchZoom: true,
      doubleClickZoom: true,
      boxZoom: true,
      keyboard: true,
      attributionControl: false, // This removes the attribution control
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '', // Empty attribution to remove it
      maxZoom: 19,
    }).addTo(map.current);

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Add markers for geocoded projects
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    map.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.current!.removeLayer(layer);
      }
    });

    const validProjects = projectsWithAddresses.filter(p => p.latitude && p.longitude);
    
    if (validProjects.length === 0) return;

    const bounds = L.latLngBounds([]);

    // Add markers for each project with status-based colors
    validProjects.forEach((project) => {
      if (!map.current || !project.latitude || !project.longitude) return;

      const marker = L.marker([project.latitude, project.longitude], {
        icon: createStatusIcon(project.status)
      }).addTo(map.current);

      // Custom popup content with project reference
      const popupContent = `
        <div class="p-3 min-w-[220px]">
          <div class="mb-2">
            <h3 class="font-semibold text-sm mb-1 text-foreground">${project.name}</h3>
            ${project.project_reference_number ? 
              `<p class="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded">${project.project_reference_number}</p>` : 
              ''
            }
          </div>
          <p class="text-xs text-muted-foreground mb-3">${project.address}</p>
          <div class="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <span class="inline-flex items-center gap-1">
              <span class="w-2 h-2 rounded-full" style="background-color: ${
                project.status === 'active' ? '#10B981' :
                project.status === 'planning' ? '#3B82F6' :
                project.status === 'on_hold' ? '#F59E0B' :
                project.status === 'completed' ? '#6B7280' : '#EF4444'
              }"></span>
              ${project.status.replace('_', ' ').toUpperCase()}
            </span>
            ${project.budget ? `<span>$${project.budget.toLocaleString()}</span>` : ''}
          </div>
          <button 
            onclick="window.dispatchEvent(new CustomEvent('openProjectDetails', { detail: '${project.id}' }))"
            class="inline-flex items-center gap-1 text-xs bg-primary text-primary-foreground hover:bg-primary/90 px-2 py-1 rounded transition-colors"
          >
            View Details
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M7 17l9.2-9.2M17 17V7H7"/>
            </svg>
          </button>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 280,
        className: 'custom-popup'
      });

      bounds.extend([project.latitude, project.longitude]);
    });

    // Fit map to show all markers
    if (validProjects.length > 1) {
      map.current.fitBounds(bounds, { padding: [20, 20] });
    } else if (validProjects.length === 1) {
      const project = validProjects[0];
      map.current.setView([project.latitude!, project.longitude!], 15);
    }
  }, [projectsWithAddresses]);

  if (projectsWithAddresses.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No projects to map</h3>
          <p className="text-muted-foreground">
            No projects yet — add a project to see it displayed here and on the map below.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Project Locations
          {loading && (
            <span className="text-sm text-muted-foreground font-normal">
              (Geocoding addresses...)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div 
          ref={mapContainer} 
          className="w-full h-[400px] rounded-b-lg"
          style={{ zIndex: 1 }}
        />
        
        {/* Custom subtle attribution */}
        <div className="px-4 py-2 bg-muted/30 border-t text-xs text-muted-foreground flex justify-between items-center">
          <span>Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="hover:underline">OpenStreetMap contributors</a></span>
          <span className="text-xs opacity-60">
            {projectsWithAddresses.filter(p => p.latitude && p.longitude).length} location{projectsWithAddresses.filter(p => p.latitude && p.longitude).length !== 1 ? 's' : ''} shown
          </span>
        </div>
        
        {geocodingErrors.length > 0 && (
          <div className="p-4 bg-yellow-50 border-t">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">
              Some addresses couldn't be found:
            </h4>
            <ul className="text-xs text-yellow-700 space-y-1">
              {geocodingErrors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};