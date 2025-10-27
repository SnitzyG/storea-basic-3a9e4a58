// Professional Storealite Logo Component with Collaborative Animation

interface StorealiteLogoProps {
  variant?: 'full' | 'text-only' | 'icon-only';
  showAnimation?: boolean;
  className?: string;
}

export const StorealiteLogo = ({ 
  variant = 'full', 
  showAnimation = true,
  className = ''
}: StorealiteLogoProps) => {
  if (variant === 'icon-only') {
    return (
      <svg width="48" height="48" viewBox="0 0 48 48" className={className}>
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(215, 45%, 25%)" />
            <stop offset="100%" stopColor="hsl(40, 85%, 60%)" />
          </linearGradient>
        </defs>
        <path d="M 24 8 L 8 20 L 8 40 L 20 40 L 20 28 L 28 28 L 28 40 L 40 40 L 40 20 Z" fill="url(#logoGradient)" />
        <polygon points="24,4 4,20 8,20 24,8 40,20 44,20" fill="hsl(40, 85%, 60%)" />
        <rect x="22" y="32" width="4" height="8" fill="hsl(40, 85%, 60%)" />
      </svg>
    );
  }

  if (variant === 'text-only') {
    return (
      <h1 className={`font-bold tracking-tight leading-none ${className}`}>
        <span style={{ 
          background: 'linear-gradient(135deg, hsl(215, 45%, 25%), hsl(215, 45%, 35%))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontWeight: 800,
          letterSpacing: '-0.02em'
        }}>
          Storea
        </span>
        <span style={{ 
          background: 'linear-gradient(135deg, hsl(40, 85%, 60%), hsl(45, 90%, 70%))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontWeight: 300,
          letterSpacing: '0.05em'
        }}>
          lite
        </span>
      </h1>
    );
  }

  // Full variant with animation
  return (
    <div className={`relative w-full py-8 ${className}`}>
      {showAnimation && (
        <svg viewBox="0 0 400 300" className="w-full h-auto">
          <defs>
            <linearGradient id="houseGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(215, 45%, 25%)" />
              <stop offset="100%" stopColor="hsl(215, 45%, 35%)" />
            </linearGradient>
            <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(40, 85%, 60%)" />
              <stop offset="100%" stopColor="hsl(45, 90%, 70%)" />
            </linearGradient>
          </defs>

          {/* Stage 1: Architect brings the blueprint */}
          <g className="animate-stakeholder-enter delay-100">
            <circle cx="50" cy="220" r="18" fill="hsl(215, 45%, 25%)" />
            <text x="50" y="225" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">A</text>
            <text x="50" y="255" textAnchor="middle" fill="hsl(215, 25%, 15%)" fontSize="11" fontWeight="600">Architect</text>
            <rect x="30" y="190" width="40" height="25" fill="hsl(215, 80%, 95%)" stroke="hsl(215, 45%, 25%)" strokeWidth="2" rx="2" />
            <line x1="35" y1="195" x2="65" y2="195" stroke="hsl(215, 45%, 45%)" strokeWidth="1" />
            <line x1="35" y1="200" x2="60" y2="200" stroke="hsl(215, 45%, 45%)" strokeWidth="1" />
            <line x1="35" y1="205" x2="65" y2="205" stroke="hsl(215, 45%, 45%)" strokeWidth="1" />
          </g>

          {/* Stage 2: Builder joins */}
          <g className="animate-stakeholder-enter delay-200">
            <circle cx="120" cy="220" r="18" fill="hsl(145, 60%, 45%)" />
            <text x="120" y="225" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">B</text>
            <text x="120" y="255" textAnchor="middle" fill="hsl(215, 25%, 15%)" fontSize="11" fontWeight="600">Builder</text>
            <g transform="translate(110, 185)">
              <rect x="0" y="0" width="5" height="20" fill="hsl(40, 85%, 60%)" />
              <polygon points="0,0 5,0 2.5,-8" fill="hsl(40, 85%, 60%)" />
            </g>
          </g>

          {/* Stage 3: Contractor arrives */}
          <g className="animate-stakeholder-enter delay-300">
            <circle cx="280" cy="220" r="18" fill="hsl(40, 85%, 60%)" />
            <text x="280" y="225" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">C</text>
            <text x="280" y="255" textAnchor="middle" fill="hsl(215, 25%, 15%)" fontSize="11" fontWeight="600">Contractor</text>
            <path d="M 270 200 Q 280 195 290 200 L 292 205 L 268 205 Z" fill="hsl(40, 85%, 60%)" stroke="hsl(40, 85%, 50%)" strokeWidth="1" />
          </g>

          {/* Stage 4: Homeowner joins */}
          <g className="animate-stakeholder-enter delay-400">
            <circle cx="350" cy="220" r="18" fill="hsl(265, 55%, 50%)" />
            <text x="350" y="225" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold">H</text>
            <text x="350" y="255" textAnchor="middle" fill="hsl(215, 25%, 15%)" fontSize="11" fontWeight="600">Homeowner</text>
          </g>

          {/* Center: House construction */}
          <g transform="translate(150, 60)">
            <rect className="animate-team-collaborate delay-100" x="0" y="100" width="100" height="8" fill="hsl(215, 20%, 60%)" />
            
            <g className="animate-house-construct delay-200" style={{ transformOrigin: 'center bottom' }}>
              <rect x="5" y="60" width="90" height="40" fill="hsl(215, 25%, 95%)" stroke="url(#houseGradient)" strokeWidth="2" />
              <rect x="15" y="70" width="15" height="15" fill="hsl(215, 80%, 85%)" stroke="hsl(215, 45%, 25%)" strokeWidth="1" />
              <rect x="70" y="70" width="15" height="15" fill="hsl(215, 80%, 85%)" stroke="hsl(215, 45%, 25%)" strokeWidth="1" />
              <rect x="42" y="80" width="16" height="20" fill="url(#accentGradient)" stroke="hsl(215, 45%, 25%)" strokeWidth="1" />
              <circle cx="54" cy="90" r="1.5" fill="hsl(215, 45%, 25%)" />
            </g>
            
            <g className="animate-team-collaborate delay-300">
              <polygon points="0,60 50,30 100,60" fill="url(#houseGradient)" />
              <polygon points="50,30 100,60 95,62 50,35" fill="hsl(215, 45%, 20%)" opacity="0.3" />
              <rect x="70" y="35" width="8" height="15" fill="hsl(215, 35%, 35%)" />
              <rect x="68" y="33" width="12" height="3" fill="hsl(215, 35%, 30%)" />
            </g>
          </g>

          {/* Collaboration lines */}
          <g className="animate-blueprint-draw delay-400" style={{ strokeDasharray: 1000, strokeDashoffset: 0 }}>
            <path d="M 50 220 Q 100 180 150 160" stroke="hsl(215, 45%, 25%)" strokeWidth="1.5" fill="none" strokeDasharray="4,4" opacity="0.4" />
            <path d="M 120 220 Q 150 180 170 150" stroke="hsl(145, 60%, 45%)" strokeWidth="1.5" fill="none" strokeDasharray="4,4" opacity="0.4" />
            <path d="M 280 220 Q 250 180 220 150" stroke="hsl(40, 85%, 60%)" strokeWidth="1.5" fill="none" strokeDasharray="4,4" opacity="0.4" />
            <path d="M 350 220 Q 300 180 270 160" stroke="hsl(265, 55%, 50%)" strokeWidth="1.5" fill="none" strokeDasharray="4,4" opacity="0.4" />
          </g>

          {/* Completion checkmark */}
          <g className="animate-project-complete delay-[3s]" transform="translate(180, 40)">
            <circle cx="20" cy="20" r="25" fill="hsl(145, 60%, 45%)" opacity="0.9" />
            <path className="animate-checkmark delay-[3.2s]" d="M 10 20 L 17 27 L 32 12" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: 100, strokeDashoffset: 0 }} />
          </g>
        </svg>
      )}
      
      {/* Logo */}
      <div className="mt-8 text-center animate-[fadeIn_0.8s_ease-out_3.4s_both]">
        <div className="flex items-center justify-center gap-3 mb-2">
          <svg width="48" height="48" viewBox="0 0 48 48" className="flex-shrink-0">
            <defs>
              <linearGradient id="mainLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(215, 45%, 25%)" />
                <stop offset="100%" stopColor="hsl(40, 85%, 60%)" />
              </linearGradient>
            </defs>
            <path d="M 24 8 L 8 20 L 8 40 L 20 40 L 20 28 L 28 28 L 28 40 L 40 40 L 40 20 Z" fill="url(#mainLogoGradient)" />
            <polygon points="24,4 4,20 8,20 24,8 40,20 44,20" fill="hsl(40, 85%, 60%)" />
            <rect x="22" y="32" width="4" height="8" fill="hsl(40, 85%, 60%)" />
          </svg>
          
          <h1 className="text-5xl font-bold tracking-tight leading-none">
            <span style={{ 
              background: 'linear-gradient(135deg, hsl(215, 45%, 25%), hsl(215, 45%, 35%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: 800,
              letterSpacing: '-0.02em'
            }}>
              Storea
            </span>
            <span style={{ 
              background: 'linear-gradient(135deg, hsl(40, 85%, 60%), hsl(45, 90%, 70%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: 300,
              letterSpacing: '0.05em'
            }}>
              lite
            </span>
          </h1>
        </div>
        <p className="text-sm text-muted-foreground font-medium tracking-wide">
          Building Projects Together
        </p>
      </div>
    </div>
  );
};
