# Analytics & SEO Setup Guide

## Google Analytics Setup

### 1. Create Google Analytics Account
1. Visit [Google Analytics](https://analytics.google.com/)
2. Create a new GA4 property for STOREA
3. Get your Measurement ID (format: G-XXXXXXXXXX)

### 2. Add Google Analytics to index.html
Add this code to the `<head>` section of `index.html`, replacing `GA_MEASUREMENT_ID` with your actual ID:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID', {
    send_page_view: false
  });
</script>
```

### 3. Use Analytics Hook in Your App
The `useAnalytics` hook is already created. Import and use it:

```tsx
import { useAnalytics } from '@/hooks/useAnalytics';

// In your component
const { trackEvent, trackConversion } = useAnalytics();

// Track custom events
trackEvent('cta_click', { location: 'hero', plan: 'free' });

// Track conversions
trackConversion('signup', 0);
```

### 4. Key Events to Track
- Sign up button clicks: `trackEvent('signup_click', { location: 'hero' })`
- Plan selection: `trackEvent('plan_selected', { plan: 'pro' })`
- Contact form submission: `trackEvent('contact_form_submit')`
- Feature exploration: `trackEvent('feature_clicked', { feature: 'rfis' })`
- Successful registration: `trackConversion('signup_complete', 0)`

## Google Search Console Setup

### 1. Verify Ownership
Your site already has the verification meta tag in `index.html`:
```html
<meta name="google-site-search-verification" content="google65241742a0f21977" />
```

The verification file is also in `public/google65241742a0f21977.html`

### 2. Submit Sitemap
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add property: `https://www.storea.com.au`
3. Go to Sitemaps section
4. Submit sitemap URL: `https://www.storea.com.au/sitemap.xml`

### 3. Monitor Performance
- Check Index Coverage to ensure pages are being indexed
- Monitor Search Performance for keywords and click-through rates
- Review Mobile Usability reports
- Check Core Web Vitals

## Google Ads Conversion Tracking

If using Google Ads:

1. Get your Conversion ID from Google Ads
2. Replace `AW-CONVERSION_ID` in `useAnalytics.ts` with your actual ID
3. Track conversions on key actions:

```tsx
// On successful signup
trackConversion('signup', 0);

// On pricing page visit
trackEvent('page_view', { page: 'pricing' });
```

## Key Performance Indicators

Monitor these metrics:
- **Organic Traffic**: Search Console → Performance
- **Bounce Rate**: GA4 → Engagement
- **Conversion Rate**: GA4 → Conversions
- **Core Web Vitals**: Search Console → Core Web Vitals
- **Mobile Usability**: Search Console → Mobile Usability

## SEO Checklist

✅ Meta tags (title, description, OG, Twitter)
✅ Structured data (JSON-LD for Organization, FAQ, etc.)
✅ Sitemap.xml submitted
✅ Robots.txt configured
✅ Mobile-friendly viewport
✅ Semantic HTML
✅ Image alt attributes
✅ Internal linking structure
✅ HTTPS enabled
✅ Canonical URLs
✅ Fast loading (lazy loading, code splitting)
✅ Social media preview images

## Next Steps

1. Replace `GA_MEASUREMENT_ID` in the analytics script
2. Verify Google Search Console ownership
3. Submit sitemap to Search Console
4. Set up goal tracking in GA4
5. Monitor performance weekly
6. Optimize based on data insights
