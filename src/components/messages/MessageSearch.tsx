import React, { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface MessageSearchProps {
  messages: any[];
  projectUsers: any[];
  onMessageClick: (messageId: string) => void;
}

export const MessageSearch: React.FC<MessageSearchProps> = ({
  messages,
  projectUsers,
  onMessageClick
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSender, setFilterSender] = useState<string>('all');
  const [filterAttachments, setFilterAttachments] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('all');

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? 
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 text-foreground">{part}</mark> : part
    );
  };

  const filteredMessages = messages.filter(msg => {
    if (msg.is_deleted) return false;
    
    // Search query filter
    const matchesSearch = !searchQuery || 
      msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      projectUsers.find(u => u.user_id === msg.sender_id)?.user_profile?.name
        ?.toLowerCase().includes(searchQuery.toLowerCase());

    // Sender filter
    const matchesSender = filterSender === 'all' || msg.sender_id === filterSender;

    // Attachments filter
    const hasAttachments = msg.attachments && msg.attachments.length > 0;
    const matchesAttachments = filterAttachments === 'all' || 
      (filterAttachments === 'with' && hasAttachments) ||
      (filterAttachments === 'without' && !hasAttachments);

    // Date filter
    const messageDate = new Date(msg.created_at);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
    const matchesDate = filterDate === 'all' ||
      (filterDate === '7' && daysDiff <= 7) ||
      (filterDate === '30' && daysDiff <= 30);

    return matchesSearch && matchesSender && matchesAttachments && matchesDate;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Search Input */}
      <div className="p-3 border-b border-border space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search message content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Select value={filterSender} onValueChange={setFilterSender}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="By sender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All senders</SelectItem>
              {projectUsers.map(user => (
                <SelectItem key={user.user_id} value={user.user_id}>
                  {user.user_profile?.name || 'Unknown'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterAttachments} onValueChange={setFilterAttachments}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Attachments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All messages</SelectItem>
              <SelectItem value="with">With attachments</SelectItem>
              <SelectItem value="without">Without attachments</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterDate} onValueChange={setFilterDate}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active Filters Display */}
        {(searchQuery || filterSender !== 'all' || filterAttachments !== 'all' || filterDate !== 'all') && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Filters:</span>
            {searchQuery && (
              <Badge variant="secondary" className="text-xs">
                Text: "{searchQuery}"
              </Badge>
            )}
            {filterDate !== 'all' && (
              <Badge variant="secondary" className="text-xs">
                Last {filterDate} days
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {filteredMessages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">
                {searchQuery ? 'No messages found' : 'Start typing to search'}
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-2">
                {filteredMessages.length} result{filteredMessages.length !== 1 ? 's' : ''}
              </p>
              {filteredMessages.map(msg => {
                const sender = projectUsers.find(u => u.user_id === msg.sender_id);
                return (
                  <Card
                    key={msg.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => onMessageClick(msg.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-foreground">
                              {sender?.user_profile?.name || 'Unknown'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(msg.created_at), 'MMM d, HH:mm')}
                            </span>
                            {msg.edited_at && (
                              <Badge variant="secondary" className="text-xs">edited</Badge>
                            )}
                          </div>
                          <p className="text-sm text-foreground line-clamp-2">
                            {highlightText(msg.content, searchQuery)}
                          </p>
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-1">
                              <Badge variant="outline" className="text-xs">
                                📎 {msg.attachments.length} attachment{msg.attachments.length !== 1 ? 's' : ''}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};