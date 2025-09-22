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

  // Mock weather data based on project location
  useEffect(() => {
    const getWeatherForLocation = (location: string) => {
      // Mock weather data - in production this would be an API call
      const locations = {
        'Melbourne CBD': { temp: 22, condition: 'Partly Cloudy', humidity: 65, wind: 12, rainfall: 0 },
        'Sydney': { temp: 25, condition: 'Sunny', humidity: 60, wind: 8, rainfall: 0 },
        'Brisbane': { temp: 28, condition: 'Cloudy', humidity: 70, wind: 15, rainfall: 2 },
        'Perth': { temp: 24, condition: 'Clear', humidity: 55, wind: 10, rainfall: 0 },
        'Adelaide': { temp: 21, condition: 'Overcast', humidity: 68, wind: 14, rainfall: 1 }
      };

      const mockForecast = [
        { day: format(new Date(), 'MMM d'), temperature: 22, condition: 'Partly Cloudy', rainfall: 0 },
        { day: format(new Date(Date.now() + 86400000), 'MMM d'), temperature: 24, condition: 'Sunny', rainfall: 0 },
        { day: format(new Date(Date.now() + 2 * 86400000), 'MMM d'), temperature: 20, condition: 'Rainy', rainfall: 8 },
        { day: format(new Date(Date.now() + 3 * 86400000), 'MMM d'), temperature: 23, condition: 'Cloudy', rainfall: 2 },
        { day: format(new Date(Date.now() + 4 * 86400000), 'MMM d'), temperature: 26, condition: 'Sunny', rainfall: 0 },
        { day: format(new Date(Date.now() + 5 * 86400000), 'MMM d'), temperature: 25, condition: 'Partly Cloudy', rainfall: 1 },
        { day: format(new Date(Date.now() + 6 * 86400000), 'MMM d'), temperature: 21, condition: 'Overcast', rainfall: 3 }
      ];

      return { ...locations[location as keyof typeof locations] || locations['Melbourne CBD'], forecast: mockForecast };
    };

    const projectLocation = selectedProject?.address || 'Melbourne CBD';
    // Extract suburb from address - improved parsing
    let suburb = 'Melbourne CBD';
    
    if (projectLocation && projectLocation !== 'Melbourne CBD') {
      // Try to extract suburb from common address formats
      // e.g., "123 Main St, Suburb, State" or "123 Main St, Suburb 3941"
      const parts = projectLocation.split(',').map(part => part.trim());
      if (parts.length >= 2) {
        // Take the second part as suburb (after street address)
        let locationPart = parts[1];
        // Extract suburb name by removing postcode (4 digits at the end)
        suburb = locationPart.replace(/\s+\d{4}$/, '').trim();
        // Remove state abbreviations if present
        suburb = suburb.replace(/\s+(VIC|NSW|QLD|SA|WA|TAS|NT|ACT)$/i, '').trim();
      } else if (parts.length === 1) {
        // If no comma, try to extract from the end
        const words = projectLocation.split(' ');
        if (words.length > 2) {
          // Take last 1-2 words as potential suburb, excluding postcode
          const withoutPostcode = projectLocation.replace(/\s+\d{4}$/, '').trim();
          const cleanWords = withoutPostcode.split(' ');
          suburb = cleanWords.slice(-2).join(' ');
        }
      }
    }
    
    const weatherData = getWeatherForLocation(suburb);
    
    setWeather({
      temperature: weatherData.temp,
      condition: weatherData.condition,
      humidity: weatherData.humidity,
      windSpeed: weatherData.wind,
      rainfall: weatherData.rainfall,
      location: suburb,
      forecast: weatherData.forecast
    });
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
            <div className="space-y-1">
              {weather.forecast.slice(0, 5).map((day, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-md bg-muted/20 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="font-medium text-sm w-12 text-left">{day.day}</span>
                    <span className="text-xs text-muted-foreground text-center flex-1">{day.condition}</span>
                  </div>
                  <div className="flex items-center justify-end gap-2 min-w-[80px]">
                    <span className="font-semibold text-sm w-10 text-right">{day.temperature}°C</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
};