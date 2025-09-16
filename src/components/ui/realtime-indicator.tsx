import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Wifi, WifiOff, AlertCircle, Clock } from 'lucide-react';
import { useRealtime } from '@/context/RealtimeContext';
import { cn } from '@/lib/utils';

interface RealtimeIndicatorProps {
  className?: string;
}

export const RealtimeIndicator: React.FC<RealtimeIndicatorProps> = ({ className }) => {
  const { isConnected, connectionStatus, lastUpdate } = useRealtime();

  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: Wifi,
          color: 'bg-green-100 text-green-800 hover:bg-green-200',
          text: 'Connected',
          description: 'Real-time updates are active'
        };
      case 'connecting':
        return {
          icon: Clock,
          color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
          text: 'Connecting...',
          description: 'Establishing real-time connection'
        };
      case 'error':
        return {
          icon: AlertCircle,
          color: 'bg-red-100 text-red-800 hover:bg-red-200',
          text: 'Error',
          description: 'Real-time connection failed. Data may not update automatically.'
        };
      case 'disconnected':
      default:
        return {
          icon: WifiOff,
          color: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
          text: 'Disconnected',
          description: 'Real-time updates are not active. Please refresh to see latest data.'
        };
    }
  };

  const { icon: Icon, color, text, description } = getStatusConfig();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge 
          variant="outline" 
          className={cn(
            "cursor-help transition-colors",
            color,
            className
          )}
        >
          <Icon className="h-3 w-3 mr-1" />
          {text}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <div className="text-center">
          <p className="font-medium">{description}</p>
          {lastUpdate && (
            <p className="text-xs text-muted-foreground mt-1">
              Last update: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};