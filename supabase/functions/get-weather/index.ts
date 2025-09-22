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

    const forecastUrl = lat && lon
      ? `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
      : `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(`${location},${country}`)}&appid=${apiKey}&units=metric`;

    const currentUrl = lat && lon
      ? `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
      : `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(`${location},${country}`)}&appid=${apiKey}&units=metric`;

    const [forecastRes, currentRes] = await Promise.all([
      fetch(forecastUrl),
      fetch(currentUrl)
    ]);

    if (!forecastRes.ok || !currentRes.ok) {
      const fTxt = await forecastRes.text();
      const cTxt = await currentRes.text();
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
