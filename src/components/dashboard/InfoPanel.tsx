import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Cloud, Clock, Thermometer, Droplets, Wind, CloudRain } from 'lucide-react';
import { format } from 'date-fns';
import { useProjectSelection } from '@/context/ProjectSelectionContext';
import { supabase } from '@/integrations/supabase/client';

export const InfoPanel = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { selectedProject } = useProjectSelection();
  const [weather, setWeather] = useState({
    temperature: 22,
    condition: 'Partly Cloudy',
    humidity: 65,
    windSpeed: 12,
    rainfall: 0,
    location: 'Melbourne CBD',
    loading: true,
    forecast: [] as Array<{
      day: string;
      minTemp: number;
      maxTemp: number;
      condition: string;
      rainfall: number;
    }>
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Real weather data based on project location via Edge Function
  useEffect(() => {
    const fetchWeather = async () => {
      const projectLocation = selectedProject?.address || 'Melbourne CBD';
      // Extract suburb from address - improved parsing
      let suburb = 'Melbourne CBD';

      if (projectLocation && projectLocation !== 'Melbourne CBD') {
        const parts = projectLocation.split(',').map(part => part.trim());
        if (parts.length >= 2) {
          let locationPart = parts[1];
          suburb = locationPart.replace(/\s+\d{4}$/, '').trim();
          suburb = suburb.replace(/\s+(VIC|NSW|QLD|SA|WA|TAS|NT|ACT)$/i, '').trim();
        } else if (parts.length === 1) {
          const words = projectLocation.split(' ');
          if (words.length > 2) {
            const withoutPostcode = projectLocation.replace(/\s+\d{4}$/, '').trim();
            const cleanWords = withoutPostcode.split(' ');
            suburb = cleanWords.slice(-2).join(' ');
          }
        }
      }

      try {
        setWeather(prev => ({ ...prev, loading: true, location: suburb }));
        const { data, error } = await supabase.functions.invoke('get-weather', {
          body: { location: suburb, country: 'AU' }
        });
        if (error) throw error;

        setWeather({
          temperature: Math.round(data.current.temp),
          condition: data.current.condition,
          humidity: data.current.humidity,
          windSpeed: Math.round(data.current.wind_kmh),
          rainfall: data.current.rainfall_mm || 0,
          location: data.city || suburb,
          loading: false,
          forecast: (data.forecast || []).slice(0, 7)
        });
      } catch (err) {
        console.error('Weather fetch failed, using fallback:', err);
        setWeather(prev => ({
          ...prev,
          loading: false
        }));
      }
    };

    fetchWeather();
  }, [selectedProject]);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0 border-b">
        <CardTitle className="text-base flex items-center gap-2 font-medium">
          <Clock className="h-4 w-4 text-primary" />
          Info Panel
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 space-y-6 p-4">
        {/* Date & Time */}
        <div className="space-y-3">
          <h4 className="font-medium text-xs flex items-center gap-1 text-muted-foreground uppercase tracking-wide">
            <Clock className="h-3 w-3" />
            Current Time
          </h4>
          <div className="space-y-2">
            <div className="text-xl font-semibold">
              {format(currentTime, 'h:mm:ss a')}
            </div>
            <div className="text-sm text-muted-foreground">
              {format(currentTime, 'EEEE, MMMM d, yyyy')}
            </div>
          </div>
        </div>

        {/* Weather for Current Project */}

        <div className="space-y-4">
          <h4 className="font-medium text-xs flex items-center gap-1 text-muted-foreground uppercase tracking-wide">
            <Cloud className="h-3 w-3" />
            Weather - {weather.location}
          </h4>
          
          {/* Current Weather */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-semibold">{weather.temperature}°C</span>
              <Badge variant="outline" className="text-xs">{weather.condition}</Badge>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/30 hover:bg-muted/40 transition-colors">
                <Droplets className="h-4 w-4 text-blue-500" />
                <span className="font-semibold text-sm">{weather.humidity}%</span>
                <span className="text-muted-foreground text-xs">Humidity</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/30 hover:bg-muted/40 transition-colors">
                <Wind className="h-4 w-4 text-green-500" />
                <span className="font-semibold text-sm">{weather.windSpeed}</span>
                <span className="text-muted-foreground text-xs">km/h</span>
              </div>
              <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/30 hover:bg-muted/40 transition-colors">
                <CloudRain className="h-4 w-4 text-indigo-500" />
                <span className="font-semibold text-sm">{weather.rainfall}mm</span>
                <span className="text-muted-foreground text-xs">Rain</span>
              </div>
            </div>
          </div>

          {/* 7-Day Forecast */}
          <div className="space-y-3">
            <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">5-Day Forecast</h5>
            <div className="grid grid-cols-5 gap-2">
              {weather.forecast.slice(0, 5).map((day, index) => (
                <div key={index} className="flex flex-col items-center text-center p-2 rounded-md bg-muted/20 hover:bg-muted/30 transition-colors">
                  <span className="font-medium text-sm mb-1">{day.day}</span>
                  <span className="text-xs text-muted-foreground mb-1 leading-tight">{day.condition}</span>
                  <span className="font-semibold text-sm">{day.maxTemp}°{day.minTemp}°</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
};