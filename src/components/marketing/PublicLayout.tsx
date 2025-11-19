import { ReactNode } from 'react';
import { NavBar } from './NavBar';
import { Footer } from './Footer';

interface PublicLayoutProps {
  children: ReactNode;
  centered?: boolean;
}

export const PublicLayout = ({ children, centered = false }: PublicLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <NavBar />
      <main className={`flex-1 ${centered ? 'flex items-center justify-center' : 'overflow-y-auto'}`}>
        {children}
      </main>
      <Footer />
    </div>
  );
};
