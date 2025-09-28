import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit2, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserProjectReferenceEditorProps {
  projectId: string;
  onUpdate?: () => void;
}

export const UserProjectReferenceEditor = ({ projectId, onUpdate }: UserProjectReferenceEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [userReference, setUserReference] = useState('');
  const [originalReference, setOriginalReference] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserReference();
  }, [projectId]);

  const fetchUserReference = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from('project_users')
        .select('user_project_reference')
        .eq('project_id', projectId)
        .eq('user_id', userData.user.id)
        .single();

      if (error) throw error;

      const reference = data?.user_project_reference || '';
      setUserReference(reference);
      setOriginalReference(reference);
    } catch (error: any) {
      console.error('Error fetching user project reference:', error);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const currentUser = (await supabase.auth.getUser()).data.user;
      if (!currentUser) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('project_users')
        .update({ user_project_reference: userReference.trim() || null })
        .eq('project_id', projectId)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      setOriginalReference(userReference);
      setIsEditing(false);
      onUpdate?.();
      
      toast({
        title: "Reference updated",
        description: "Your project reference has been updated successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error updating reference",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setUserReference(originalReference);
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">My Project Reference</CardTitle>
        <CardDescription className="text-xs">
          Set your own reference number for this project
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isEditing ? (
          <div className="space-y-2">
            <Label htmlFor="userReference" className="text-xs">Reference Number</Label>
            <Input
              id="userReference"
              value={userReference}
              onChange={(e) => setUserReference(e.target.value)}
              placeholder="Enter your reference number"
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleSave} 
                disabled={loading}
                className="h-7 text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                Save
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleCancel}
                className="h-7 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="text-sm">
              {userReference || (
                <span className="text-muted-foreground italic">No reference set</span>
              )}
            </div>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setIsEditing(true)}
              className="h-7 w-7 p-0"
            >
              <Edit2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};