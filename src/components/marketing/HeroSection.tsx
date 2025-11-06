import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useEffect, useRef } from 'react';

export const HeroSection = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTimeUpdate = () => {
      if (v.currentTime >= 45) v.currentTime = 0;
    };
    const onCanPlay = () => {
      const p = v.play?.();
      if (p && typeof (p as any).catch === 'function') {
        (p as Promise<void>).catch(() => {});
      }
    };
    v.addEventListener('timeupdate', onTimeUpdate);
    v.addEventListener('canplay', onCanPlay);
    return () => {
      v.removeEventListener('timeupdate', onTimeUpdate);
      v.removeEventListener('canplay', onCanPlay);
    };
  }, []);

  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
          Construction Management Simplified
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Streamline your projects, collaborate with teams, and deliver on time with our all-in-one platform.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to="/auth">
            <Button size="lg" className="text-lg px-8 gap-2">
              Get Started Free <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <Link to="/features">
            <Button size="lg" variant="outline" className="text-lg px-8">
              Explore Features
            </Button>
          </Link>
        </div>

        <div className="mt-16 rounded-2xl border border-border bg-card p-2 shadow-glow">
          <div className="aspect-video rounded-xl overflow-hidden bg-muted">
            <video 
              ref={videoRef}
              className="h-full w-full object-cover"
              autoPlay 
              muted 
              playsInline
              preload="metadata"
              poster="/storeali-favicon.png"
              onError={() => console.warn('Hero video failed to load')}
            >
              <source src="/demo-video.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </div>
    </section>
  );
};
