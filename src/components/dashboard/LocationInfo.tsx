import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Clock, Calendar, Cloud } from 'lucide-react';

interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
}

export const LocationInfo = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather, setWeather] = useState<WeatherData>({
    temperature: 18,
    condition: 'Partly Cloudy',
    humidity: 65
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-AU', {
      timeZone: 'Australia/Melbourne',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-AU', {
      timeZone: 'Australia/Melbourne',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Melbourne, Victoria
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono">{formatTime(currentTime)}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{formatDate(currentTime)}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <Cloud className="h-4 w-4 text-muted-foreground" />
          <span>{weather.temperature}°C - {weather.condition}</span>
        </div>
        
        <div className="text-xs text-muted-foreground">
          Humidity: {weather.humidity}%
        </div>
      </CardContent>
    </Card>
  );
};