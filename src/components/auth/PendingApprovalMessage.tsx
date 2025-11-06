import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { StorealiteLogo } from "@/components/ui/storealite-logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export const PendingApprovalMessage = () => {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md p-8 text-center space-y-6 shadow-glow">
        <div className="flex justify-center">
          <StorealiteLogo className="h-12" />
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-gradient-to-br from-warning/20 to-warning/10 p-4">
              <AlertCircle className="h-12 w-12 text-warning" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Account Pending Approval
            </h2>
            <p className="text-muted-foreground">
              Your account has been created successfully, but it needs to be approved by an administrator before you can access the application.
            </p>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              You'll receive a notification once your account is approved. This usually takes 1-2 business days.
            </p>
          </div>
        </div>
        
        <Button
          onClick={() => signOut()}
          variant="outline"
          className="w-full"
        >
          Sign Out
        </Button>
      </Card>
    </div>
  );
};
