import { supabase } from "@/integrations/supabase/client";

export interface GeocodeResult {
  lat: number;
  lng: number;
}

/**
 * Geocode an address using Nominatim (OpenStreetMap's free geocoding service)
 */
export const geocodeAddress = async (address: string): Promise<GeocodeResult | null> => {
  try {
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=au,us,gb,ca,nz,de,fr,es,it,nl,be,ch,at`,
      {
        headers: {
          'User-Agent': 'Lovable Project Manager/1.0'
        }
      }
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

/**
 * Update project coordinates in the database
 */
export const updateProjectCoordinates = async (
  projectId: string, 
  lat: number, 
  lng: number
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('projects')
      .update({
        latitude: lat,
        longitude: lng,
        geocoded_at: new Date().toISOString()
      })
      .eq('id', projectId);

    if (error) {
      console.error('Error updating project coordinates:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating project coordinates:', error);
    return false;
  }
};