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
    icon: 'w-6 h-6'
  },
  md: {
    container: 'text-xl',
    icon: 'w-8 h-8'
  },
  lg: {
    container: 'text-3xl',
    icon: 'w-12 h-12'
  },
  xl: {
    container: 'text-4xl',
    icon: 'w-16 h-16'
  }
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
          lite: 'text-white/80'
        };
      case 'dark':
        return {
          store: 'text-foreground',
          lite: 'text-muted-foreground'
        };
      default:
        return {
          store: 'bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent',
          lite: 'bg-gradient-to-r from-accent to-accent/80 bg-clip-text text-transparent'
        };
    }
  };
  const textClasses = getTextClasses();
  const LogoIcon = () => (
    <div className={cn(
      'rounded-lg bg-gradient-to-br from-primary to-primary/80 p-2 shadow-lg',
      config.icon
    )}>
      <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2"
        className="w-full h-full text-white"
      >
        <path d="M3 21h18" />
        <path d="M5 21V7l8-4v18" />
        <path d="M19 21V11l-6-4" />
      </svg>
    </div>
  );
  return <div className={cn('flex items-center gap-3 select-none', config.container, className)}>
      {showIcon && <LogoIcon />}
      
      <div className="flex items-baseline tracking-wide">
        <span className={cn('font-black font-display', textClasses.store)}>
          STOREA
        </span>
        <span className={cn('font-light ml-1 relative', textClasses.lite)}>
          Lite
          {/* Subtle underline accent */}
          <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-accent/60 to-transparent rounded-full" />
        </span>
      </div>
    </div>;
};
export default Logo;