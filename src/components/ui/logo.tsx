import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'white' | 'dark';
  showIcon?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: {
    container: 'text-lg',
    icon: 'w-6 h-6',
  },
  md: {
    container: 'text-xl',
    icon: 'w-8 h-8',
  },
  lg: {
    container: 'text-3xl',
    icon: 'w-12 h-12',
  },
  xl: {
    container: 'text-4xl',
    icon: 'w-16 h-16',
  },
};

const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  variant = 'default', 
  showIcon = true,
  className 
}) => {
  const config = sizeConfig[size];
  
  const getTextClasses = () => {
    switch (variant) {
      case 'white':
        return {
          store: 'text-white',
          lite: 'text-white/80',
        };
      case 'dark':
        return {
          store: 'text-foreground',
          lite: 'text-muted-foreground',
        };
      default:
        return {
          store: 'bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent',
          lite: 'bg-gradient-to-r from-accent to-accent/80 bg-clip-text text-transparent',
        };
    }
  };

  const textClasses = getTextClasses();

  const LogoIcon = () => (
    <div className={cn(
      'relative flex items-center justify-center rounded-lg bg-gradient-to-br from-primary via-primary/90 to-accent shadow-lg',
      config.icon
    )}>
      {/* Building/Construction Icon */}
      <svg 
        viewBox="0 0 24 24" 
        className="w-3/5 h-3/5 text-white"
        fill="currentColor"
      >
        {/* Foundation */}
        <rect x="2" y="20" width="20" height="2" opacity="0.8"/>
        
        {/* Building Structure */}
        <path d="M4 20V12L12 8L20 12V20H16V14H8V20H4Z" opacity="0.9"/>
        
        {/* Roof Peak */}
        <path d="M12 4L8 7V6H6V9L12 6L18 9V6H16V7L12 4Z"/>
        
        {/* Windows */}
        <rect x="9" y="15" width="2" height="2" className="text-primary/30"/>
        <rect x="13" y="15" width="2" height="2" className="text-primary/30"/>
        
        {/* Door */}
        <rect x="11" y="17" width="2" height="3" className="text-primary/40"/>
      </svg>
      
      {/* Shine Effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent rounded-lg" />
    </div>
  );

  return (
    <div className={cn(
      'flex items-center gap-3 select-none',
      config.container,
      className
    )}>
      {showIcon && <LogoIcon />}
      
      <div className="flex items-baseline tracking-wide">
        <span className={cn(
          'font-black font-display',
          textClasses.store
        )}>
          STOREA
        </span>
        <span className={cn(
          'font-light ml-1 relative',
          textClasses.lite
        )}>
          Lite
          {/* Subtle underline accent */}
          <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-accent/60 to-transparent rounded-full" />
        </span>
      </div>
    </div>
  );
};

export default Logo;