import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export const useAnalytics = () => {
  const location = useLocation();

  useEffect(() => {
    // Track page views
    if (typeof window.gtag !== 'undefined') {
      window.gtag('config', 'GA_MEASUREMENT_ID', {
        page_path: location.pathname + location.search,
      });
    }
  }, [location]);

  const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', eventName, parameters);
    }
  };

  const trackConversion = (conversionLabel: string, value?: number) => {
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'conversion', {
        send_to: `AW-CONVERSION_ID/${conversionLabel}`,
        value: value || 0,
        currency: 'AUD',
      });
    }
  };

  return { trackEvent, trackConversion };
};
