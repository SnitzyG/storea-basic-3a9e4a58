import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, Database } from 'lucide-react';

interface ProjectScopeValidatorProps {
  projectId: string;
  rfis: any[];
  onViolationFound?: (violation: string) => void;
}

export const ProjectScopeValidator: React.FC<ProjectScopeValidatorProps> = ({
  projectId,
  rfis,
  onViolationFound
}) => {
  // Validate that all RFIs belong to the current project
  const violations = rfis.filter(rfi => rfi.project_id !== projectId);
  
  React.useEffect(() => {
    if (violations.length > 0) {
      const violationMessage = `Found ${violations.length} RFI(s) not belonging to project ${projectId}`;
      console.warn('Project scope violation detected:', violationMessage, violations);
      onViolationFound?.(violationMessage);
    }
  }, [violations.length, projectId, onViolationFound]);

  // Only show in development or when violations are found
  if (process.env.NODE_ENV === 'production' && violations.length === 0) {
    return null;
  }

  return (
    <Card className={`mb-4 ${violations.length > 0 ? 'border-red-500' : 'border-green-500'}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          {violations.length > 0 ? (
            <>
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Project Scope Violation
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 text-green-500" />
              Project Scope Validated
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-2 text-xs">
          <Database className="h-3 w-3" />
          <span>Project ID: {projectId}</span>
          <Badge variant={violations.length > 0 ? 'destructive' : 'secondary'}>
            {rfis.length} RFIs | {violations.length} violations
          </Badge>
        </div>
        {violations.length > 0 && (
          <div className="mt-2 text-xs text-red-600">
            ⚠️ Some RFIs from other projects are visible. Check RLS policies.
          </div>
        )}
      </CardContent>
    </Card>
  );
};