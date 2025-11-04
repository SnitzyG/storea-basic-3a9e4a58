import React, { useState, useMemo } from 'react';
import { Search, Filter, X, Calendar, User, Paperclip } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  thread_id?: string;
  attachments?: any[];
}

interface MessageSearchProps {
  messages: Message[];
  projectUsers: any[];
  onMessageClick: (messageId: string, threadId?: string) => void;
  currentUserId?: string;
}

export const MessageSearch: React.FC<MessageSearchProps> = ({
  messages,
  projectUsers,
  onMessageClick,
  currentUserId
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSender, setFilterSender] = useState<string>('all');
  const [filterAttachments, setFilterAttachments] = useState<'all' | 'with' | 'without'>('all');
  const [filterDateRange, setFilterDateRange] = useState<'all' | '7days' | '30days'>('all');
  const [showResults, setShowResults] = useState(false);

  const filteredMessages = useMemo(() => {
    let filtered = messages;

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(msg => 
        msg.content.toLowerCase().includes(query)
      );
    }

    // Sender filter
    if (filterSender !== 'all') {
      filtered = filtered.filter(msg => msg.sender_id === filterSender);
    }

    // Attachments filter
    if (filterAttachments === 'with') {
      filtered = filtered.filter(msg => 
        msg.attachments && msg.attachments.length > 0
      );
    } else if (filterAttachments === 'without') {
      filtered = filtered.filter(msg => 
        !msg.attachments || msg.attachments.length === 0
      );
    }

    // Date range filter
    if (filterDateRange !== 'all') {
      const now = new Date();
      const days = filterDateRange === '7days' ? 7 : 30;
      const cutoffDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
      filtered = filtered.filter(msg => 
        new Date(msg.created_at) >= cutoffDate
      );
    }

    return filtered.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [messages, searchQuery, filterSender, filterAttachments, filterDateRange]);

  const hasActiveFilters = filterSender !== 'all' || filterAttachments !== 'all' || filterDateRange !== 'all';

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-primary/30 text-foreground font-medium rounded px-0.5">
          {part}
        </mark>
      ) : part
    );
  };

  const getSenderName = (senderId: string) => {
    const user = projectUsers.find(u => u.user_id === senderId);
    return user?.user_profile?.name || 'Unknown';
  };

  const clearFilters = () => {
    setFilterSender('all');
    setFilterAttachments('all');
    setFilterDateRange('all');
  };

  return (
    <div className="space-y-2">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search messages..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          className="pl-9 pr-20"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
          {(searchQuery || hasActiveFilters) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => {
                setSearchQuery('');
                clearFilters();
                setShowResults(false);
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-6 w-6 p-0",
                  hasActiveFilters && "text-primary"
                )}
              >
                <Filter className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="end">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium mb-2 block">By Sender</label>
                  <Select value={filterSender} onValueChange={setFilterSender}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Senders</SelectItem>
                      {projectUsers.map(user => (
                        <SelectItem key={user.user_id} value={user.user_id}>
                          {user.user_profile?.name || 'Unknown'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium mb-2 block">Attachments</label>
                  <Select value={filterAttachments} onValueChange={(v: any) => setFilterAttachments(v)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Messages</SelectItem>
                      <SelectItem value="with">With Attachments</SelectItem>
                      <SelectItem value="without">Without Attachments</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium mb-2 block">Date Range</label>
                  <Select value={filterDateRange} onValueChange={(v: any) => setFilterDateRange(v)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="7days">Last 7 Days</SelectItem>
                      <SelectItem value="30days">Last 30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="w-full h-7 text-xs"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Search Results */}
      {showResults && (searchQuery || hasActiveFilters) && (
        <Card className="border shadow-lg">
          <div className="p-2 border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">
                {filteredMessages.length} result{filteredMessages.length !== 1 ? 's' : ''}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setShowResults(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <ScrollArea className="max-h-[400px]">
            <div className="p-2 space-y-1">
              {filteredMessages.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No messages found
                </div>
              ) : (
                filteredMessages.map((message) => {
                  const senderName = getSenderName(message.sender_id);
                  const isOwnMessage = message.sender_id === currentUserId;
                  
                  return (
                    <button
                      key={message.id}
                      onClick={() => {
                        onMessageClick(message.id, message.thread_id);
                        setShowResults(false);
                      }}
                      className="w-full text-left p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium flex-shrink-0">
                          {senderName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium truncate">
                              {isOwnMessage ? 'You' : senderName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(message.created_at), 'MMM d, HH:mm')}
                            </span>
                            {message.attachments && message.attachments.length > 0 && (
                              <Paperclip className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                          <p className="text-xs text-foreground line-clamp-2">
                            {highlightText(message.content, searchQuery)}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </Card>
      )}
    </div>
  );
};