// STOREA Logo Component - Clean Text Design
import { Link } from 'react-router-dom';

interface StoreaLogoProps {
  variant?: 'full' | 'text-only' | 'icon-only';
  className?: string;
}

export const StorealiteLogo = ({
  variant = 'icon-only',
  className = 'h-8 w-auto'
}: StoreaLogoProps) => {
  const logoStyle = {
    color: 'hsl(var(--primary))',
    fontWeight: 900,
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
    fontFamily: 'Roboto, system-ui, sans-serif'
  };

  if (variant === 'icon-only') {
    return (
      <Link to="/" className="inline-flex items-center justify-center" aria-label="STOREA home">
        <picture>
          <source srcSet="/storea-logo.webp" type="image/webp" />
          <img 
            src="/storea-logo.png" 
            alt="STOREA logo" 
            className={className} 
            loading="eager"
            decoding="async"
            width="40"
            height="40"
          />
        </picture>
      </Link>
    );
  }

  if (variant === 'full') {
    return (
      <Link to="/" className="inline-flex items-center gap-2" aria-label="STOREA home">
        <picture>
          <source srcSet="/storea-logo.webp" type="image/webp" />
          <img 
            src="/storea-logo.png" 
            alt="STOREA logo" 
            className={className} 
            loading="eager"
            decoding="async"
            width="40"
            height="40"
          />
        </picture>
        <span style={logoStyle}>STOREA</span>
      </Link>
    );
  }

  // text-only
  return (
    <Link to="/" className="inline-flex items-center" aria-label="STOREA home">
      <span style={logoStyle}>STOREA</span>
    </Link>
  );
};