// STOREA Logo Component - Pure Text Design with Roboto
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface StoreaLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showTagline?: boolean;
  asLink?: boolean;
}

const sizeClasses = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-3xl',
  xl: 'text-4xl',
};

export const StorealiteLogo = ({
  size = 'md',
  className,
  showTagline = false,
  asLink = true,
}: StoreaLogoProps) => {
  const logoContent = (
    <div className={cn("inline-flex flex-col items-center", className)}>
      <span
        className={cn(
          sizeClasses[size],
          "font-roboto font-black tracking-widest uppercase text-primary"
        )}
        style={{ letterSpacing: '0.15em' }}
      >
        STOREA
      </span>
      {showTagline && (
        <span className="text-xs text-muted-foreground tracking-wide">
          Construction Management
        </span>
      )}
    </div>
  );

  if (asLink) {
    return (
      <Link to="/" className="inline-flex items-center" aria-label="STOREA home">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
};
