import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, Shield } from 'lucide-react';
import { useState } from 'react';
import { useSafeAuth } from '@/hooks/useSafeAuth';
import { StorealiteLogo } from '@/components/ui/storealite-logo';

export const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAdmin } = useSafeAuth();
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <StorealiteLogo size="lg" />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/features" className="text-foreground/80 hover:text-foreground transition-colors">
              Features
            </Link>
            <Link to="/pricing" className="text-foreground/80 hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link to="/about" className="text-foreground/80 hover:text-foreground transition-colors">
              About
            </Link>
            <Link to="/contact" className="text-foreground/80 hover:text-foreground transition-colors">
              Contact
            </Link>
            {isAdmin && (
              <Link to="/admin/dashboard" className="flex items-center gap-1.5 text-foreground/80 hover:text-foreground transition-colors">
                <Shield className="h-4 w-4" />
                <span>Admin</span>
              </Link>
            )}
            <div className="flex items-center gap-3">
              <Link to="/dashboard">
                <Button>Dashboard</Button>
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-3">
            <Link to="/features" className="block py-2 text-foreground/80 hover:text-foreground transition-colors" onClick={() => setIsOpen(false)}>
              Features
            </Link>
            <Link to="/pricing" className="block py-2 text-foreground/80 hover:text-foreground transition-colors" onClick={() => setIsOpen(false)}>
              Pricing
            </Link>
            <Link to="/about" className="block py-2 text-foreground/80 hover:text-foreground transition-colors" onClick={() => setIsOpen(false)}>
              About
            </Link>
            <Link to="/contact" className="block py-2 text-foreground/80 hover:text-foreground transition-colors" onClick={() => setIsOpen(false)}>
              Contact
            </Link>
            {isAdmin && (
              <Link to="/admin/dashboard" className="flex items-center gap-1.5 py-2 text-foreground/80 hover:text-foreground transition-colors" onClick={() => setIsOpen(false)}>
                <Shield className="h-4 w-4" />
                <span>Admin</span>
              </Link>
            )}
            <div className="pt-3 space-y-2">
              <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                <Button className="w-full">Dashboard</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
