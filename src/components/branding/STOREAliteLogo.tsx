import { useEffect, useState } from 'react';

interface STOREAliteLogoProps {
  className?: string;
  animated?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const STOREAliteLogo = ({ 
  className = '', 
  animated = true, 
  size = 'md' 
}: STOREAliteLogoProps) => {
  const [isVisible, setIsVisible] = useState(!animated);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, [animated]);

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-4xl'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {animated && (
        <div className="relative">
          {/* House Building Animation */}
          <svg
            width="40"
            height="40"
            viewBox="0 0 200 200"
            className="animate-[fadeIn_0.5s_ease-out]"
          >
            {/* Foundation - appears first */}
            <rect
              x="40"
              y="160"
              width="120"
              height="20"
              className="fill-primary animate-[fadeIn_0.8s_ease-out_0.5s_both]"
            />
            
            {/* Walls - appear second */}
            <g className="animate-[fadeIn_0.8s_ease-out_1.2s_both]">
              <rect x="50" y="120" width="100" height="40" className="fill-primary/80" />
              <rect x="60" y="100" width="80" height="20" className="fill-primary/90" />
            </g>
            
            {/* Roof - appears third */}
            <g className="animate-[fadeIn_0.8s_ease-out_1.9s_both]">
              <polygon 
                points="40,120 100,80 160,120" 
                className="fill-accent"
              />
              <polygon 
                points="50,100 100,70 150,100" 
                className="fill-accent/90"
              />
            </g>
            
            {/* Details - appear last */}
            <g className="animate-[fadeIn_0.8s_ease-out_2.6s_both]">
              {/* Windows */}
              <rect x="70" y="130" width="15" height="15" className="fill-background" />
              <rect x="115" y="130" width="15" height="15" className="fill-background" />
              
              {/* Door */}
              <rect x="90" y="135" width="20" height="25" className="fill-background" />
              
              {/* Construction elements */}
              <circle cx="170" cy="90" r="8" className="fill-amber-500" />
              <rect x="165" y="85" width="10" height="2" className="fill-amber-600" />
            </g>
          </svg>
        </div>
      )}
      
      <div className={`${isVisible ? 'animate-[fadeIn_0.8s_ease-out_3.4s_both]' : ''}`}>
        <h1 className={`font-bold tracking-wider ${sizeClasses[size]}`}>
          <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent font-black">
            STOREA
          </span>
          <span className="bg-gradient-to-r from-primary/90 to-primary/60 bg-clip-text text-transparent font-medium ml-1">
            lite
          </span>
        </h1>
      </div>
    </div>
  );
};