import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Cloud, Clock, Thermometer, Droplets, Wind, CloudRain, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { useProjectSelection } from '@/context/ProjectSelectionContext';
import { supabase } from '@/integrations/supabase/client';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
export const InfoPanel = ({ selectedProjectFilter }: { selectedProjectFilter: string }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const {
    selectedProject,
    availableProjects
  } = useProjectSelection();
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
      // Get project location based on filter selection
      const targetProject = selectedProjectFilter === 'current' 
        ? selectedProject 
        : availableProjects.find(p => p.id === selectedProjectFilter);
      
      const projectLocation = targetProject?.address || 'Melbourne CBD';
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
        setWeather(prev => ({
          ...prev,
          loading: true,
          location: suburb
        }));
        const {
          data,
          error
        } = await supabase.functions.invoke('get-weather', {
          body: {
            location: suburb,
            country: 'AU'
          }
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
  }, [selectedProject, selectedProjectFilter, availableProjects]);
  return <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 flex-shrink-0 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2 font-medium">
            <Clock className="h-4 w-4 text-primary" />
            Info Panel
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col overflow-hidden p-2">
        {/* Date & Time - Compact */}
        <div className="flex-shrink-0 space-y-1 mb-3">
          <h4 className="font-medium text-xs flex items-center gap-1 text-muted-foreground uppercase tracking-wide">
            <Clock className="h-3 w-3" />
            Current Time
          </h4>
          <div className="space-y-0.5">
            <div className="text-base font-semibold">
              {format(currentTime, 'h:mm:ss a')}
            </div>
            <div className="text-xs text-muted-foreground">
              {format(currentTime, 'EEE, MMM d, yyyy')}
            </div>
          </div>
        </div>

        {/* Weather Section - Optimized */}
        <div className="flex-1 flex flex-col min-h-0">
          <h4 className="font-medium text-xs flex items-center gap-1 text-muted-foreground uppercase tracking-wide mb-2 flex-shrink-0">
            <Cloud className="h-3 w-3" />
            Weather - {weather.location}
          </h4>
          
          {/* Current Weather - Compact */}
          <div className="flex-shrink-0 space-y-2 mb-3">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">{weather.temperature}°C</span>
              <Badge variant="outline" className="text-xs">{weather.condition}</Badge>
            </div>
            
            
          </div>

          {/* 5-Day Forecast - Flexible */}
          <div className="flex-1 flex flex-col min-h-0">
            <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 flex-shrink-0">5-Day Forecast</h5>
            <div className="flex-1 grid grid-cols-1 auto-rows-fr gap-1 min-h-0">
              {weather.forecast.slice(0, 5).map((day, index) => <div key={index} className="flex items-center justify-between px-2 py-1 rounded-md bg-muted/20 hover:bg-muted/30 transition-colors min-h-0">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="font-medium text-xs w-8 text-left flex-shrink-0">{day.day}</span>
                    <span className="text-xs text-muted-foreground truncate flex-1">{day.condition}</span>
                  </div>
                  <div className="flex items-center justify-end min-w-[44px] flex-shrink-0">
                    <span className="font-semibold text-xs text-right">{day.maxTemp}°/{day.minTemp}°</span>
                  </div>
                </div>)}
            </div>
          </div>
        </div>

      </CardContent>
    </Card>;
};