import { PublicLayout } from '@/components/marketing/PublicLayout';
import StorageAnimation from '@/components/marketing/StorageAnimation';
import { usePageMeta } from '@/hooks/usePageMeta';

const Home = () => {
  usePageMeta({
    title: 'STOREA – Modern Construction Project Management',
    description: 'Streamline your construction projects with STOREA. Plan, organize, and deliver on time effortlessly.',
    canonicalPath: '/'
  });

  return (
    <PublicLayout>
      <StorageAnimation />
    </PublicLayout>
  );
};

export default Home;
