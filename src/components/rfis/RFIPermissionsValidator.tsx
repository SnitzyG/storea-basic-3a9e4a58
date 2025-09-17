import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Users, Lock, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface RFIPermissionsValidatorProps {
  projectId: string;
  projectUsers: any[];
}

export const RFIPermissionsValidator: React.FC<RFIPermissionsValidatorProps> = ({
  projectId,
  projectUsers
}) => {
  const { user, profile } = useAuth();
  
  // Check if current user is a project member
  const isProjectMember = user && projectUsers.some(member => member.user_id === user.id);
  
  // Determine user's capabilities
  const capabilities = {
    canCreateRFIs: isProjectMember,
    canAssignToOthers: isProjectMember && projectUsers.length > 1,
    canRespondToAssigned: isProjectMember,
    canCloseOwnRFIs: isProjectMember,
    canCloseOthersRFIs: false, // Only creators can close their own RFIs
  };

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <Card className="mb-4 border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="h-4 w-4 text-blue-600" />
          RFI Permissions Status
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Users className="h-3 w-3" />
            <span>Project Members: {projectUsers.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isProjectMember ? 'default' : 'destructive'}>
              {isProjectMember ? 'Member' : 'Not Member'}
            </Badge>
          </div>
        </div>

        <div className="space-y-1">
          <h4 className="text-xs font-medium">Phase 4 Capabilities:</h4>
          {Object.entries(capabilities).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between text-xs">
              <span className="capitalize">
                {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
              </span>
              <div className="flex items-center gap-1">
                {value ? (
                  <CheckCircle className="h-3 w-3 text-green-600" />
                ) : (
                  <Lock className="h-3 w-3 text-red-600" />
                )}
                <span className={value ? 'text-green-600' : 'text-red-600'}>
                  {value ? 'Allowed' : 'Restricted'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {!isProjectMember && (
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertDescription className="text-xs">
              ⚠️ User is not a project member. RFI creation will be blocked by RLS policies.
            </AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-muted-foreground bg-white/50 p-2 rounded border">
          <strong>Phase 4 Features:</strong>
          <ul className="mt-1 space-y-0.5 list-disc list-inside">
            <li>Any project member can create RFIs</li>
            <li>Can assign to any project member</li>
            <li>Categorized inbox (Waiting vs. Respond)</li>
            <li>Only creators can close their RFIs</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};