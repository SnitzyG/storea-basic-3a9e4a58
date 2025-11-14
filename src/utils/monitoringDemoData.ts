import { supabase } from '@/integrations/supabase/client';

const DEMO_MARKER = 'demo-seed-v1';

export const generateDemoMonitoringData = async () => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Generate releases
    const releases = [
      { version: 'v1.2.3', deployed_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
      { version: 'v1.2.2', deployed_at: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
      { version: 'v1.2.1', deployed_at: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) },
    ];

    const { data: releasesData } = await supabase
      .from('releases' as any)
      .insert(releases.map(r => ({ ...r, metadata: { demo: DEMO_MARKER } })))
      .select();

    // Generate issue groups
    const issueGroups = [
      {
        fingerprint: 'TypeError-Cannot-read-property-undefined',
        error_type: 'TypeError',
        error_message: 'Cannot read property of undefined',
        first_seen: oneDayAgo,
        last_seen: oneHourAgo,
        event_count: 24,
        user_count: 8,
        status: 'open',
        severity: 'high',
        metadata: { demo: DEMO_MARKER }
      },
      {
        fingerprint: 'NetworkError-Failed-to-fetch',
        error_type: 'NetworkError',
        error_message: 'Failed to fetch',
        first_seen: oneDayAgo,
        last_seen: new Date(now.getTime() - 30 * 60 * 1000),
        event_count: 15,
        user_count: 5,
        status: 'open',
        severity: 'medium',
        metadata: { demo: DEMO_MARKER }
      },
      {
        fingerprint: 'ReferenceError-Variable-not-defined',
        error_type: 'ReferenceError',
        error_message: 'Variable is not defined',
        first_seen: oneDayAgo,
        last_seen: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        event_count: 8,
        user_count: 3,
        status: 'open',
        severity: 'low',
        metadata: { demo: DEMO_MARKER }
      },
    ];

    const { data: issueGroupsData, error: issueError } = await supabase
      .from('issue_groups' as any)
      .insert(issueGroups)
      .select();

    if (issueError || !issueGroupsData) {
      console.error('Failed to create issue groups:', issueError);
      throw new Error('Failed to create issue groups');
    }

    // Generate telemetry errors
    const errors = [];
    const environments = ['production', 'staging', 'development'];
    const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];
    const os = ['Windows', 'macOS', 'Linux', 'iOS', 'Android'];
    const urls = ['/dashboard', '/projects', '/documents', '/financials', '/tenders'];

    for (const group of (issueGroupsData as any[])) {
      const errorCount = Math.floor(Math.random() * 10) + 5;
      for (let i = 0; i < errorCount; i++) {
        const timestamp = new Date(
          oneDayAgo.getTime() + Math.random() * (now.getTime() - oneDayAgo.getTime())
        );
        
        errors.push({
          issue_group_id: group.id,
          error_stack: `Error: ${group.error_message}\n  at Component.render (app.js:123:45)\n  at update (react.js:456:78)`,
          user_id: `user-${Math.floor(Math.random() * 10) + 1}`,
          session_id: `session-${Date.now()}-${i}`,
          environment: environments[Math.floor(Math.random() * environments.length)],
          release_version: releases[Math.floor(Math.random() * releases.length)].version,
          url: urls[Math.floor(Math.random() * urls.length)],
          browser: browsers[Math.floor(Math.random() * browsers.length)],
          os: os[Math.floor(Math.random() * os.length)],
          device_type: Math.random() > 0.5 ? 'desktop' : 'mobile',
          timestamp,
          metadata: { demo: DEMO_MARKER }
        });
      }
    }

    const { data: errorsData, error: errorsError } = await supabase
      .from('telemetry_errors' as any)
      .insert(errors)
      .select();

    if (errorsError || !errorsData) {
      console.error('Failed to create errors:', errorsError);
      throw new Error('Failed to create errors');
    }

    // Generate breadcrumbs for some errors
    const breadcrumbs = [];
    const sampleErrors = (errorsData as any[]).slice(0, 10);
    
    for (const error of sampleErrors) {
      const breadcrumbCount = Math.floor(Math.random() * 5) + 3;
      for (let i = 0; i < breadcrumbCount; i++) {
        breadcrumbs.push({
          error_id: error.id,
          category: ['navigation', 'user', 'http', 'console'][Math.floor(Math.random() * 4)],
          message: `User action ${i + 1}`,
          level: ['info', 'warning', 'error'][Math.floor(Math.random() * 3)],
          timestamp: new Date(new Date(error.timestamp).getTime() - (breadcrumbCount - i) * 1000),
          data: { demo: DEMO_MARKER }
        });
      }
    }

    await supabase.from('error_breadcrumbs' as any).insert(breadcrumbs);

    // Generate performance metrics
    const performanceMetrics = [];
    const operations = ['api_call', 'page_load', 'database_query', 'render'];
    const endpoints = ['/api/projects', '/api/documents', '/api/financials', '/api/tenders'];

    for (let i = 0; i < 300; i++) {
      const timestamp = new Date(
        oneDayAgo.getTime() + Math.random() * (now.getTime() - oneDayAgo.getTime())
      );
      
      performanceMetrics.push({
        metric_name: operations[Math.floor(Math.random() * operations.length)],
        duration_ms: Math.floor(Math.random() * 2000) + 100,
        endpoint: endpoints[Math.floor(Math.random() * endpoints.length)],
        user_id: `user-${Math.floor(Math.random() * 10) + 1}`,
        session_id: `session-${Date.now()}-${i}`,
        environment: environments[Math.floor(Math.random() * environments.length)],
        release_version: releases[Math.floor(Math.random() * releases.length)].version,
        timestamp,
        metadata: { demo: DEMO_MARKER }
      });
    }

    await supabase.from('telemetry_performance' as any).insert(performanceMetrics);

    // Generate active alerts
    const alerts = [
      {
        title: 'High Error Rate Detected',
        message: 'Error rate exceeded 5% in the last hour',
        severity: 'critical',
        status: 'active',
        triggered_at: oneHourAgo,
        metadata: { demo: DEMO_MARKER, threshold: 0.05 }
      },
      {
        title: 'Slow Response Times',
        message: 'Average response time above 1000ms',
        severity: 'high',
        status: 'active',
        triggered_at: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        metadata: { demo: DEMO_MARKER, threshold: 1000 }
      },
    ];

    await supabase.from('alert_notifications' as any).insert(alerts);

    return { success: true, message: 'Demo data generated successfully' };
  } catch (error) {
    console.error('Error generating demo data:', error);
    throw error;
  }
};

export const clearDemoMonitoringData = async () => {
  try {
    // Delete in reverse order of dependencies
    await supabase.from('error_breadcrumbs' as any).delete().eq('data->>demo', DEMO_MARKER);
    await supabase.from('telemetry_performance' as any).delete().eq('metadata->>demo', DEMO_MARKER);
    await supabase.from('alert_notifications' as any).delete().eq('metadata->>demo', DEMO_MARKER);
    await supabase.from('telemetry_errors' as any).delete().eq('metadata->>demo', DEMO_MARKER);
    await supabase.from('issue_groups' as any).delete().eq('metadata->>demo', DEMO_MARKER);
    await supabase.from('releases' as any).delete().eq('metadata->>demo', DEMO_MARKER);

    return { success: true, message: 'Demo data cleared successfully' };
  } catch (error) {
    console.error('Error clearing demo data:', error);
    throw error;
  }
};
