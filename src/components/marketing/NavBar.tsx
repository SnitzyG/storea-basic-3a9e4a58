import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
export const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    user
  } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      try {
        const {
          data
        } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin'
        });
        setIsAdmin(Boolean(data));
      } catch (error) {
        console.error('Error checking admin:', error);
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, [user]);
  return <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="text-2xl font-black uppercase tracking-wide text-primary">
              STOREA
            </div>
          </Link>

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
            {isAdmin && <Link to="/admin/dashboard" className="flex items-center gap-1.5 text-foreground/80 hover:text-foreground transition-colors">
                <Shield className="h-4 w-4" />
                <span>Admin</span>
              </Link>}
            <div className="flex items-center gap-3">
              <Link to="/auth">
                <Button variant="outline">Login</Button>
              </Link>
              <Link to="/auth">
                <Button>Sign Up</Button>
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && <div className="md:hidden py-4 space-y-3">
            
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
            {isAdmin && <Link to="/admin/dashboard" className="flex items-center gap-1.5 py-2 text-foreground/80 hover:text-foreground transition-colors" onClick={() => setIsOpen(false)}>
                <Shield className="h-4 w-4" />
                <span>Admin</span>
              </Link>}
            <div className="pt-3 space-y-2">
              <Link to="/auth" onClick={() => setIsOpen(false)}>
                <Button variant="outline" className="w-full">Login</Button>
              </Link>
              <Link to="/auth" onClick={() => setIsOpen(false)}>
                <Button className="w-full">Sign Up</Button>
              </Link>
            </div>
          </div>}
      </div>
    </nav>;
};