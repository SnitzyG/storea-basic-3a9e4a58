import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, MessageSquare, Users2, Circle, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMessages } from '@/hooks/useMessages';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { useProjectTeam } from '@/hooks/useProjectTeam';
import { useRFIs } from '@/hooks/useRFIs';
import { useProjectSelection } from '@/context/ProjectSelectionContext';
import { ThreadCard } from '@/components/messages/ThreadCard';
import { CreateThreadDialog } from '@/components/messages/CreateThreadDialog';
import { MessageBubble } from '@/components/messages/MessageBubble';
import { MessageInput } from '@/components/messages/MessageInput';
import { TypingIndicator } from '@/components/messages/TypingIndicator';
import { cn } from '@/lib/utils';
const Messages = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('connected');
  const {
    selectedProject
  } = useProjectSelection();
  const {
    profile
  } = useAuth();
  const {
    projects
  } = useProjects();
  const {
    teamMembers: projectUsers,
    refreshTeam
  } = useProjectTeam(selectedProject?.id || '');
  const {
    createRFI
  } = useRFIs();

  // Listen for team updates to refresh team list immediately
  useEffect(() => {
    const handleTeamUpdate = (event: any) => {
      if (!selectedProject) return;
      if (event.detail?.projectId === selectedProject.id || !event.detail?.projectId) {
        refreshTeam();
      }
    };
    window.addEventListener('teamMembersUpdated', handleTeamUpdate);
    window.addEventListener('projectTeamUpdated', handleTeamUpdate);
    return () => {
      window.removeEventListener('teamMembersUpdated', handleTeamUpdate);
      window.removeEventListener('projectTeamUpdated', handleTeamUpdate);
    };
  }, [selectedProject, refreshTeam]);
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
    setTypingIndicator,
    updateThread,
    removeThread,
    pinThread,
    unpinThread,
    archiveThread,
    unarchiveThread
  } = useMessages(selectedProject?.id);

  // Handle direct messaging from project contacts
  useEffect(() => {
    const targetUserId = sessionStorage.getItem('targetUserId');
    const targetUserName = sessionStorage.getItem('targetUserName');
    const projectId = sessionStorage.getItem('currentProjectId');
    if (targetUserId && targetUserName && projectId === selectedProject?.id) {
      // Clear session storage
      sessionStorage.removeItem('targetUserId');
      sessionStorage.removeItem('targetUserName');
      sessionStorage.removeItem('currentProjectId');

      // Create or find direct message thread
      const targetUser = projectUsers.find(u => u.user_id === targetUserId);
      if (targetUser && profile?.user_id) {
        createThread(`Direct message with ${targetUserName}`, [targetUserId]);
      }
    }
  }, [projectUsers, selectedProject, profile?.user_id, createThread]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
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

  // Filter and organize threads
  const {
    pinnedThreads,
    activeThreads,
    archivedThreads
  } = useMemo(() => {
    if (!profile?.user_id) return {
      pinnedThreads: [],
      activeThreads: [],
      archivedThreads: []
    };
    const userThreads = threads.filter(thread => thread.participants.includes(profile.user_id) && thread.title.toLowerCase().includes(searchTerm.toLowerCase()));
    const pinned = userThreads.filter(thread => thread.is_pinned && !thread.is_archived);
    const archived = userThreads.filter(thread => thread.is_archived);
    const active = userThreads.filter(thread => !thread.is_pinned && !thread.is_archived);
    return {
      pinnedThreads: pinned,
      activeThreads: active,
      archivedThreads: archived
    };
  }, [threads, searchTerm, profile?.user_id]);
  const filteredTeamMembers = useMemo(() => {
    if (!profile?.user_id) return [];
    // Only show team members from current project, excluding current user
    return projectUsers.filter(user => user.user_id !== profile.user_id && (user.user_profile?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || user.role?.toLowerCase().includes(searchTerm.toLowerCase())));
  }, [projectUsers, profile?.user_id, searchTerm]);
  const getCurrentProjectName = () => {
    return selectedProject?.name || 'Select Project';
  };
  const handleCreateThread = async (title: string, participants: string[]) => {
    await createThread(title, participants);
  };
  const handleSendMessage = async (content: string, attachments?: any[], isInquiry?: boolean) => {
    await sendMessage(content, currentThread || undefined, attachments, isInquiry);
  };
  const handleCreateRFI = async (content: string, attachments?: any[]) => {
    if (!selectedProject || !profile?.user_id) return;
    try {
      await createRFI({
        project_id: selectedProject.id,
        question: content,
        priority: 'medium',
        subject: `Inquiry from Message: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
        sender_name: profile.name || 'Unknown User',
        sender_email: profile.user_id,
        // Store user ID as identifier
        category: 'Message Inquiry',
        rfi_type: 'general_correspondence'
      });
    } catch (error) {
      console.error('Error creating RFI:', error);
    }
  };
  const updateThreadTitle = (threadId: string, newTitle: string) => {
    updateThread(threadId, {
      title: newTitle
    });
  };
  const closeThread = (threadId: string) => {
    updateThread(threadId, {
      status: 'closed'
    });
  };
  const deleteThread = (threadId: string) => {
    if (confirm('Are you sure you want to delete this thread?')) {
      removeThread(threadId);
    }
  };
  const isMessageConsecutive = (currentMsg: any, previousMsg: any) => {
    if (!previousMsg) return false;
    return currentMsg.sender_id === previousMsg.sender_id && new Date(currentMsg.created_at).getTime() - new Date(previousMsg.created_at).getTime() < 300000 // 5 minutes
    ;
  };
  if (projects.length === 0) {
    return <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardContent>
            <div className="relative w-full">
              <svg viewBox="0 0 200 200" className="w-full h-auto">
                {/* Construction staging - appearing sequentially */}
                
                {/* Ground/Site preparation */}
                <rect x="30" y="170" width="140" height="20" className="fill-muted animate-[fadeInUp_0.6s_ease-out_0.2s_both]" />
                
                {/* Foundation */}
                <rect x="40" y="160" width="120" height="10" className="fill-muted-foreground animate-[fadeInUp_0.6s_ease-out_0.6s_both]" />
                
                {/* Building the frame/structure */}
                <g className="animate-[fadeInUp_0.8s_ease-out_1s_both]">
                  <rect x="50" y="120" width="100" height="40" className="fill-primary/10" stroke="hsl(var(--primary))" strokeWidth="2" />
                  {/* Frame details */}
                  <line x1="70" y1="120" x2="70" y2="160" stroke="hsl(var(--primary))" strokeWidth="1" />
                  <line x1="100" y1="120" x2="100" y2="160" stroke="hsl(var(--primary))" strokeWidth="1" />
                  <line x1="130" y1="120" x2="130" y2="160" stroke="hsl(var(--primary))" strokeWidth="1" />
                </g>
                
                {/* Roof construction */}
                <g className="animate-[fadeInUp_0.8s_ease-out_1.4s_both]">
                  <polygon points="45,120 100,80 155,120" className="fill-primary/80" />
                  {/* Roof beams */}
                  <line x1="100" y1="80" x2="75" y2="110" stroke="hsl(var(--primary-foreground))" strokeWidth="1" />
                  <line x1="100" y1="80" x2="125" y2="110" stroke="hsl(var(--primary-foreground))" strokeWidth="1" />
                </g>
                
                {/* Installing windows */}
                <g className="animate-[fadeIn_0.6s_ease-out_1.8s_both]">
                  <rect x="65" y="135" width="15" height="15" className="fill-secondary" stroke="hsl(var(--primary))" strokeWidth="1" />
                  <line x1="72.5" y1="135" x2="72.5" y2="150" className="stroke-primary" strokeWidth="1" />
                  <line x1="65" y1="142.5" x2="80" y2="142.5" className="stroke-primary" strokeWidth="1" />
                </g>
                
                <g className="animate-[fadeIn_0.6s_ease-out_2s_both]">
                  <rect x="120" y="135" width="15" height="15" className="fill-secondary" stroke="hsl(var(--primary))" strokeWidth="1" />
                  <line x1="127.5" y1="135" x2="127.5" y2="150" className="stroke-primary" strokeWidth="1" />
                  <line x1="120" y1="142.5" x2="135" y2="142.5" className="stroke-primary" strokeWidth="1" />
                </g>
                
                {/* Door installation */}
                <g className="animate-[fadeIn_0.6s_ease-out_2.2s_both]">
                  <rect x="90" y="145" width="20" height="25" className="fill-accent" stroke="hsl(var(--primary))" strokeWidth="1" />
                  <circle cx="106" cy="157" r="1.5" className="fill-primary animate-[fadeIn_0.4s_ease-out_2.8s_both]" />
                </g>
                
                {/* Final details - chimney and finishing touches */}
                <g className="animate-[fadeInUp_0.6s_ease-out_2.4s_both]">
                  <rect x="125" y="85" width="8" height="20" className="fill-muted-foreground" />
                  {/* Roofing tiles effect */}
                  <path d="M 50 120 Q 100 115 150 120" stroke="hsl(var(--primary-foreground))" strokeWidth="1" fill="none" />
                </g>
                
                 {/* Smoke - sign of life/completion */}
               <g className="animate-[fadeIn_0.8s_ease-out_3s_both]">
                 <circle cx="129" cy="80" r="2" className="fill-muted-foreground/40 animate-[float_3s_ease-in-out_3.2s_infinite]" />
                 <circle cx="131" cy="75" r="1.5" className="fill-muted-foreground/30 animate-[float_3s_ease-in-out_3.4s_infinite]" />
                 <circle cx="127" cy="72" r="1" className="fill-muted-foreground/20 animate-[float_3s_ease-in-out_3.6s_infinite]" />
               </g>
                
                {/* Landscaping - final touch */}
                <g className="animate-[fadeIn_0.6s_ease-out_3.2s_both]">
                  <ellipse cx="30" cy="175" rx="8" ry="4" className="fill-green-500/60" />
                  <ellipse cx="170" cy="175" rx="10" ry="5" className="fill-green-500/60" />
                </g>
              </svg>
              
              {/* Enhanced STOREA Lite Logo */}
              <div className="mt-6 text-center animate-[fadeIn_0.8s_ease-out_3.4s_both]">
                <h1 className="text-4xl font-bold tracking-wider">
                  <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent font-black">
                    STOREA
                  </span>
                  <span className="bg-gradient-to-r from-accent to-accent/70 bg-clip-text text-transparent font-light ml-1">
                    Lite
                  </span>
                </h1>
              </div>
            </div>
            
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold mb-2">Messages</h3>
              <p className="text-muted-foreground mb-4">
                No projects available. Create a project first to create a message.
              </p>
              <Button asChild>
                <Link to="/projects">Go to Projects</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>;
  }
  if (loading) {
    return <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Messages</h1>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading messages...</p>
        </div>
      </div>;
  }
  return <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        
        <CreateThreadDialog projectId={selectedProject?.id || ''} onCreateThread={handleCreateThread}>
          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Create New Message
          </Button>
        </CreateThreadDialog>
      </div>
      
      {/* Messages Layout */}
      <div className="h-[calc(100vh-12rem)] flex bg-background">
      {/* WhatsApp-style Sidebar */}
      <div className="w-60 border-r border-border bg-background flex flex-col">
        {/* Header with Project Info */}
        <div className="p-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
              {getCurrentProjectName().charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-sm text-foreground">{getCurrentProjectName()}</h2>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Circle className={cn("h-2 w-2 fill-current", connectionStatus === 'connected' ? 'text-green-500' : 'text-red-500')} />
                {onlineUsers.size} online
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3 w-3" />
            <Input placeholder="Search messages..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8 h-8 bg-muted/50 border-border rounded-full text-xs" />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="space-y-2">
              {/* Team Members Section */}
              <div className="px-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Team Members
                </h3>
                <div className="space-y-1">
                  {filteredTeamMembers.map(user => <div key={user.user_id} className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => {
                    const timestamp = new Date().toLocaleTimeString();
                    handleCreateThread(`Message with ${user.user_profile?.name} (${timestamp})`, [user.user_id]);
                  }}>
                      <div className="relative">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {user.user_profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        {onlineUsers.has(user.user_id) && <div className="absolute bottom-0 right-0 h-1.5 w-1.5 bg-green-500 rounded-full border border-background" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {user.user_profile?.name || 'Unknown User'}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {user.user_profile?.role || user.role}
                        </p>
                      </div>
                    </div>)}
                </div>
              </div>

              {/* Pinned Conversations */}
              {pinnedThreads.length > 0 && <div className="px-2">
                  <Separator className="mb-2" />
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Pinned
                  </h3>
                  <div className="space-y-1">
                    {pinnedThreads.map(thread => <ThreadCard key={thread.id} thread={thread} unreadCount={0} isSelected={currentThread === thread.id} isDirect={thread.participants.length === 2} onClick={() => setCurrentThread(thread.id)} onEdit={(newTitle: string) => updateThreadTitle(thread.id, newTitle)} onDelete={() => deleteThread(thread.id)} onPin={() => pinThread(thread.id)} onUnpin={() => unpinThread(thread.id)} onArchive={() => archiveThread(thread.id)} onUnarchive={() => unarchiveThread(thread.id)} />)}
                  </div>
                </div>}

              {/* Active Conversations */}
              {activeThreads.length > 0 && <div className="px-2">
                  <Separator className="mb-2" />
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Messages
                  </h3>
                  <div className="space-y-1">
                    {activeThreads.map(thread => <ThreadCard key={thread.id} thread={thread} unreadCount={0} isSelected={currentThread === thread.id} isDirect={thread.participants.length === 2} onClick={() => setCurrentThread(thread.id)} onEdit={(newTitle: string) => updateThreadTitle(thread.id, newTitle)} onDelete={() => deleteThread(thread.id)} onPin={() => pinThread(thread.id)} onUnpin={() => unpinThread(thread.id)} onArchive={() => archiveThread(thread.id)} onUnarchive={() => unarchiveThread(thread.id)} />)}
                  </div>
                </div>}

              {/* Archived Conversations */}
              {archivedThreads.length > 0 && <div className="px-2">
                  <Separator className="mb-2" />
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Archived
                  </h3>
                  <div className="space-y-1">
                    {archivedThreads.map(thread => <ThreadCard key={thread.id} thread={thread} unreadCount={0} isSelected={currentThread === thread.id} isDirect={thread.participants.length === 2} onClick={() => setCurrentThread(thread.id)} onEdit={(newTitle: string) => updateThreadTitle(thread.id, newTitle)} onDelete={() => deleteThread(thread.id)} onPin={() => pinThread(thread.id)} onUnpin={() => unpinThread(thread.id)} onArchive={() => archiveThread(thread.id)} onUnarchive={() => unarchiveThread(thread.id)} />)}
                  </div>
                </div>}

              {/* Empty state */}
              {pinnedThreads.length === 0 && activeThreads.length === 0 && archivedThreads.length === 0 && filteredTeamMembers.length === 0 && <div className="text-center py-6 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-3 opacity-50" />
                  <p className="text-xs">No messages found</p>
                  <p className="text-xs mt-1">Create a new message to get started</p>
                </div>}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-background">
        {currentThread ? <>
            {/* Chat Header */}
            <div className="border-b border-border p-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                    {threads.find(t => t.id === currentThread)?.participants.length === 2 ? <UserCircle className="h-5 w-5" /> : "#"}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {threads.find(t => t.id === currentThread)?.title || 'Unknown Conversation'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {threads.find(t => t.id === currentThread)?.participants.length} participants
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  {messages.map((message, index) => <MessageBubble key={message.id} message={message} isOwnMessage={message.sender_id === profile?.user_id} showAvatar={!isMessageConsecutive(message, messages[index - 1])} />)}
                  
                  {Array.from(typingUsers).length > 0 && <TypingIndicator typingUsers={Array.from(typingUsers)} />}
                  
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </div>

            {/* Message Input */}
            <div className="border-t border-border p-4">
              <MessageInput onSendMessage={handleSendMessage} onTyping={(isTyping: boolean) => setTypingIndicator(isTyping)} onCreateRFI={handleCreateRFI} placeholder="Type a message..." />
            </div>
          </> : <div className="flex-1 flex items-center justify-center bg-muted/10">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">Welcome to Messages</h3>
              <p className="text-muted-foreground max-w-md">
                Select a conversation to start messaging, or create a new conversation with your team members.
              </p>
            </div>
          </div>}
      </div>
      </div>
    </div>;
};
export default Messages;