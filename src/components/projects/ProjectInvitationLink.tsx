import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Copy, Link, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ProjectInvitationLinkProps {
  projectId: string;
  projectName: string;
}

export const ProjectInvitationLink = ({ projectId, projectName }: ProjectInvitationLinkProps) => {
  const [invitationToken, setInvitationToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  
  const invitationUrl = invitationToken
    ? `${window.location.origin}/projects/${projectId}/join`
    : '';

  useEffect(() => {
    fetchInvitationToken();
  }, [projectId]);

  const fetchInvitationToken = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('invitation_token')
        .eq('id', projectId)
        .maybeSingle();

      if (error) throw error;
      
      console.log('ProjectInvitationLink: Fetched token:', data.invitation_token);
      
      // Projects now auto-generate tokens, so this should always exist
      setInvitationToken(data.invitation_token || 'auto-generated');
    } catch (error) {
      console.error('Error fetching invitation token:', error);
      toast({
        title: "Error",
        description: "Failed to fetch invitation token.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };


  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(invitationUrl);
      toast({
        title: "Link copied!",
        description: "Invitation link has been copied to your clipboard."
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Please manually copy the link.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Project Invitation Link
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-10 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="h-5 w-5" />
          Project Invitation Link
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Share this link with anyone you want to invite to <strong>{projectName}</strong>. 
          New users will be prompted to create an account, while existing users will be added immediately.
        </p>

        {invitationToken ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={invitationUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                onClick={copyToClipboard}
                variant="outline"
                size="icon"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            Loading invitation link...
          </div>
        )}

        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded border">
          <strong>Note:</strong> This is your permanent project invitation link. It can be used multiple times and will automatically direct users to join your project.
        </div>
      </CardContent>
    </Card>
  );
};