import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, MessageSquare, Users2, Wifi, WifiOff, UserCircle, Circle } from 'lucide-react';
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
import { ThreadCard } from '@/components/messages/ThreadCard';
import { CreateThreadDialog } from '@/components/messages/CreateThreadDialog';
import { MessageBubble } from '@/components/messages/MessageBubble';
import { MessageInput } from '@/components/messages/MessageInput';
import { TypingIndicator } from '@/components/messages/TypingIndicator';
const Messages = () => {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [messageType, setMessageType] = useState<'direct' | 'group'>('direct');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('connected');
  const {
    profile
  } = useAuth();
  const {
    projects
  } = useProjects();
  const {
    teamMembers: projectUsers,
    refreshTeam
  } = useProjectTeam(selectedProject || '');
  const {
    createRFI
  } = useRFIs(selectedProject || '');

  // Listen for team updates to refresh team list immediately
  useEffect(() => {
    const handleTeamUpdate = (event: any) => {
      if (!selectedProject) return;
      if (event.detail?.projectId === selectedProject || !event.detail?.projectId) {
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
    removeThread
  } = useMessages(selectedProject);

  // Set default project
  useEffect(() => {
    if (!selectedProject && projects.length > 0) {
      setSelectedProject(projects[0].id);
    }
  }, [projects, selectedProject]);

  // No longer needed as we use useTeamSync hook

  // Handle direct messaging from project contacts
  useEffect(() => {
    const targetUserId = sessionStorage.getItem('targetUserId');
    const targetUserName = sessionStorage.getItem('targetUserName');
    const projectId = sessionStorage.getItem('currentProjectId');
    if (targetUserId && targetUserName && projectId === selectedProject) {
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

  // No longer needed as we use useTeamSync hook which handles updates automatically

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
  const filteredThreads = useMemo(() => {
    const filtered = threads.filter(thread => thread.title.toLowerCase().includes(searchTerm.toLowerCase()));

    // Filter by message type
    if (messageType === 'direct') {
      return filtered.filter(thread => thread.participants.length === 2);
    } else {
      return filtered.filter(thread => thread.participants.length > 2);
    }
  }, [threads, searchTerm, messageType]);
  const getCurrentProjectName = () => {
    const project = projects.find(p => p.id === selectedProject);
    return project?.name || 'Select Project';
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
        project_id: selectedProject,
        question: content,
        priority: 'medium',
        subject: `Inquiry from Message: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
        sender_name: profile.name || 'Unknown User',
        sender_email: profile.user_id,
        // Store user ID as identifier
        category: 'Message Inquiry'
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
                  <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    STOREA
                  </span>
                  <span className="text-lg font-light text-muted-foreground ml-1 relative">
                    Lite
                    <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent"></div>
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
  return <div className="h-[calc(100vh-8rem)] flex gap-6 px-[25px]">
      {/* Sidebar */}
      <div className="w-80 flex flex-col">
        {/* Project Header */}
        

        {/* Messages Management */}
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Messages</CardTitle>
              {projects.length > 0 ? (
                <CreateThreadDialog projectId={selectedProject} onCreateThread={handleCreateThread}>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </CreateThreadDialog>
              ) : (
                <Button size="sm" variant="outline" disabled>
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col pt-0">
            {projects.length > 0 ? (
              <>
                {/* Message Type Selector */}
                <div className="flex mb-4 bg-muted rounded-lg p-1">
                  <Button variant={messageType === 'direct' ? 'default' : 'ghost'} size="sm" className="flex-1" onClick={() => setMessageType('direct')}>
                    <UserCircle className="h-4 w-4 mr-2" />
                    Direct
                  </Button>
                  <Button variant={messageType === 'group' ? 'default' : 'ghost'} size="sm" className="flex-1" onClick={() => setMessageType('group')}>
                    <Users2 className="h-4 w-4 mr-2" />
                    Group
                  </Button>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input placeholder={`Search ${messageType} messages...`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
                </div>

                {/* Thread List */}
                <ScrollArea className="flex-1">
                  <div className="space-y-2">
                    {filteredThreads.map(thread => {
                    const isDirect = thread.participants.length === 2;
                    return <ThreadCard key={thread.id} thread={thread} unreadCount={0} // TODO: Calculate unread count
                    isSelected={currentThread === thread.id} onClick={() => setCurrentThread(thread.id)} isDirect={isDirect} onEdit={title => updateThreadTitle(thread.id, title)} onClose={() => closeThread(thread.id)} onDelete={() => deleteThread(thread.id)} />;
                  })}
                    
                    {filteredThreads.length === 0 && selectedProject && <div className="text-center py-8">
                        <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          No {messageType} messages found
                        </p>
                      </div>}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Messages</h3>
                <p className="text-muted-foreground">
                  No projects available. Create a project first to create a message.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col">
        {selectedProject ? <>
            {/* Chat Header */}
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {currentThread ? threads.find(t => t.id === currentThread)?.title || 'Thread' : `${getCurrentProjectName()} - ${messageType === 'direct' ? 'Direct Messages' : 'Group Messages'}`}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Users2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {currentThread ? `${threads.find(t => t.id === currentThread)?.participants.length || 0} participants` : 'Project team'}
                  </span>
                </div>
              </div>
              
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-1">
                {messages.map((message, index) => {
                const previousMessage = messages[index - 1];
                const isConsecutive = isMessageConsecutive(message, previousMessage);
                const senderProfile = projectUsers.find(u => u.user_id === message.sender_id);
                return <MessageBubble key={message.id} message={message} isOwnMessage={message.sender_id === profile?.user_id} senderName={senderProfile?.user_profile?.name || 'User'} isConsecutive={isConsecutive} />;
              })}
                <div ref={messagesEndRef} />
              </div>
              
              <TypingIndicator typingUsers={Array.from(typingUsers)} currentUserId={profile?.user_id} />
            </ScrollArea>

            {/* Message Input */}
            <MessageInput onSendMessage={handleSendMessage} onTyping={setTypingIndicator} placeholder={`Message ${currentThread ? 'thread' : messageType + ' conversation'}...`} supportAttachments={true} supportMentions={true} projectUsers={projectUsers} projectId={selectedProject} onCreateRFI={handleCreateRFI} />
          </CardContent>
          </> : <CardContent className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Select a Project</h3>
              <p className="text-muted-foreground">
                Choose a project to start messaging with your team
              </p>
            </div>
          </CardContent>}
      </Card>

      {/* Contact List Panel */}
      {selectedProject && <Card className="w-80 flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users2 className="h-4 w-4" />
              Project Team ({projectUsers.length})
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 pt-0">
            <ScrollArea className="h-full">
              <div className="space-y-2">
                 {projectUsers.map(member => {
              const isOnline = onlineUsers.has(member.user_id) || member.isOnline;
              const userProfile = member.user_profile;
              return <div key={member.user_id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer border border-transparent hover:border-border transition-all group" onClick={() => {
                // Start direct message with this user
                if (userProfile && profile?.user_id && member.user_id !== profile.user_id) {
                  createThread(`Direct message with ${userProfile.name}`, [member.user_id]);
                }
              }}>
                       <div className="relative">
                         <Avatar className="h-10 w-10">
                           <AvatarFallback className="bg-primary/10 text-primary font-medium">
                             {(userProfile?.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase()}
                           </AvatarFallback>
                         </Avatar>
                         <Circle className={`h-3 w-3 absolute -bottom-0.5 -right-0.5 border-2 border-background rounded-full ${isOnline ? 'fill-construction-success text-construction-success' : 'fill-muted text-muted'}`} />
                       </div>
                       
                       <div className="flex-1 min-w-0">
                         <div className="text-sm font-medium truncate">{userProfile?.name || 'Unknown User'}</div>
                         <div className="text-xs text-muted-foreground capitalize">{member.role}</div>
                       </div>
                       <div className="text-xs text-muted-foreground">
                         {isOnline ? 'Online' : 'Offline'}
                       </div>
                     </div>;
            })}
                
                {projectUsers.length === 0 && <div className="text-center py-8">
                    <Users2 className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No team members found</p>
                  </div>}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>}
    </div>;
};
export default Messages;