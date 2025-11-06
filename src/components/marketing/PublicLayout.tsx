import { ReactNode } from 'react';
import { NavBar } from './NavBar';
import { Footer } from './Footer';

interface PublicLayoutProps {
  children: ReactNode;
}

export const PublicLayout = ({ children }: PublicLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
      <NavBar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
};
