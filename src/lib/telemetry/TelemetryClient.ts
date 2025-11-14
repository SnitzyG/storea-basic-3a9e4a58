import { supabase } from '@/integrations/supabase/client';

class TelemetryClient {
  private sessionId: string;
  private userId: string | null = null;
  private initialized: boolean = false;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.initializeUser();
  }

  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('telemetry_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('telemetry_session_id', sessionId);
      this.trackSessionStart();
    }
    return sessionId;
  }

  private async initializeUser() {
    const { data } = await supabase.auth.getUser();
    this.userId = data.user?.id || null;
    this.initialized = true;
  }

  private async ensureInitialized() {
    if (!this.initialized) {
      await this.initializeUser();
    }
  }

  // Track page views
  async trackPageView(url: string) {
    await this.ensureInitialized();
    await this.trackEvent({
      eventType: 'page_view',
      eventCategory: 'navigation',
      eventName: `view_${this.getPageName(url)}`,
      pageUrl: url,
      referrerUrl: document.referrer,
    });
  }

  // Track user interactions
  async trackClick(elementName: string, elementType: string, properties?: Record<string, any>) {
    await this.ensureInitialized();
    await this.trackEvent({
      eventType: 'button_click',
      eventCategory: 'interaction',
      eventName: elementName,
      eventProperties: { elementType, ...properties },
    });
  }

  // Track form submissions
  async trackFormSubmit(formName: string, success: boolean, properties?: Record<string, any>) {
    await this.ensureInitialized();
    await this.trackEvent({
      eventType: 'form_submit',
      eventCategory: 'interaction',
      eventName: formName,
      eventProperties: { success, ...properties },
    });
  }

  // Track data operations
  async trackDataOperation(operation: string, resource: string, success: boolean, metadata?: Record<string, any>) {
    await this.ensureInitialized();
    await this.trackEvent({
      eventType: operation as any,
      eventCategory: 'data_operation',
      eventName: `${operation}_${resource}`,
      eventProperties: { resource, success, ...metadata },
    });
  }

  // Track performance metrics
  async trackPerformance(
    metricType: 'page_load' | 'api_call' | 'database_query' | 'edge_function' | 'render_time' | 'network_latency',
    metricName: string,
    durationMs: number,
    status: 'success' | 'error' | 'timeout' = 'success',
    metadata?: Record<string, any>
  ) {
    await this.ensureInitialized();
    try {
      await supabase.from('telemetry_performance').insert({
        metric_type: metricType,
        metric_name: metricName,
        duration_ms: durationMs,
        status,
        metadata: metadata || {},
        user_id: this.userId,
        session_id: this.sessionId,
      });
    } catch (error) {
      console.error('Failed to track performance:', error);
    }
  }

  // Track errors
  async trackError(
    error: Error | string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    errorType: 'client_error' | 'api_error' | 'database_error' | 'auth_error' | 'network_error' | 'validation_error' = 'client_error',
    context?: Record<string, any>
  ) {
    await this.ensureInitialized();
    try {
      const errorMessage = typeof error === 'string' ? error : error.message;
      const errorStack = typeof error === 'string' ? undefined : error.stack;

      await supabase.from('telemetry_errors').insert({
        error_type: errorType,
        error_message: errorMessage,
        error_stack: errorStack,
        severity,
        context: context || {},
        user_id: this.userId,
        session_id: this.sessionId,
        page_url: window.location.href,
        user_agent: navigator.userAgent,
      });
    } catch (err) {
      console.error('Failed to track error:', err);
    }
  }

  // Private: Generic event tracking
  private async trackEvent(event: {
    eventType: 'page_view' | 'button_click' | 'form_submit' | 'download' | 'upload' | 'search' | 'navigation' | 'interaction';
    eventCategory: string;
    eventName: string;
    eventProperties?: Record<string, any>;
    pageUrl?: string;
    referrerUrl?: string;
  }) {
    try {
      await supabase.from('telemetry_events').insert({
        user_id: this.userId,
        session_id: this.sessionId,
        event_type: event.eventType,
        event_category: event.eventCategory,
        event_name: event.eventName,
        event_properties: event.eventProperties || {},
        page_url: event.pageUrl || window.location.href,
        referrer_url: event.referrerUrl || document.referrer,
        user_agent: navigator.userAgent,
      });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  private async trackSessionStart() {
    await this.ensureInitialized();
    try {
      await supabase.from('telemetry_sessions').insert({
        session_id: this.sessionId,
        user_id: this.userId,
        device_type: this.getDeviceType(),
        browser: this.getBrowser(),
        os: this.getOS(),
      });
    } catch (error) {
      console.error('Failed to track session start:', error);
    }
  }

  async endSession() {
    try {
      await supabase
        .from('telemetry_sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('session_id', this.sessionId);
      
      sessionStorage.removeItem('telemetry_session_id');
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }

  private getPageName(url: string): string {
    try {
      const path = new URL(url, window.location.origin).pathname;
      return path.replace(/\//g, '_').substring(1) || 'home';
    } catch {
      return 'unknown';
    }
  }

  private getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'tablet';
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return 'mobile';
    return 'desktop';
  }

  private getBrowser(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getOS(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Win')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'Unknown';
  }
}

// Singleton instance
export const telemetry = new TelemetryClient();

// Auto-end session on page unload
window.addEventListener('beforeunload', () => {
  telemetry.endSession();
});
