import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Search, MessageSquare, Users2, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useMessages } from '@/hooks/useMessages';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { ThreadCard } from '@/components/messages/ThreadCard';
import { CreateThreadDialog } from '@/components/messages/CreateThreadDialog';
import { MessageBubble } from '@/components/messages/MessageBubble';
import { MessageInput } from '@/components/messages/MessageInput';
import { TypingIndicator } from '@/components/messages/TypingIndicator';

const Messages = () => {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('connected');
  
  const { profile } = useAuth();
  const { projects } = useProjects();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    threads,
    messages,
    currentThread,
    setCurrentThread,
    loading,
    onlineUsers,
    typingUsers,
    createThread,
    sendMessage,
    markMessageAsRead,
    getUnreadCount,
    setTypingIndicator
  } = useMessages(selectedProject);

  // Set default project
  useEffect(() => {
    if (!selectedProject && projects.length > 0) {
      setSelectedProject(projects[0].id);
    }
  }, [projects, selectedProject]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when viewing them
  useEffect(() => {
    if (messages.length > 0 && profile?.user_id) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender_id !== profile.user_id) {
        markMessageAsRead(lastMessage.id);
      }
    }
  }, [messages, profile?.user_id, markMessageAsRead]);

  const filteredThreads = useMemo(() => {
    return threads.filter(thread =>
      thread.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [threads, searchTerm]);

  const getCurrentProjectName = () => {
    const project = projects.find(p => p.id === selectedProject);
    return project?.name || 'Select Project';
  };

  const handleCreateThread = async (title: string, participants: string[]) => {
    await createThread(title, participants);
  };

  const handleSendMessage = async (content: string, attachments?: any[]) => {
    await sendMessage(content, currentThread || undefined, attachments);
  };

  const isMessageConsecutive = (currentMsg: any, previousMsg: any) => {
    if (!previousMsg) return false;
    return (
      currentMsg.sender_id === previousMsg.sender_id &&
      new Date(currentMsg.created_at).getTime() - new Date(previousMsg.created_at).getTime() < 300000 // 5 minutes
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Messages</h1>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* Sidebar */}
      <div className="w-80 flex flex-col">
        {/* Project Selector */}
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Project</CardTitle>
              <div className="flex items-center gap-1">
                {connectionStatus === 'connected' ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
                <Badge variant="outline" className="text-xs">
                  {onlineUsers.size} online
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full p-2 border rounded-lg bg-background"
            >
              <option value="">Select Project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        {/* Thread Management */}
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Threads</CardTitle>
              <CreateThreadDialog
                projectId={selectedProject}
                onCreateThread={handleCreateThread}
              >
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </CreateThreadDialog>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col pt-0">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search threads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Direct Messages Option */}
            <div className="mb-2">
              <Card 
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                  !currentThread ? 'ring-2 ring-primary bg-muted/50' : ''
                }`}
                onClick={() => setCurrentThread(null)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Direct Messages</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Separator className="my-2" />

            {/* Thread List */}
            <ScrollArea className="flex-1">
              <div className="space-y-2">
                {filteredThreads.map((thread) => (
                  <ThreadCard
                    key={thread.id}
                    thread={thread}
                    unreadCount={0} // TODO: Calculate unread count
                    isSelected={currentThread === thread.id}
                    onClick={() => setCurrentThread(thread.id)}
                  />
                ))}
                
                {filteredThreads.length === 0 && selectedProject && (
                  <div className="text-center py-8">
                    <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No threads found</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col">
        {selectedProject ? (
          <>
            {/* Chat Header */}
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {currentThread 
                      ? threads.find(t => t.id === currentThread)?.title || 'Thread'
                      : `${getCurrentProjectName()} - Direct Messages`
                    }
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Users2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {currentThread
                        ? `${threads.find(t => t.id === currentThread)?.participants.length || 0} participants`
                        : 'Project team'
                      }
                    </span>
                  </div>
                </div>
                
                <Badge variant="outline">
                  {onlineUsers.size} online
                </Badge>
              </div>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 flex flex-col p-0">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-1">
                  {messages.map((message, index) => {
                    const previousMessage = messages[index - 1];
                    const isConsecutive = isMessageConsecutive(message, previousMessage);
                    
                    return (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        isOwnMessage={message.sender_id === profile?.user_id}
                        senderName="User" // TODO: Get sender name from profiles
                        isConsecutive={isConsecutive}
                      />
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
                
                <TypingIndicator 
                  typingUsers={Array.from(typingUsers)} 
                  currentUserId={profile?.user_id}
                />
              </ScrollArea>

              {/* Message Input */}
              <MessageInput
                onSendMessage={handleSendMessage}
                onTyping={setTypingIndicator}
                placeholder={`Message ${currentThread ? 'thread' : 'project team'}...`}
              />
            </CardContent>
          </>
        ) : (
          <CardContent className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Select a Project</h3>
              <p className="text-muted-foreground">
                Choose a project to start messaging with your team
              </p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default Messages;