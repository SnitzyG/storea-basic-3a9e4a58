import { PublicLayout } from '@/components/marketing/PublicLayout';
import { HeroSection } from '@/components/marketing/HeroSection';
import { usePageMeta } from '@/hooks/usePageMeta';

const Home = () => {
  usePageMeta({
    title: 'STOREA – Modern Construction Project Management',
    description: 'Streamline your construction projects with STOREA. Plan, organize, and deliver on time effortlessly.',
    canonicalPath: '/',
    imageUrl: '/og-image.jpg'
  });

  return (
    <PublicLayout>
      <HeroSection />
    </PublicLayout>
  );
};

export default Home;
