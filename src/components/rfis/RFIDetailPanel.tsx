import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  X, 
  Calendar, 
  Clock, 
  User, 
  MessageSquare, 
  Send,
  Paperclip,
  Download,
  ExternalLink,
  Reply,
  FileText,
  Image,
  Archive
} from 'lucide-react';
import { RFI, RFIActivity, useRFIs } from '@/hooks/useRFIs';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { RFIStatusBadge } from './RFIStatusBadge';

interface RFIDetailPanelProps {
  rfi: RFI | null;
  onClose?: () => void;
  className?: string;
}

interface RFIResponse {
  id: string;
  content: string;
  author: {
    name: string;
    role: string;
    avatar?: string;
  };
  created_at: string;
  attachments?: {
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }[];
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return Image;
  if (type.includes('pdf')) return FileText;
  return Archive;
};

const getFilePreview = (attachment: any) => {
  const isImage = attachment.type?.startsWith('image/');
  const isPdf = attachment.type?.includes('pdf');
  
  if (isImage && attachment.url) {
    return {
      canPreview: true,
      previewType: 'image',
      url: attachment.url
    };
  }
  
  if (isPdf && attachment.url) {
    return {
      canPreview: true,
      previewType: 'pdf',
      url: attachment.url
    };
  }
  
  return {
    canPreview: false,
    previewType: 'download',
    url: attachment.url
  };
};

export const RFIDetailPanel: React.FC<RFIDetailPanelProps> = ({ 
  rfi, 
  onClose, 
  className = "" 
}) => {
  const [responseContent, setResponseContent] = useState('');
  const [responses, setResponses] = useState<RFIResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<RFIActivity[]>([]);
  
  const { updateRFI, getRFIActivities } = useRFIs();
  const { user, profile } = useAuth();

  // Load response history when RFI changes
  useEffect(() => {
    if (!rfi) {
      setResponses([]);
      setActivities([]);
      return;
    }

    // Create response history from RFI data
    const responseHistory: RFIResponse[] = [];
    
    // Add original RFI as first "message"
    responseHistory.push({
      id: `original-${rfi.id}`,
      content: rfi.question,
      author: {
        name: rfi.raised_by_profile?.name || rfi.sender_name || 'Unknown',
        role: rfi.raised_by_profile?.role || 'User',
      },
      created_at: rfi.created_at,
      attachments: rfi.attachments || []
    });

    // Add response if it exists
    if (rfi.response) {
      responseHistory.push({
        id: `response-${rfi.id}`,
        content: rfi.response,
        author: {
          name: rfi.responder_name || rfi.assigned_to_profile?.name || 'Unknown',
          role: rfi.responder_position || rfi.assigned_to_profile?.role || 'Responder',
        },
        created_at: rfi.response_date || rfi.updated_at,
      });
    }

    setResponses(responseHistory);

    // Load activities
    getRFIActivities(rfi.id).then((data) => {
      setActivities(data || []);
    }).catch(() => {
      setActivities([]);
    });
  }, [rfi?.id, getRFIActivities]);

  const handleSubmitResponse = async () => {
    if (!rfi || !responseContent.trim()) return;

    setLoading(true);
    
    try {
      const updates: Partial<RFI> = {
        response: responseContent.trim(),
        status: 'answered',
        responder_name: profile?.name,
        responder_position: profile?.role,
        response_date: new Date().toISOString(),
      };

      await updateRFI(rfi.id, updates);
      
      // Add new response to the thread immediately
      const newResponse: RFIResponse = {
        id: `response-${Date.now()}`,
        content: responseContent.trim(),
        author: {
          name: profile?.name || 'You',
          role: profile?.role || 'User',
        },
        created_at: new Date().toISOString(),
      };
      
      setResponses(prev => [...prev, newResponse]);
      setResponseContent('');
    } catch (error) {
      console.error('Error submitting response:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAttachmentClick = (attachment: any) => {
    const preview = getFilePreview(attachment);
    
    if (preview.canPreview && preview.previewType === 'image') {
      // Open image in new tab for preview
      window.open(preview.url, '_blank');
    } else if (preview.canPreview && preview.previewType === 'pdf') {
      // Open PDF in new tab for preview
      window.open(preview.url, '_blank');
    } else if (preview.url) {
      // Download file
      window.open(preview.url, '_blank');
    }
  };

  const canRespond = user && rfi?.assigned_to === user.id && rfi.status !== 'closed' && rfi.status !== 'answered';

  if (!rfi) {
    return (
      <div className={`flex items-center justify-center h-full bg-muted/10 border rounded-lg ${className}`}>
        <div className="text-center text-muted-foreground">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No RFI Selected</h3>
          <p className="text-sm">Double-click an RFI to view details</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-background border rounded-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-semibold truncate">
              {rfi.subject || 'RFI Details'}
            </h2>
            <RFIStatusBadge status={rfi.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            Mail #{rfi.rfi_number || rfi.id.slice(0, 8)} • {rfi.project_name || 'Project'}
          </p>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="flex-shrink-0">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* RFI Metadata */}
      <div className="p-4 border-b bg-muted/10 space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">From:</span>
            <span className="font-medium">
              {rfi.raised_by_profile?.name || rfi.sender_name || 'Unknown'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">To:</span>
            <span className="font-medium">
              {rfi.assigned_to_profile?.name || rfi.recipient_name || 'Unassigned'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Created:</span>
            <span>{formatDistanceToNow(new Date(rfi.created_at), { addSuffix: true })}</span>
          </div>
          {rfi.due_date && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Due:</span>
              <span>{new Date(rfi.due_date).toLocaleDateString()}</span>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs">
            {rfi.priority.toUpperCase()} Priority
          </Badge>
          {rfi.category && (
            <Badge variant="outline" className="text-xs">
              {rfi.category}
            </Badge>
          )}
        </div>
      </div>

      {/* Response Thread */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {responses.map((response, index) => (
            <div key={response.id} className="space-y-3">
              <div className="flex items-start gap-3">
                <Avatar className="w-8 h-8 mt-1">
                  <AvatarFallback className="text-sm">
                    {response.author.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{response.author.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {response.author.role}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(response.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm whitespace-pre-wrap">{response.content}</p>
                    
                    {/* Attachments for this response */}
                    {response.attachments && response.attachments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <Paperclip className="w-3 h-3" />
                          Attachments ({response.attachments.length})
                        </p>
                        <div className="space-y-1">
                          {response.attachments.map((attachment, attachmentIndex) => {
                            const FileIcon = getFileIcon(attachment.type || '');
                            const preview = getFilePreview(attachment);
                            
                            return (
                              <div
                                key={attachment.id || attachmentIndex}
                                className="flex items-center gap-2 p-2 bg-background rounded border cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => handleAttachmentClick(attachment)}
                              >
                                <FileIcon className="w-4 h-4 text-muted-foreground" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate">
                                    {attachment.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {attachment.size ? `${(attachment.size / 1024).toFixed(1)} KB` : 'Unknown size'}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1">
                                  {preview.canPreview && (
                                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                                  )}
                                  <Download className="w-3 h-3 text-muted-foreground" />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {index < responses.length - 1 && <Separator className="my-4" />}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Response Input Area */}
      {canRespond && (
        <div className="p-4 border-t bg-muted/10">
          <div className="space-y-3">
            <Label htmlFor="response-input" className="text-sm font-medium flex items-center gap-2">
              <Reply className="w-4 h-4" />
              Add Response
            </Label>
            <Textarea
              id="response-input"
              placeholder="Type your response here..."
              value={responseContent}
              onChange={(e) => setResponseContent(e.target.value)}
              className="min-h-[80px] resize-none"
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSubmitResponse}
                disabled={loading || !responseContent.trim()}
                size="sm"
                className="gap-2"
              >
                <Send className="w-4 h-4" />
                {loading ? 'Sending...' : 'Send Response'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {!canRespond && rfi.status !== 'answered' && rfi.status !== 'closed' && (
        <div className="p-4 border-t bg-muted/10 text-center text-muted-foreground">
          <MessageSquare className="w-6 h-6 mx-auto mb-2 opacity-50" />
          <p className="text-sm">You are not assigned to respond to this RFI</p>
        </div>
      )}
    </div>
  );
};