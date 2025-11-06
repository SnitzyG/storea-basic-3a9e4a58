// STOREA Logo Component - Clean Text Design

interface StoreaLogoProps {
  variant?: 'full' | 'text-only' | 'icon-only';
  className?: string;
}

export const StorealiteLogo = ({ 
  variant = 'text-only',
  className = ''
}: StoreaLogoProps) => {
  const logoStyle = {
    background: 'linear-gradient(135deg, hsl(215, 45%, 25%) 0%, hsl(215, 45%, 35%) 100%)',
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
      <div className={`inline-flex items-center justify-center ${className}`}>
        <span style={{ 
          ...logoStyle,
          fontSize: '2rem'
        }}>
          S
        </span>
      </div>
    );
  }

  return (
    <h1 className={`inline-block ${className}`}>
      <span style={logoStyle}>
        STOREA
      </span>
    </h1>
  );
};
