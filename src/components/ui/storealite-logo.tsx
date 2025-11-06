// STOREA Logo Component - Clean Text Design
import { Link } from 'react-router-dom';

interface StoreaLogoProps {
  variant?: 'full' | 'text-only' | 'icon-only';
  className?: string;
}

export const StorealiteLogo = ({ 
  variant = 'text-only',
  className = ''
}: StoreaLogoProps) => {
  const logoStyle = {
    background: 'linear-gradient(135deg, hsl(6, 8%, 17%) 0%, hsl(6, 8%, 25%) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    fontWeight: 900,
    letterSpacing: '-0.05em',
    textTransform: 'uppercase' as const,
    fontFamily: "'Arial Black', Arial, sans-serif"
  };

  if (variant === 'icon-only') {
    return (
      <Link to="/" className={`inline-flex items-center justify-center ${className}`}>
        <span style={{ 
          ...logoStyle,
          fontSize: '2rem'
        }}>
          S
        </span>
      </Link>
    );
  }

  return (
    <Link to="/" className={`inline-block ${className}`}>
      <h1>
        <span style={logoStyle}>
          STOREA
        </span>
      </h1>
    </Link>
  );
};
