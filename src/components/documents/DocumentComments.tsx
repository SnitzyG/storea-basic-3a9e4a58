import React, { useState } from 'react';
import { MessageSquare, Send, User, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

interface Comment {
  id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
  type: 'comment' | 'suggestion' | 'approval';
}

interface DocumentCommentsProps {
  documentId: string;
  comments: Comment[];
  onAddComment: (content: string, type: Comment['type']) => void;
}

export const DocumentComments: React.FC<DocumentCommentsProps> = ({
  documentId,
  comments,
  onAddComment
}) => {
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState<Comment['type']>('comment');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      onAddComment(newComment, commentType);
      setNewComment('');
    }
  };

  const getCommentIcon = (type: Comment['type']) => {
    switch (type) {
      case 'suggestion':
        return '💡';
      case 'approval':
        return '✅';
      default:
        return '💬';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Comments & Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-64">
          <div className="space-y-3">
            {comments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2" />
                <p>No comments yet. Be the first to add feedback!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {comment.user_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{comment.user_name}</span>
                      <span className="text-xs">{getCommentIcon(comment.type)}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(comment.created_at), 'MMM dd, HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm bg-muted/50 rounded-lg p-2">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={commentType === 'comment' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCommentType('comment')}
            >
              💬 Comment
            </Button>
            <Button
              type="button"
              variant={commentType === 'suggestion' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCommentType('suggestion')}
            >
              💡 Suggest
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Textarea
              placeholder={`Add a ${commentType}...`}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1"
              rows={2}
            />
            <Button type="submit" disabled={!newComment.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};