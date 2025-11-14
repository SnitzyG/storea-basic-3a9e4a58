import { supabase } from '@/integrations/supabase/client';
import crypto from 'crypto-js';

interface ErrorContext {
  user_id?: string;
  url?: string;
  userAgent?: string;
  tags?: Record<string, string>;
  extra?: Record<string, any>;
}

interface Breadcrumb {
  category: 'navigation' | 'click' | 'api' | 'console' | 'custom';
  message: string;
  data?: Record<string, any>;
  level?: 'debug' | 'info' | 'warning' | 'error';
}

interface PerformanceMetric {
  metric_name: string;
  metric_value: number;
  endpoint?: string;
  operation_type?: string;
}

class TelemetrySDK {
  private breadcrumbs: Breadcrumb[] = [];
  private maxBreadcrumbs = 100;
  private releaseVersion: string = '1.0.0';
  private environment: string = 'production';
  private userId?: string;

  constructor() {
    this.init();
  }

  private init() {
    // Detect environment
    this.environment = window.location.hostname === 'localhost' ? 'development' : 'production';
    
    // Get version from package.json or env
    this.releaseVersion = import.meta.env.VITE_APP_VERSION || '1.0.0';

    // Auto-capture browser errors
    window.addEventListener('error', (event) => {
      this.captureError(event.error, {
        url: window.location.href,
        userAgent: navigator.userAgent,
      });
    });

    // Auto-capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(new Error(event.reason), {
        url: window.location.href,
        userAgent: navigator.userAgent,
      });
    });

    // Auto-capture navigation breadcrumbs
    this.setupNavigationTracking();
    
    // Auto-capture console logs
    this.setupConsoleTracking();
  }

  private setupNavigationTracking() {
    let lastPath = window.location.pathname;
    
    const checkNavigation = () => {
      const currentPath = window.location.pathname;
      if (currentPath !== lastPath) {
        this.recordBreadcrumb({
          category: 'navigation',
          message: `Navigated to ${currentPath}`,
          data: { from: lastPath, to: currentPath },
        });
        lastPath = currentPath;
      }
    };

    setInterval(checkNavigation, 500);
  }

  private setupConsoleTracking() {
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
    };

    console.error = (...args) => {
      this.recordBreadcrumb({
        category: 'console',
        message: args.join(' '),
        level: 'error',
      });
      originalConsole.error(...args);
    };

    console.warn = (...args) => {
      this.recordBreadcrumb({
        category: 'console',
        message: args.join(' '),
        level: 'warning',
      });
      originalConsole.warn(...args);
    };
  }

  setUser(userId: string) {
    this.userId = userId;
  }

  setRelease(version: string) {
    this.releaseVersion = version;
  }

  setEnvironment(env: string) {
    this.environment = env;
  }

  private generateFingerprint(error: Error): string {
    const normalized = this.normalizeStackTrace(error.stack || '');
    const message = error.message.replace(/\d+/g, 'N'); // Replace numbers
    const combined = `${error.name}:${message}:${normalized}`;
    return crypto.SHA256(combined).toString();
  }

  private normalizeStackTrace(stack: string): string {
    return stack
      .split('\n')
      .slice(0, 3) // Only first 3 lines
      .map(line => line.replace(/:d+:\d+/g, ':N:N')) // Remove line/col numbers
      .join('\n');
  }

  private getBrowserInfo() {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';

    return browser;
  }

  private getOSInfo() {
    const ua = navigator.userAgent;
    let os = 'Unknown';
    
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iOS')) os = 'iOS';

    return os;
  }

  private getDeviceType(): string {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  async captureError(error: Error, context: ErrorContext = {}) {
    const fingerprint = this.generateFingerprint(error);

    try {
      // Insert error
      const { data: errorData, error: insertError } = await supabase
        .from('telemetry_errors')
        .insert({
          error_type: error.name,
          error_message: error.message,
          error_stack: error.stack || '',
          issue_fingerprint: fingerprint,
          environment: this.environment,
          release_version: this.releaseVersion,
          user_affected: this.userId || context.user_id,
          browser: this.getBrowserInfo(),
          os: this.getOSInfo(),
          device_type: this.getDeviceType(),
          url: context.url || window.location.href,
          severity: this.determineSeverity(error),
          context: {
            tags: context.tags,
            extra: context.extra,
            userAgent: context.userAgent || navigator.userAgent,
          },
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Insert breadcrumbs
      if (errorData && this.breadcrumbs.length > 0) {
        await supabase.from('error_breadcrumbs').insert(
          this.breadcrumbs.map(bc => ({
            error_id: errorData.id,
            category: bc.category,
            message: bc.message,
            data: bc.data || {},
            level: bc.level || 'info',
          }))
        );
      }

      // Update or create issue group
      await this.updateIssueGroup(fingerprint, error, errorData?.id);

      // Check alert rules
      await this.checkAlertRules();

    } catch (err) {
      console.error('Failed to capture error:', err);
    }
  }

  private async updateIssueGroup(fingerprint: string, error: Error, errorId?: string) {
    const { data: existing } = await supabase
      .from('issue_groups')
      .select('*')
      .eq('fingerprint', fingerprint)
      .single();

    if (existing) {
      await supabase
        .from('issue_groups')
        .update({
          last_seen: new Date().toISOString(),
          occurrence_count: existing.occurrence_count + 1,
        })
        .eq('id', existing.id);

      if (errorId) {
        await supabase
          .from('telemetry_errors')
          .update({ issue_group_id: existing.id })
          .eq('id', errorId);
      }
    } else {
      const { data: newGroup } = await supabase
        .from('issue_groups')
        .insert({
          fingerprint,
          title: error.message,
          error_type: error.name,
          environment: this.environment,
          release_version: this.releaseVersion,
          severity: this.determineSeverity(error),
        })
        .select()
        .single();

      if (newGroup && errorId) {
        await supabase
          .from('telemetry_errors')
          .update({ issue_group_id: newGroup.id })
          .eq('id', errorId);
      }
    }
  }

  private determineSeverity(error: Error): string {
    const message = error.message.toLowerCase();
    if (message.includes('fatal') || message.includes('critical')) return 'critical';
    if (message.includes('network') || message.includes('timeout')) return 'high';
    if (message.includes('warning')) return 'low';
    return 'medium';
  }

  private async checkAlertRules() {
    // Simple alert check - count errors in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { count } = await supabase
      .from('telemetry_errors')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', fiveMinutesAgo);

    if (count && count > 10) {
      // Trigger alert
      await supabase.from('alert_notifications').insert({
        alert_rule_id: null,
        severity: 'high',
        title: 'High Error Rate Detected',
        message: `${count} errors in the last 5 minutes`,
        metadata: { error_count: count },
      });
    }
  }

  recordBreadcrumb(breadcrumb: Breadcrumb) {
    this.breadcrumbs.push({
      ...breadcrumb,
      level: breadcrumb.level || 'info',
    });

    // Keep only last N breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }

  async captureEvent(eventName: string, properties: Record<string, any> = {}) {
    try {
      await supabase.from('telemetry_events').insert({
        event_type: 'custom',
        event_category: 'user_action',
        event_name: eventName,
        event_properties: properties,
        user_id: this.userId,
        session_id: this.userId || 'anonymous',
        environment: this.environment,
        release_version: this.releaseVersion,
      });
    } catch (err) {
      console.error('Failed to capture event:', err);
    }
  }

  async capturePerformance(metric: PerformanceMetric) {
    try {
      await supabase.from('telemetry_performance').insert({
        metric_name: metric.metric_name,
        metric_type: 'timing',
        duration_ms: metric.metric_value,
        status: 'success',
        environment: this.environment,
        release_version: this.releaseVersion,
        user_id: this.userId,
        endpoint: metric.endpoint,
        operation_type: metric.operation_type,
      });
    } catch (err) {
      console.error('Failed to capture performance:', err);
    }
  }

  // Track page load performance
  trackPageLoad() {
    if (window.performance) {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      
      this.capturePerformance({
        metric_name: 'page_load',
        metric_value: pageLoadTime,
        endpoint: window.location.pathname,
        operation_type: 'page_load',
      });
    }
  }
}

// Export singleton instance
export const telemetry = new TelemetrySDK();
