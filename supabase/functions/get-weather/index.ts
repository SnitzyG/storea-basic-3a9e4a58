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

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("OPENWEATHER_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing OPENWEATHER_API_KEY" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { location, country = "AU", lat, lon }: WeatherRequestBody = await req.json().catch(() => ({}));

    if ((!lat || !lon) && !location) {
      return new Response(
        JSON.stringify({ error: "Provide either lat/lon or a location string" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Improve location formatting for Australian cities
    let queryLocation = location;
    if (location && !lat && !lon) {
      // For Australian locations, be more specific
      if (country === "AU") {
        // Add state if not present
        if (!location.includes("VIC") && !location.includes("NSW") && !location.includes("QLD") && 
            !location.includes("SA") && !location.includes("WA") && !location.includes("TAS") && 
            !location.includes("NT") && !location.includes("ACT")) {
          queryLocation = `${location}, VIC, AU`; // Default to VIC, can be improved with more location data
        } else {
          queryLocation = `${location}, AU`;
        }
      } else {
        queryLocation = `${location}, ${country}`;
      }
    }

    console.log(`Searching weather for: ${queryLocation}`);

    const forecastUrl = lat && lon
      ? `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
      : `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(queryLocation)}&appid=${apiKey}&units=metric`;

    const currentUrl = lat && lon
      ? `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
      : `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(queryLocation)}&appid=${apiKey}&units=metric`;

    const [forecastRes, currentRes] = await Promise.all([
      fetch(forecastUrl),
      fetch(currentUrl)
    ]);

    if (!forecastRes.ok || !currentRes.ok) {
      const fTxt = await forecastRes.text();
      const cTxt = await currentRes.text();
      console.error(`OpenWeather API error for location "${queryLocation}": forecast ${forecastRes.status} ${fTxt} | current ${currentRes.status} ${cTxt}`);
      
      // Try fallback to Melbourne if the location wasn't found
      if (forecastRes.status === 404 || currentRes.status === 404) {
        console.log(`Location "${queryLocation}" not found, trying fallback to Melbourne, VIC, AU`);
        const fallbackLocation = "Melbourne, VIC, AU";
        
        const fallbackForecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(fallbackLocation)}&appid=${apiKey}&units=metric`;
        const fallbackCurrentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(fallbackLocation)}&appid=${apiKey}&units=metric`;
        
        const [fallbackForecastRes, fallbackCurrentRes] = await Promise.all([
          fetch(fallbackForecastUrl),
          fetch(fallbackCurrentUrl)
        ]);
        
        if (fallbackForecastRes.ok && fallbackCurrentRes.ok) {
          const fallbackForecastData = await fallbackForecastRes.json();
          const fallbackCurrentData = await fallbackCurrentRes.json();
          
          // Process fallback data the same way as normal data
          const daysMap = new Map<string, { day: string; min: number; max: number; condition: string; rainfall: number }>();
          for (const item of fallbackForecastData.list) {
            const date = new Date(item.dt * 1000);
            const dayKey = date.toLocaleDateString('en-US', { weekday: 'short' });
            const min = item.main.temp_min;
            const max = item.main.temp_max;
            const cond = item.weather?.[0]?.main ?? 'N/A';
            const rain = item.rain?.['3h'] ?? 0;

            if (!daysMap.has(dayKey)) {
              daysMap.set(dayKey, { day: dayKey, min, max, condition: cond, rainfall: rain });
            } else {
              const d = daysMap.get(dayKey)!;
              d.min = Math.min(d.min, min);
              d.max = Math.max(d.max, max);
              d.rainfall += rain;
            }
          }

          const forecast = Array.from(daysMap.values()).slice(0, 7).map(d => ({
            day: d.day,
            minTemp: Math.round(d.min),
            maxTemp: Math.round(d.max),
            condition: d.condition,
            rainfall: Math.round(d.rainfall)
          }));

          const current = {
            temp: fallbackCurrentData.main?.temp,
            condition: fallbackCurrentData.weather?.[0]?.main ?? 'N/A',
            humidity: fallbackCurrentData.main?.humidity ?? 0,
            wind_kmh: Math.round((fallbackCurrentData.wind?.speed ?? 0) * 3.6),
            rainfall_mm: fallbackCurrentData.rain?.['1h'] ?? fallbackCurrentData.rain?.['3h'] ?? 0
          };

          return new Response(
            JSON.stringify({
              city: `${location} (showing Melbourne weather)`,
              country: fallbackForecastData.city?.country ?? country,
              current,
              forecast
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
      
      throw new Error(`OpenWeather error: forecast ${forecastRes.status} ${fTxt} | current ${currentRes.status} ${cTxt}`);
    }

    const forecastData = await forecastRes.json();
    const currentData = await currentRes.json();

    // Group 3-hourly data into daily min/max + simple condition + rainfall
    const daysMap = new Map<string, { day: string; min: number; max: number; condition: string; rainfall: number }>();
    for (const item of forecastData.list) {
      const date = new Date(item.dt * 1000);
      const dayKey = date.toLocaleDateString('en-US', { weekday: 'short' });
      const min = item.main.temp_min;
      const max = item.main.temp_max;
      const cond = item.weather?.[0]?.main ?? 'N/A';
      const rain = item.rain?.['3h'] ?? 0;

      if (!daysMap.has(dayKey)) {
        daysMap.set(dayKey, { day: dayKey, min, max, condition: cond, rainfall: rain });
      } else {
        const d = daysMap.get(dayKey)!;
        d.min = Math.min(d.min, min);
        d.max = Math.max(d.max, max);
        d.rainfall += rain;
      }
    }

    const forecast = Array.from(daysMap.values()).slice(0, 7).map(d => ({
      day: d.day,
      minTemp: Math.round(d.min),
      maxTemp: Math.round(d.max),
      condition: d.condition,
      rainfall: Math.round(d.rainfall)
    }));

    const current = {
      temp: currentData.main?.temp,
      condition: currentData.weather?.[0]?.main ?? 'N/A',
      humidity: currentData.main?.humidity ?? 0,
      wind_kmh: Math.round((currentData.wind?.speed ?? 0) * 3.6),
      rainfall_mm: currentData.rain?.['1h'] ?? currentData.rain?.['3h'] ?? 0
    };

    return new Response(
      JSON.stringify({
        city: forecastData.city?.name ?? location ?? 'Unknown',
        country: forecastData.city?.country ?? country,
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
