import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Users, MessageSquare, Clock, CheckCircle, AlertCircle, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { RFI } from '@/hooks/useRFIs';
import { formatDistanceToNow } from 'date-fns';

interface Collaborator {
  id: string;
  rfi_id: string;
  user_id: string;
  role: 'reviewer' | 'approver' | 'observer';
  status: 'pending' | 'reviewed' | 'approved' | 'declined';
  comments?: string;
  created_at: string;
  updated_at: string;
  user_profile?: {
    name: string;
    role: string;
    avatar_url?: string;
  };
}

interface CollaborationComment {
  id: string;
  rfi_id: string;
  user_id: string;
  comment: string;
  comment_type: 'general' | 'suggestion' | 'concern' | 'approval';
  created_at: string;
  user_profile?: {
    name: string;
    role: string;
    avatar_url?: string;
  };
}

interface RFICollaborationPanelProps {
  rfi: RFI;
  onUpdate?: () => void;
}

export function RFICollaborationPanel({ rfi, onUpdate }: RFICollaborationPanelProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [comments, setComments] = useState<CollaborationComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState<'general' | 'suggestion' | 'concern' | 'approval'>('general');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCollaborationData = async () => {
    try {
      // Fetch collaborators
      const { data: collaboratorsData, error: collabError } = await supabase
        .from('rfi_collaborators')
        .select(`
          *,
          user_profile:profiles!user_id (
            name,
            role,
            avatar_url
          )
        `)
        .eq('rfi_id', rfi.id)
        .order('created_at', { ascending: false });

      if (collabError) throw collabError;

      // Fetch comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('rfi_collaboration_comments')
        .select(`
          *,
          user_profile:profiles!user_id (
            name,
            role,
            avatar_url
          )
        `)
        .eq('rfi_id', rfi.id)
        .order('created_at', { ascending: false });

      if (commentsError) throw commentsError;

      setCollaborators(collaboratorsData || []);
      setComments(commentsData || []);
    } catch (error) {
      console.error('Error fetching collaboration data:', error);
      toast({
        title: "Error",
        description: "Failed to load collaboration data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !user) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('rfi_collaboration_comments')
        .insert({
          rfi_id: rfi.id,
          user_id: user.id,
          comment: newComment.trim(),
          comment_type: commentType
        })
        .select()
        .single();

      if (error) throw error;

      // Log RFI activity
      await supabase
        .from('rfi_activities')
        .insert({
          rfi_id: rfi.id,
          user_id: user.id,
          action: 'comment_added',
          details: `Added ${commentType} comment to collaboration`
        });

      setNewComment('');
      setCommentType('general');
      fetchCollaborationData();
      onUpdate?.();

      toast({
        title: "Success",
        description: "Comment added successfully",
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const updateCollaboratorStatus = async (collaboratorId: string, status: Collaborator['status'], comments?: string) => {
    try {
      const { error } = await supabase
        .from('rfi_collaborators')
        .update({ 
          status,
          comments,
          updated_at: new Date().toISOString()
        })
        .eq('id', collaboratorId);

      if (error) throw error;

      // Log RFI activity
      await supabase
        .from('rfi_activities')
        .insert({
          rfi_id: rfi.id,
          user_id: user?.id,
          action: 'collaboration_status_updated',
          details: `Collaboration status updated to ${status}`
        });

      fetchCollaborationData();
      onUpdate?.();

      toast({
        title: "Success",
        description: "Status updated successfully",
      });
    } catch (error) {
      console.error('Error updating collaborator status:', error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchCollaborationData();
  }, [rfi.id]);

  const getStatusIcon = (status: Collaborator['status']) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-orange-500" />;
      case 'reviewed': return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'declined': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCommentTypeColor = (type: CollaborationComment['comment_type']) => {
    switch (type) {
      case 'suggestion': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'concern': return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'approval': return 'bg-green-50 border-green-200 text-green-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  if (loading) {
    return <div className="p-4 text-center text-muted-foreground">Loading collaboration data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Collaborators Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Collaboration Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {collaborators.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No collaborators assigned</p>
          ) : (
            <div className="space-y-3">
              {collaborators.map((collaborator) => (
                <div key={collaborator.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={collaborator.user_profile?.avatar_url} />
                      <AvatarFallback>
                        {collaborator.user_profile?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{collaborator.user_profile?.name}</span>
                        <Badge variant="outline" className="capitalize">{collaborator.role}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{collaborator.user_profile?.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(collaborator.status)}
                    <Badge variant="outline" className="capitalize">{collaborator.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Comment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Add Comment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={commentType} onValueChange={(value: any) => setCommentType(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select comment type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General Comment</SelectItem>
              <SelectItem value="suggestion">Suggestion</SelectItem>
              <SelectItem value="concern">Concern</SelectItem>
              <SelectItem value="approval">Approval</SelectItem>
            </SelectContent>
          </Select>
          <Textarea
            placeholder="Add your input or feedback..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
          />
          <Button 
            onClick={addComment} 
            disabled={!newComment.trim() || submitting}
            className="w-full"
          >
            <Send className="h-4 w-4 mr-2" />
            {submitting ? 'Adding Comment...' : 'Add Comment'}
          </Button>
        </CardContent>
      </Card>

      {/* Comments Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Discussion & Comments</CardTitle>
        </CardHeader>
        <CardContent>
          {comments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No comments yet</p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment, index) => (
                <div key={comment.id}>
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.user_profile?.avatar_url} />
                      <AvatarFallback>
                        {comment.user_profile?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{comment.user_profile?.name}</span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs capitalize ${getCommentTypeColor(comment.comment_type)}`}
                        >
                          {comment.comment_type}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm">{comment.comment}</p>
                    </div>
                  </div>
                  {index < comments.length - 1 && <Separator className="my-4" />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}