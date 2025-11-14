import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { telemetry } from '@/lib/telemetry/TelemetryClient';

export const useTelemetry = () => {
  const location = useLocation();

  // Track page views on route change
  useEffect(() => {
    telemetry.trackPageView(window.location.href);
  }, [location.pathname]);

  const trackClick = useCallback((elementName: string, elementType: string, properties?: Record<string, any>) => {
    return telemetry.trackClick(elementName, elementType, properties);
  }, []);

  const trackFormSubmit = useCallback((formName: string, success: boolean, properties?: Record<string, any>) => {
    return telemetry.trackFormSubmit(formName, success, properties);
  }, []);

  const trackDataOperation = useCallback((operation: string, resource: string, success: boolean, metadata?: Record<string, any>) => {
    return telemetry.trackDataOperation(operation, resource, success, metadata);
  }, []);

  const trackPerformance = useCallback((
    metricType: 'page_load' | 'api_call' | 'database_query' | 'edge_function' | 'render_time' | 'network_latency',
    metricName: string,
    durationMs: number,
    status?: 'success' | 'error' | 'timeout'
  ) => {
    return telemetry.trackPerformance(metricType, metricName, durationMs, status);
  }, []);

  const trackError = useCallback((
    error: Error | string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    errorType?: 'client_error' | 'api_error' | 'database_error' | 'auth_error' | 'network_error' | 'validation_error',
    context?: Record<string, any>
  ) => {
    return telemetry.trackError(error, severity, errorType, context);
  }, []);

  return {
    trackClick,
    trackFormSubmit,
    trackDataOperation,
    trackPerformance,
    trackError,
  };
};
