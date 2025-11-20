import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Google Ads Conversion ID - Replace with your actual ID or leave empty to disable conversion tracking
const GOOGLE_ADS_CONVERSION_ID = '';

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
      window.gtag('config', 'G-8EBGY1HGEE', {
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
    // Only track conversions if Google Ads ID is configured
    if (!GOOGLE_ADS_CONVERSION_ID) {
      return;
    }
    
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'conversion', {
        send_to: `${GOOGLE_ADS_CONVERSION_ID}/${conversionLabel}`,
        value: value || 0,
        currency: 'AUD',
      });
    }
  };

  const trackSignup = (method: 'email' | 'google') => {
    trackEvent('sign_up', { method });
    trackConversion('signup_complete', 0);
  };

  const trackContactForm = () => {
    trackEvent('contact_form_submit');
    trackConversion('contact_form', 0);
  };

  const trackPricingSelection = (plan: string, isYearly: boolean) => {
    trackEvent('pricing_plan_selected', { 
      plan, 
      billing: isYearly ? 'yearly' : 'monthly' 
    });
  };

  const trackFeatureView = (featureName: string) => {
    trackEvent('feature_viewed', { feature: featureName });
  };

  const trackDownload = (fileName: string) => {
    trackEvent('file_download', { file: fileName });
  };

  const trackScrollDepth = (depth: number) => {
    trackEvent('scroll_depth', { depth });
  };

  return { 
    trackEvent, 
    trackConversion,
    trackSignup,
    trackContactForm,
    trackPricingSelection,
    trackFeatureView,
    trackDownload,
    trackScrollDepth
  };
};
