// Professional Storealite Logo Component with Collaborative Animation

interface StorealiteLogoProps {
  variant?: 'full' | 'text-only' | 'icon-only';
  showAnimation?: boolean;
  className?: string;
}

export const StorealiteLogo = ({ 
  variant = 'text-only', 
  showAnimation = false,
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

  // Full variant with animation showing people working on house construction
  return (
    <div className={`relative w-full py-8 ${className}`}>
      {showAnimation && (
        <svg viewBox="0 0 500 350" className="w-full h-auto">
          <defs>
            <linearGradient id="houseGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(215, 45%, 25%)" />
              <stop offset="100%" stopColor="hsl(215, 45%, 35%)" />
            </linearGradient>
            <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(215, 80%, 95%)" />
              <stop offset="100%" stopColor="hsl(215, 60%, 85%)" />
            </linearGradient>
          </defs>

          {/* Sky background */}
          <rect x="0" y="0" width="500" height="300" fill="url(#skyGradient)" />
          
          {/* Ground */}
          <rect x="0" y="280" width="500" height="70" fill="hsl(145, 40%, 65%)" />
          <rect x="0" y="270" width="500" height="10" fill="hsl(40, 60%, 70%)" />

          {/* Stage 1: Foundation being laid (0-1s) */}
          <g className="animate-team-collaborate delay-100">
            {/* Foundation */}
            <rect x="150" y="250" width="200" height="20" fill="hsl(215, 20%, 50%)" stroke="hsl(215, 30%, 40%)" strokeWidth="2" />
            
            {/* Builder laying foundation */}
            <g transform="translate(130, 220)">
              {/* Body */}
              <rect x="0" y="20" width="25" height="30" fill="hsl(145, 60%, 45%)" rx="3" />
              {/* Head */}
              <circle cx="12.5" cy="12" r="8" fill="hsl(30, 50%, 70%)" />
              {/* Hard hat */}
              <ellipse cx="12.5" cy="8" rx="10" ry="5" fill="hsl(40, 85%, 60%)" />
              {/* Arms working */}
              <rect x="-5" y="25" width="8" height="20" fill="hsl(145, 60%, 45%)" rx="3" transform="rotate(-20 -1 35)" />
              <rect x="22" y="25" width="8" height="20" fill="hsl(145, 60%, 45%)" rx="3" transform="rotate(20 26 35)" />
              {/* Legs */}
              <rect x="5" y="50" width="7" height="20" fill="hsl(215, 40%, 30%)" />
              <rect x="13" y="50" width="7" height="20" fill="hsl(215, 40%, 30%)" />
            </g>
          </g>

          {/* Stage 2: Architect with plans (0.3s) */}
          <g className="animate-stakeholder-enter delay-200">
            <g transform="translate(80, 230)">
              {/* Body - professional suit */}
              <rect x="0" y="20" width="25" height="30" fill="hsl(215, 45%, 25%)" rx="3" />
              {/* Head */}
              <circle cx="12.5" cy="12" r="8" fill="hsl(30, 50%, 70%)" />
              {/* Holding blueprints */}
              <rect x="28" y="20" width="30" height="20" fill="hsl(215, 80%, 95%)" stroke="hsl(215, 45%, 25%)" strokeWidth="1.5" rx="1" />
              <line x1="32" y1="25" x2="54" y2="25" stroke="hsl(215, 45%, 45%)" strokeWidth="1" />
              <line x1="32" y1="30" x2="50" y2="30" stroke="hsl(215, 45%, 45%)" strokeWidth="1" />
              <line x1="32" y1="35" x2="54" y2="35" stroke="hsl(215, 45%, 45%)" strokeWidth="1" />
              {/* Legs */}
              <rect x="5" y="50" width="7" height="20" fill="hsl(215, 40%, 30%)" />
              <rect x="13" y="50" width="7" height="20" fill="hsl(215, 40%, 30%)" />
            </g>
          </g>

          {/* Stage 3: Walls being built (1s) */}
          <g className="animate-house-construct delay-300">
            {/* Walls */}
            <rect x="160" y="200" width="180" height="50" fill="hsl(215, 25%, 92%)" stroke="url(#houseGradient)" strokeWidth="3" />
            
            {/* Contractor building walls */}
            <g transform="translate(200, 170)">
              {/* Body */}
              <rect x="0" y="20" width="25" height="30" fill="hsl(40, 80%, 55%)" rx="3" />
              {/* Head */}
              <circle cx="12.5" cy="12" r="8" fill="hsl(30, 50%, 70%)" />
              {/* Hard hat */}
              <ellipse cx="12.5" cy="8" rx="10" ry="5" fill="hsl(40, 85%, 60%)" />
              {/* Tool in hand */}
              <rect x="25" y="30" width="15" height="4" fill="hsl(215, 40%, 30%)" />
              {/* Legs */}
              <rect x="5" y="50" width="7" height="20" fill="hsl(215, 40%, 30%)" />
              <rect x="13" y="50" width="7" height="20" fill="hsl(215, 40%, 30%)" />
            </g>
          </g>

          {/* Stage 4: Roof installation (1.5s) */}
          <g className="animate-team-collaborate delay-400">
            {/* Roof */}
            <polygon points="150,200 250,140 350,200" fill="url(#houseGradient)" />
            <polygon points="250,140 350,200 345,202 250,145" fill="hsl(215, 45%, 20%)" opacity="0.3" />
            
            {/* Roofer on ladder */}
            <g transform="translate(240, 130)">
              {/* Ladder */}
              <line x1="0" y1="0" x2="0" y2="70" stroke="hsl(40, 60%, 60%)" strokeWidth="3" />
              <line x1="15" y1="0" x2="15" y2="70" stroke="hsl(40, 60%, 60%)" strokeWidth="3" />
              <line x1="0" y1="10" x2="15" y2="10" stroke="hsl(40, 60%, 60%)" strokeWidth="2" />
              <line x1="0" y1="25" x2="15" y2="25" stroke="hsl(40, 60%, 60%)" strokeWidth="2" />
              <line x1="0" y1="40" x2="15" y2="40" stroke="hsl(40, 60%, 60%)" strokeWidth="2" />
              <line x1="0" y1="55" x2="15" y2="55" stroke="hsl(40, 60%, 60%)" strokeWidth="2" />
              
              {/* Roofer climbing */}
              <g transform="translate(-5, 20)">
                <rect x="0" y="20" width="25" height="30" fill="hsl(40, 80%, 55%)" rx="3" />
                <circle cx="12.5" cy="12" r="8" fill="hsl(30, 50%, 70%)" />
                <ellipse cx="12.5" cy="8" rx="10" ry="5" fill="hsl(40, 85%, 60%)" />
                <rect x="5" y="50" width="7" height="15" fill="hsl(215, 40%, 30%)" />
                <rect x="13" y="50" width="7" height="15" fill="hsl(215, 40%, 30%)" />
              </g>
            </g>
            
            {/* Chimney */}
            <rect x="310" y="160" width="15" height="30" fill="hsl(0, 40%, 45%)" />
            <rect x="307" y="157" width="21" height="5" fill="hsl(0, 35%, 40%)" />
          </g>

          {/* Stage 5: Windows and doors (2s) */}
          <g className="animate-team-collaborate delay-[500ms]">
            {/* Windows */}
            <rect x="180" y="215" width="25" height="25" fill="hsl(215, 80%, 85%)" stroke="hsl(215, 45%, 25%)" strokeWidth="2" />
            <line x1="192.5" y1="215" x2="192.5" y2="240" stroke="hsl(215, 45%, 25%)" strokeWidth="1.5" />
            <line x1="180" y1="227.5" x2="205" y2="227.5" stroke="hsl(215, 45%, 25%)" strokeWidth="1.5" />
            
            <rect x="295" y="215" width="25" height="25" fill="hsl(215, 80%, 85%)" stroke="hsl(215, 45%, 25%)" strokeWidth="2" />
            <line x1="307.5" y1="215" x2="307.5" y2="240" stroke="hsl(215, 45%, 25%)" strokeWidth="1.5" />
            <line x1="295" y1="227.5" x2="320" y2="227.5" stroke="hsl(215, 45%, 25%)" strokeWidth="1.5" />
            
            {/* Door */}
            <rect x="235" y="220" width="30" height="50" fill="hsl(40, 85%, 60%)" stroke="hsl(215, 45%, 25%)" strokeWidth="2" />
            <circle cx="258" cy="245" r="2" fill="hsl(215, 45%, 25%)" />
          </g>

          {/* Stage 6: Homeowner inspecting (2.5s) */}
          <g className="animate-stakeholder-enter delay-[600ms]">
            <g transform="translate(380, 230)">
              {/* Body - casual clothes */}
              <rect x="0" y="20" width="25" height="30" fill="hsl(265, 55%, 50%)" rx="3" />
              {/* Head */}
              <circle cx="12.5" cy="12" r="8" fill="hsl(30, 50%, 70%)" />
              {/* Arms gesturing approval */}
              <rect x="-5" y="25" width="8" height="20" fill="hsl(265, 55%, 50%)" rx="3" transform="rotate(-45 -1 35)" />
              <rect x="22" y="25" width="8" height="20" fill="hsl(265, 55%, 50%)" rx="3" transform="rotate(45 26 35)" />
              {/* Legs */}
              <rect x="5" y="50" width="7" height="20" fill="hsl(215, 40%, 30%)" />
              <rect x="13" y="50" width="7" height="20" fill="hsl(215, 40%, 30%)" />
            </g>
          </g>

          {/* Landscaping details */}
          <g className="animate-team-collaborate delay-[700ms]">
            <ellipse cx="130" cy="275" rx="20" ry="8" fill="hsl(145, 50%, 50%)" />
            <ellipse cx="370" cy="275" rx="25" ry="10" fill="hsl(145, 50%, 50%)" />
          </g>

          {/* Success checkmark (3s) */}
          <g className="animate-project-complete delay-[3s]">
            <circle cx="250" cy="100" r="30" fill="hsl(145, 60%, 45%)" opacity="0.95" />
            <path className="animate-checkmark delay-[3.2s]" d="M 235 100 L 245 110 L 265 85" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: 100, strokeDashoffset: 0 }} />
          </g>
        </svg>
      )}
      
      {/* Logo - Text only, no house icon */}
      <div className="mt-8 text-center animate-[fadeIn_0.8s_ease-out_3.4s_both]">
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
    </div>
  );
};
