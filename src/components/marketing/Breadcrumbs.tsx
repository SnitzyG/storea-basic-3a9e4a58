import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path: string;
}

const pathToLabel: Record<string, string> = {
  '/features': 'Features',
  '/pricing': 'Pricing',
  '/about': 'About',
  '/contact': 'Contact',
  '/privacy': 'Privacy Policy',
  '/terms': 'Terms & Conditions',
};

export const Breadcrumbs = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  useEffect(() => {
    // Add BreadcrumbList structured data
    const breadcrumbList = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://www.storea.com.au/"
        },
        ...pathSegments.map((segment, index) => {
          const path = '/' + pathSegments.slice(0, index + 1).join('/');
          return {
            "@type": "ListItem",
            "position": index + 2,
            "name": pathToLabel[path] || segment,
            "item": `https://www.storea.com.au${path}`
          };
        })
      ]
    };

    let script = document.querySelector('script[data-breadcrumb-schema]');
    if (!script) {
      script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('data-breadcrumb-schema', 'true');
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(breadcrumbList);

    return () => {
      const existingScript = document.querySelector('script[data-breadcrumb-schema]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [location.pathname]);

  if (pathSegments.length === 0) {
    return null; // Don't show breadcrumbs on homepage
  }

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', path: '/' },
    ...pathSegments.map((segment, index) => {
      const path = '/' + pathSegments.slice(0, index + 1).join('/');
      return {
        label: pathToLabel[path] || segment,
        path
      };
    })
  ];

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-2 text-sm text-muted-foreground">
        {breadcrumbs.map((crumb, index) => (
          <li key={crumb.path} className="flex items-center gap-2">
            {index > 0 && <ChevronRight className="h-4 w-4" />}
            {index === breadcrumbs.length - 1 ? (
              <span className="text-foreground font-medium flex items-center gap-1">
                {index === 0 && <Home className="h-4 w-4" />}
                {crumb.label}
              </span>
            ) : (
              <Link 
                to={crumb.path} 
                className="hover:text-foreground transition-colors flex items-center gap-1"
              >
                {index === 0 && <Home className="h-4 w-4" />}
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};
