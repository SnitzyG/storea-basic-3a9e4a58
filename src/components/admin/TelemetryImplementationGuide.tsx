import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Activity, Database, Code, CheckCircle, AlertTriangle } from 'lucide-react';
import { TELEMETRY_README } from '@/lib/telemetry/telemetryStubs';

export function TelemetryImplementationGuide() {
  return (
    <div className="space-y-6">
      <Alert>
        <Database className="h-4 w-4" />
        <AlertDescription>
          <strong>Telemetry Infrastructure Ready</strong> - Database tables created with RLS policies. 
          Waiting for Supabase to regenerate types.ts to enable tracking hooks.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Database Setup
            </CardTitle>
            <CardDescription>Telemetry tables and security policies</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span><strong>telemetry_events</strong> - User actions & system events</span>
              </li>
              <li className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span><strong>telemetry_performance</strong> - Metrics & timings</span>
              </li>
              <li className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <span><strong>telemetry_errors</strong> - Error tracking</span>
              </li>
              <li className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span><strong>telemetry_sessions</strong> - Session management</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5 text-blue-600" />
              Pending Implementation
            </CardTitle>
            <CardDescription>Features to enable after type regeneration</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>• <strong>useTelemetryTracking</strong> hook for event/performance tracking</li>
              <li>• <strong>useModuleTelemetry</strong> hook for module-specific metrics</li>
              <li>• <strong>TelemetryProvider</strong> for auto session & error tracking</li>
              <li>• Real-time dashboard data integration</li>
              <li>• Module integration (projects, docs, RFIs, tenders)</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Implementation Details</CardTitle>
          <CardDescription>Full documentation for telemetry system</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-96">
            {TELEMETRY_README}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2 mt-1">
              <span className="text-xs font-bold text-primary">1</span>
            </div>
            <div>
              <p className="font-medium">Wait for Type Regeneration</p>
              <p className="text-sm text-muted-foreground">
                Supabase will automatically regenerate types.ts to include the new telemetry tables
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2 mt-1">
              <span className="text-xs font-bold text-primary">2</span>
            </div>
            <div>
              <p className="font-medium">Implement Tracking Hooks</p>
              <p className="text-sm text-muted-foreground">
                Replace stubs in src/lib/telemetry/telemetryStubs.ts with full implementations
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2 mt-1">
              <span className="text-xs font-bold text-primary">3</span>
            </div>
            <div>
              <p className="font-medium">Integrate with Modules</p>
              <p className="text-sm text-muted-foreground">
                Add telemetry tracking to Projects, Documents, RFIs, Tenders, Messages, etc.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2 mt-1">
              <span className="text-xs font-bold text-primary">4</span>
            </div>
            <div>
              <p className="font-medium">Connect Dashboard Data</p>
              <p className="text-sm text-muted-foreground">
                Replace mock data in AdminTelemetry page with real queries from telemetry tables
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
