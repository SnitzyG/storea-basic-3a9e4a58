import StorageAnimation from './StorageAnimation';

export const HeroSection = () => {
  return (
    <section className="w-full h-[calc(100vh-4rem)] flex items-center justify-center" aria-labelledby="hero-heading">
      <h1 id="hero-heading" className="sr-only">STOREA - Construction Document Management</h1>
      <StorageAnimation />
    </section>
  );
};
