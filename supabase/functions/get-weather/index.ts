import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WeatherRequestBody {
  location?: string;
  country?: string;
  lat?: number;
  lon?: number;
}

// Australian city coordinates for better location matching
const australianCities: { [key: string]: { lat: number; lon: number; name: string } } = {
  "rye": { lat: -38.3667, lon: 144.8167, name: "Rye, VIC" },
  "melbourne": { lat: -37.8136, lon: 144.9631, name: "Melbourne, VIC" },
  "sydney": { lat: -33.8688, lon: 151.2093, name: "Sydney, NSW" },
  "brisbane": { lat: -27.4698, lon: 153.0251, name: "Brisbane, QLD" },
  "perth": { lat: -31.9505, lon: 115.8605, name: "Perth, WA" },
  "adelaide": { lat: -34.9285, lon: 138.6007, name: "Adelaide, SA" },
  "geelong": { lat: -38.1499, lon: 144.3617, name: "Geelong, VIC" },
  "ballarat": { lat: -37.5622, lon: 143.8503, name: "Ballarat, VIC" },
  "bendigo": { lat: -36.7570, lon: 144.2794, name: "Bendigo, VIC" },
  "frankston": { lat: -38.1342, lon: 145.1234, name: "Frankston, VIC" },
  "mornington": { lat: -38.2222, lon: 145.0420, name: "Mornington, VIC" },
  "sorrento": { lat: -38.3333, lon: 144.7333, name: "Sorrento, VIC" },
  "portsea": { lat: -38.3167, lon: 144.7167, name: "Portsea, VIC" }
};

async function getCoordinates(location: string): Promise<{ lat: number; lon: number; displayName: string } | null> {
  const locationKey = location.toLowerCase().trim();
  
  // Check our Australian cities first
  if (australianCities[locationKey]) {
    const city = australianCities[locationKey];
    return { lat: city.lat, lon: city.lon, displayName: city.name };
  }
  
  // If not in our predefined list, try geocoding with Nominatim (free)
  try {
    const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location + ', Victoria, Australia')}&format=json&limit=1`;
    const response = await fetch(geocodeUrl, {
      headers: { 'User-Agent': 'STOREALite-Weather-App' }
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon),
          displayName: data[0].display_name.split(',')[0] + ', VIC'
        };
      }
    }
  } catch (error) {
    console.error('Geocoding failed:', error);
  }
  
  // Fallback to Melbourne
  return { lat: -37.8136, lon: 144.9631, displayName: "Melbourne, VIC" };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { location, lat, lon }: WeatherRequestBody = await req.json().catch(() => ({}));

    let coordinates: { lat: number; lon: number; displayName: string };
    
    if (lat && lon) {
      coordinates = { lat, lon, displayName: location || `${lat}, ${lon}` };
    } else if (location) {
      const coords = await getCoordinates(location);
      if (!coords) {
        throw new Error('Could not resolve location');
      }
      coordinates = coords;
    } else {
      return new Response(
        JSON.stringify({ error: "Provide either lat/lon or a location string" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Getting weather for: ${coordinates.displayName} (${coordinates.lat}, ${coordinates.lon})`);

    // Use Open-Meteo API (free, no API key required)
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coordinates.lat}&longitude=${coordinates.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Australia/Melbourne&forecast_days=7`;
    
    const weatherResponse = await fetch(weatherUrl);
    
    if (!weatherResponse.ok) {
      throw new Error(`Open-Meteo API error: ${weatherResponse.status}`);
    }

    const weatherData = await weatherResponse.json();

    // Weather code mapping for Open-Meteo
    const getConditionFromCode = (code: number): string => {
      if (code === 0) return 'Clear';
      if (code <= 3) return 'Partly Cloudy';
      if (code <= 48) return 'Cloudy';
      if (code <= 57) return 'Light Rain';
      if (code <= 67) return 'Rain';
      if (code <= 77) return 'Snow';
      if (code <= 82) return 'Rain';
      if (code <= 86) return 'Snow';
      if (code <= 99) return 'Thunderstorm';
      return 'Unknown';
    };

    // Process forecast data
    const forecast = [];
    for (let i = 0; i < Math.min(7, weatherData.daily.time.length); i++) {
      const date = new Date(weatherData.daily.time[i]);
      const day = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      forecast.push({
        day,
        minTemp: Math.round(weatherData.daily.temperature_2m_min[i]),
        maxTemp: Math.round(weatherData.daily.temperature_2m_max[i]),
        condition: getConditionFromCode(weatherData.daily.weather_code[i]),
        rainfall: Math.round(weatherData.daily.precipitation_sum[i] || 0)
      });
    }

    const current = {
      temp: Math.round(weatherData.current.temperature_2m),
      condition: getConditionFromCode(weatherData.current.weather_code),
      humidity: Math.round(weatherData.current.relative_humidity_2m),
      wind_kmh: Math.round(weatherData.current.wind_speed_10m * 3.6), // Convert m/s to km/h
      rainfall_mm: Math.round(weatherData.current.precipitation || 0)
    };

    return new Response(
      JSON.stringify({
        city: coordinates.displayName,
        country: 'AU',
        current,
        forecast
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error('get-weather error:', e);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch weather', details: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
