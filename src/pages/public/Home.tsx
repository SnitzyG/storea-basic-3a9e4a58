import { PublicLayout } from '@/components/marketing/PublicLayout';
import StorageAnimation from '@/components/marketing/StorageAnimation';
import { usePageMeta } from '@/hooks/usePageMeta';
import { StorealiteLogo } from '@/components/ui/storealite-logo';
const Home = () => {
  usePageMeta({
    title: 'STOREA – Modern Construction Project Management',
    description: 'Streamline your construction projects with STOREA. Plan, organize, and deliver on time effortlessly.',
    canonicalPath: '/'
  });

  return (
    <PublicLayout>
      <div className="fixed top-3 right-4 z-50">
        <StorealiteLogo variant="icon-only" className="h-10 w-auto" />
      </div>
      <StorageAnimation />
    </PublicLayout>
  );
};

export default Home;
