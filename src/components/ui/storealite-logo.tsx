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
    color: 'hsl(var(--primary))',
    fontWeight: 900,
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
    fontFamily: 'Roboto, system-ui, sans-serif'
  };
  if (variant === 'icon-only') {
    return <Link to="/" className={`inline-flex items-center justify-center`} aria-label="STOREA home">
        <img src="/storea-logo.png" alt="STOREA logo" className={className || 'h-8 w-auto'} loading="eager" />
      </Link>;
  }
  return <Link to="/" className="inline-block" aria-label="STOREA home">
      
    </Link>;
};