import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Cloud, Clock, Thermometer, Droplets, Wind } from 'lucide-react';
import { format } from 'date-fns';

export const InfoPanel = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather, setWeather] = useState({
    temperature: 22,
    condition: 'Partly Cloudy',
    humidity: 65,
    windSpeed: 12
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const today = new Date();
  const upcomingDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    return date;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Info Panel
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Date & Time */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Current Time
          </h4>
          <div className="text-lg font-semibold">
            {format(currentTime, 'h:mm:ss a')}
          </div>
          <div className="text-sm text-muted-foreground">
            {format(currentTime, 'EEEE, MMMM d, yyyy')}
          </div>
        </div>

        {/* Mini Calendar */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Week Overview
          </h4>
          <div className="grid grid-cols-7 gap-1 text-xs">
            {upcomingDates.map((date, index) => (
              <div 
                key={index}
                className={`text-center p-1 rounded ${
                  index === 0 ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`}
              >
                <div className="font-medium">{format(date, 'EEE')}</div>
                <div className="text-xs">{format(date, 'd')}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Weather */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <Cloud className="h-4 w-4" />
            Weather
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-semibold">{weather.temperature}°C</span>
              <Badge variant="outline">{weather.condition}</Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Droplets className="h-3 w-3" />
                {weather.humidity}% humidity
              </div>
              <div className="flex items-center gap-1">
                <Wind className="h-3 w-3" />
                {weather.windSpeed} km/h
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Quick Stats</h4>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Active Projects:</span>
              <span className="font-medium">8</span>
            </div>
            <div className="flex justify-between">
              <span>Pending Tasks:</span>
              <span className="font-medium text-destructive">12</span>
            </div>
            <div className="flex justify-between">
              <span>Team Members:</span>
              <span className="font-medium">24</span>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">System Status</h4>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-muted-foreground">All systems operational</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};