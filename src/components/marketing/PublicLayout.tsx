import { ReactNode } from 'react';
import { NavBar } from './NavBar';
import { Footer } from './Footer';

interface PublicLayoutProps {
  children: ReactNode;
}

export const PublicLayout = ({ children }: PublicLayoutProps) => {
  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      <NavBar />
      <main className="flex-1 flex items-center justify-center overflow-hidden">
        {children}
      </main>
      <Footer />
    </div>
  );
};
