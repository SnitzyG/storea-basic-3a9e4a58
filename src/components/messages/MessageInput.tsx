import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, AtSign, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { FileSelector } from './FileSelector';
import { cn } from '@/lib/utils';

interface MessageInputProps {
  onSendMessage: (content: string, attachments?: any[], isInquiry?: boolean) => Promise<void>;
  onTyping?: (isTyping: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  supportAttachments?: boolean;
  supportMentions?: boolean;
  projectUsers?: any[];
  projectId?: string;
  onCreateRFI?: (content: string, attachments?: any[]) => Promise<void>;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onTyping,
  placeholder = "Type a message...",
  disabled = false,
  supportAttachments = false,
  supportMentions = false,
  projectUsers = [],
  projectId = '',
  onCreateRFI
}) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [isInquiry, setIsInquiry] = useState(false);
  const [showFileSelector, setShowFileSelector] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);

    // Handle mentions
    if (supportMentions) {
      const lastAtIndex = value.lastIndexOf('@');
      if (lastAtIndex !== -1) {
        const textAfterAt = value.slice(lastAtIndex + 1);
        if (!textAfterAt.includes(' ')) {
          setMentionQuery(textAfterAt);
          setShowMentions(true);
        } else {
          setShowMentions(false);
        }
      } else {
        setShowMentions(false);
      }
    }

    // Handle typing indicator
    if (onTyping) {
      onTyping(true);
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 1000);
    }

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!message.trim() && attachments.length === 0) || sending || disabled) return;

    setSending(true);
    try {
      // Send the message first
      await onSendMessage(message.trim(), attachments.length > 0 ? attachments : undefined, isInquiry);
      
      // If it's a formal inquiry, also create an RFI entry
      if (isInquiry && onCreateRFI) {
        await onCreateRFI(message.trim(), attachments.length > 0 ? attachments : undefined);
      }
      
      setMessage('');
      setAttachments([]);
      setShowMentions(false);
      setIsInquiry(false);
      setShowFileSelector(false);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      
      // Stop typing indicator
      if (onTyping) {
        onTyping(false);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleFileSelect = (file: any) => {
    setAttachments(prev => [...prev, file]);
  };

  const handleUploadNew = (files: File[]) => {
    const fileObjects = files.map(file => ({
      name: file.name,
      type: 'uploaded',
      file: file
    }));
    setAttachments(prev => [...prev, ...fileObjects]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const insertMention = (user: any) => {
    const lastAtIndex = message.lastIndexOf('@');
    const beforeAt = message.slice(0, lastAtIndex);
    const afterMention = message.slice(lastAtIndex + mentionQuery.length + 1);
    setMessage(`${beforeAt}@${user.user_profile?.name || 'User'} ${afterMention}`);
    setShowMentions(false);
    textareaRef.current?.focus();
  };

  const filteredUsers = projectUsers.filter(user =>
    user.user_profile?.name?.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Cleanup typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-background border-t border-border">
      {/* Inquiry Mode Toggle - Compact */}
      {onCreateRFI && (
        <div className="px-4 py-2 border-b border-border/50">
          <div className="flex items-center space-x-2">
            <Switch
              id="inquiry-mode"
              checked={isInquiry}
              onCheckedChange={setIsInquiry}
            />
            <Label htmlFor="inquiry-mode" className="text-xs flex items-center gap-1.5 text-muted-foreground">
              <AlertCircle className="h-3 w-3" />
              Formal inquiry
            </Label>
          </div>
        </div>
      )}

      {/* File Selector */}
      {showFileSelector && (
        <div className="p-4 border-b border-border/50 bg-muted/20">
          <FileSelector
            projectId={projectId}
            selectedFiles={attachments}
            onFileSelect={handleFileSelect}
            onFileRemove={removeAttachment}
            onUploadNew={handleUploadNew}
          />
        </div>
      )}

      {/* Attachments Preview */}
      {attachments.length > 0 && !showFileSelector && (
        <div className="px-4 py-2 border-b border-border/50">
          <div className="flex flex-wrap gap-2">
            {attachments.map((attachment, index) => (
              <div key={index} className="flex items-center gap-2 bg-primary/10 rounded-full px-3 py-1 text-xs">
                <span>📎 {attachment.name || 'Attachment'}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-destructive/20 rounded-full"
                  onClick={() => removeAttachment(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="flex gap-3 items-end bg-muted/30 rounded-full p-2 focus-within:bg-background focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            {/* Left Actions */}
            {supportAttachments && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full flex-shrink-0"
                disabled={disabled || sending}
                onClick={() => setShowFileSelector(!showFileSelector)}
              >
                <Paperclip className="h-5 w-5" />
              </Button>
            )}
            
            {/* Message Input with Mentions */}
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                placeholder={placeholder}
                value={message}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                disabled={disabled || sending}
                className={cn(
                  "min-h-[40px] max-h-[120px] resize-none border-0 bg-transparent",
                  "focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/70",
                  "text-sm leading-relaxed py-2"
                )}
                rows={1}
              />
              
              {/* Mentions Popup */}
              {supportMentions && showMentions && filteredUsers.length > 0 && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-popover border rounded-lg shadow-lg max-h-40 overflow-hidden z-50">
                  <ScrollArea className="h-full">
                    <div className="p-2">
                      <p className="text-xs text-muted-foreground mb-2 px-2">Mention someone:</p>
                      {filteredUsers.slice(0, 5).map((user) => (
                        <div
                          key={user.user_id}
                          className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                          onClick={() => insertMention(user)}
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {user.user_profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user.user_profile?.name || 'Unknown User'}</p>
                            <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>

            {/* Right Actions */}
            <div className="flex items-end gap-1">
              {supportMentions && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 p-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full"
                  disabled={disabled || sending}
                  onClick={() => {
                    setMessage(prev => prev + '@');
                    textareaRef.current?.focus();
                  }}
                >
                  <AtSign className="h-5 w-5" />
                </Button>
              )}

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full"
                disabled={disabled}
              >
                <Smile className="h-5 w-5" />
              </Button>
              
              <Button
                type="submit"
                size="sm"
                disabled={(!message.trim() && attachments.length === 0) || sending || disabled}
                className="h-10 w-10 p-0 rounded-full flex-shrink-0"
              >
                {sending ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};