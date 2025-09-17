import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Cloud, Clock, Thermometer, Droplets, Wind, CloudRain } from 'lucide-react';
import { format } from 'date-fns';
import { useProjectSelection } from '@/context/ProjectSelectionContext';

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
    forecast: [] as Array<{
      day: string;
      temperature: number;
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
        { day: 'Today', temperature: 22, condition: 'Partly Cloudy', rainfall: 0 },
        { day: 'Tomorrow', temperature: 24, condition: 'Sunny', rainfall: 0 },
        { day: 'Wed', temperature: 20, condition: 'Rainy', rainfall: 8 },
        { day: 'Thu', temperature: 23, condition: 'Cloudy', rainfall: 2 },
        { day: 'Fri', temperature: 26, condition: 'Sunny', rainfall: 0 },
        { day: 'Sat', temperature: 25, condition: 'Partly Cloudy', rainfall: 1 },
        { day: 'Sun', temperature: 21, condition: 'Overcast', rainfall: 3 }
      ];

      return { ...locations[location as keyof typeof locations] || locations['Melbourne CBD'], forecast: mockForecast };
    };

    const projectLocation = selectedProject?.address || 'Melbourne CBD';
    // Extract suburb from address (simple parsing for demo)
    const suburb = projectLocation.includes(',') 
      ? projectLocation.split(',')[1]?.trim() || 'Melbourne CBD'
      : 'Melbourne CBD';
    
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
      
      <CardContent className="flex-1 space-y-4 p-4">
        {/* Date & Time */}
        <div className="space-y-2">
          <h4 className="font-medium text-xs flex items-center gap-1 text-muted-foreground uppercase tracking-wide">
            <Clock className="h-3 w-3" />
            Current Time
          </h4>
          <div className="text-lg font-semibold">
            {format(currentTime, 'h:mm:ss a')}
          </div>
          <div className="text-xs text-muted-foreground">
            {format(currentTime, 'EEEE, MMMM d, yyyy')}
          </div>
        </div>

        {/* Weather for Current Project */}

        <div className="space-y-3">
          <h4 className="font-medium text-xs flex items-center gap-1 text-muted-foreground uppercase tracking-wide">
            <Cloud className="h-3 w-3" />
            Weather - {weather.location}
          </h4>
          
          {/* Current Weather */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-semibold">{weather.temperature}°C</span>
              <Badge variant="outline">{weather.condition}</Badge>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Droplets className="h-3 w-3" />
                {weather.humidity}%
              </div>
              <div className="flex items-center gap-1">
                <Wind className="h-3 w-3" />
                {weather.windSpeed} km/h
              </div>
              <div className="flex items-center gap-1">
                <CloudRain className="h-3 w-3" />
                {weather.rainfall}mm
              </div>
            </div>
          </div>

          {/* 7-Day Forecast */}
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">7-Day Forecast</h5>
            <div className="space-y-1">
              {weather.forecast.map((day, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <span className="font-medium w-12">{day.day}</span>
                  <span className="text-muted-foreground flex-1 text-center">{day.condition}</span>
                  <div className="flex items-center gap-2">
                    <span>{day.temperature}°C</span>
                    {day.rainfall > 0 && (
                      <span className="text-blue-500 flex items-center gap-1">
                        <CloudRain className="h-3 w-3" />
                        {day.rainfall}mm
                      </span>
                    )}
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