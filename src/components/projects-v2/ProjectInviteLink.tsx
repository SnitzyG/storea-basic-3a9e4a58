import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Link, Copy, RefreshCw } from 'lucide-react';

interface ProjectInvitationLinkProps {
  projectId: string;
  projectName: string;
}

export const ProjectInviteLink = ({ projectId, projectName }: ProjectInvitationLinkProps) => {
  const [invitationToken, setInvitationToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const { toast } = useToast();

  const invitationUrl = invitationToken 
    ? `${window.location.origin}/invite/${invitationToken}`
    : '';

  useEffect(() => {
    fetchInvitationToken();
  }, [projectId]);

  const fetchInvitationToken = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('invitation_token')
        .eq('id', projectId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching invitation token:', error);
        return;
      }

      console.log('Fetched project data:', data);
      setInvitationToken(data.invitation_token);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const regenerateInvitationToken = async () => {
    setRegenerating(true);
    try {
      // Call the edge function to generate and save the new token
      const { data, error } = await supabase.functions.invoke('generate-invite-link', {
        body: { projectId }
      });

      console.log('Edge function response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to call edge function');
      }

      if (!data?.success) {
        console.error('Edge function failed:', data);
        throw new Error(data?.error || 'Failed to regenerate invitation link');
      }

      setInvitationToken(data.token);
      
      toast({
        title: "New invitation link generated",
        description: "Previous link has been invalidated. Share the new link with your team."
      });
    } catch (error: any) {
      console.error('Error regenerating invitation token:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to regenerate invitation link. Please try again.",
        variant: "destructive"
      });
    } finally {
      setRegenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!invitationUrl) return;
    
    try {
      await navigator.clipboard.writeText(invitationUrl);
      toast({
        title: "Copied!",
        description: "Invitation link copied to clipboard."
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard. Please copy manually.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
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
        <div className="text-sm text-muted-foreground">
          Share this link to allow users to join the project. New users will be prompted to sign up, 
          existing users will be logged in automatically.
        </div>

        {invitationToken && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={invitationUrl}
                readOnly
                className="font-mono text-sm"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                onClick={copyToClipboard}
                variant="outline"
                size="sm"
                className="shrink-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={regenerateInvitationToken}
                disabled={regenerating}
                variant="outline"
                size="sm"
              >
                {regenerating ? (
                  <>
                    <div className="animate-spin h-3 w-3 mr-2 border border-current border-t-transparent rounded-full" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3 mr-2" />
                    Regenerate Link
                  </>
                )}
              </Button>
              
              <div className="text-xs text-muted-foreground flex items-center">
                Regenerating will invalidate the previous link
              </div>
            </div>
          </div>
        )}

        {!invitationToken && (
          <div className="text-sm text-muted-foreground">
            No invitation token found for this project. Try regenerating a new one.
          </div>
        )}
      </CardContent>
    </Card>
  );
};