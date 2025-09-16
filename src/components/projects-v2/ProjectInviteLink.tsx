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
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const { toast } = useToast();

  const invitationUrl = invitationToken 
    ? `${window.location.origin}/invite/${invitationToken}`
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
        .single();

      if (error) {
        console.error('Error fetching invitation token:', error);
        return;
      }

      setInvitationToken(data.invitation_token);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const generateInvitationToken = async () => {
    setLoading(true);
    try {
      // Generate a new token
      const { data, error } = await supabase.rpc('generate_project_invitation_token');
      
      if (error) {
        throw error;
      }

      const newToken = data;

      // Update the project with the new token
      const { error: updateError } = await supabase
        .from('projects')
        .update({ invitation_token: newToken })
        .eq('id', projectId);

      if (updateError) {
        throw updateError;
      }

      setInvitationToken(newToken);
      
      toast({
        title: "Invitation link generated",
        description: "Your project invitation link is ready to share!"
      });
    } catch (error: any) {
      console.error('Error generating invitation token:', error);
      toast({
        title: "Error",
        description: "Failed to generate invitation link. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const regenerateInvitationToken = async () => {
    setRegenerating(true);
    try {
      // Generate a new token
      const { data, error } = await supabase.rpc('generate_project_invitation_token');
      
      if (error) {
        throw error;
      }

      const newToken = data;

      // Update the project with the new token
      const { error: updateError } = await supabase
        .from('projects')
        .update({ invitation_token: newToken })
        .eq('id', projectId);

      if (updateError) {
        throw updateError;
      }

      setInvitationToken(newToken);
      
      toast({
        title: "New invitation link generated",
        description: "Previous link has been invalidated. Share the new link with your team."
      });
    } catch (error: any) {
      console.error('Error regenerating invitation token:', error);
      toast({
        title: "Error",
        description: "Failed to regenerate invitation link. Please try again.",
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

        {!invitationToken ? (
          <Button 
            onClick={generateInvitationToken}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                Generating...
              </>
            ) : (
              <>
                <Link className="h-4 w-4 mr-2" />
                Generate Invitation Link
              </>
            )}
          </Button>
        ) : (
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
      </CardContent>
    </Card>
  );
};