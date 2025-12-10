import { PublicLayout } from '@/components/marketing/PublicLayout';
import { HeroSection } from '@/components/marketing/HeroSection';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useEffect } from 'react';

const Home = () => {
  useEffect(() => {
    console.log('🏠 STOREA: Home page mounted');
  }, []);

  usePageMeta({
    title: 'STOREA – Modern Construction Project Management',
    description: 'Streamline your construction projects with STOREA. Plan, organize, and deliver on time effortlessly.',
    canonicalPath: '/',
    imageUrl: '/og-image.jpg'
  });

  console.log('🏠 STOREA: Home page rendering');

  return (
    <PublicLayout>
      <HeroSection />
    </PublicLayout>
  );
};

export default Home;
