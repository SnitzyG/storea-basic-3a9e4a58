import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StorealiteLogo } from '@/components/ui/storealite-logo';
import { Link } from 'react-router-dom';
import { Plus, Search, MessageSquare, Users2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useMessages } from '@/hooks/useMessages';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { useProjectTeam } from '@/hooks/useProjectTeam';
import { useRFIs } from '@/hooks/useRFIs';
import { useProjectSelection } from '@/context/ProjectSelectionContext';
import { supabase } from '@/integrations/supabase/client';
import { ThreadCard } from '@/components/messages/ThreadCard';
import { CreateThreadDialog } from '@/components/messages/CreateThreadDialog';
import { MessageBubble } from '@/components/messages/MessageBubble';
import { MessageInput } from '@/components/messages/MessageInput';
import { TypingIndicator } from '@/components/messages/TypingIndicator';
import { cn } from '@/lib/utils';

const Messages = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('connected');
  const { selectedProject } = useProjectSelection();
  const { profile } = useAuth();
  const { projects } = useProjects();
  const { teamMembers: projectUsers, refreshTeam } = useProjectTeam(selectedProject?.id || '');
  const { createRFI } = useRFIs();

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

  useEffect(() => {
    const targetUserId = sessionStorage.getItem('targetUserId');
    const targetUserName = sessionStorage.getItem('targetUserName');
    const projectId = sessionStorage.getItem('currentProjectId');
    if (targetUserId && targetUserName && projectId === selectedProject?.id) {
      sessionStorage.removeItem('targetUserId');
      sessionStorage.removeItem('targetUserName');
      sessionStorage.removeItem('currentProjectId');
      const targetUser = projectUsers.find(u => u.user_id === targetUserId);
      if (targetUser && profile?.user_id) {
        createThread(`Direct message with ${targetUserName}`, [targetUserId]);
      }
    }
  }, [projectUsers, selectedProject, profile?.user_id, createThread]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0 && profile?.user_id) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender_id !== profile.user_id) {
        markMessageAsRead(lastMessage.id);
      }
    }
  }, [messages, profile?.user_id, markMessageAsRead]);

  const { pinnedThreads, activeThreads, archivedThreads } = useMemo(() => {
    if (!profile?.user_id) return { pinnedThreads: [], activeThreads: [], archivedThreads: [] };
    const userThreads = threads.filter(thread => 
      thread.participants.includes(profile.user_id) && 
      thread.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const pinned = userThreads.filter(thread => thread.is_pinned && !thread.is_archived);
    const archived = userThreads.filter(thread => thread.is_archived);
    const active = userThreads.filter(thread => !thread.is_pinned && !thread.is_archived);
    return { pinnedThreads: pinned, activeThreads: active, archivedThreads: archived };
  }, [threads, searchTerm, profile?.user_id]);

  const filteredTeamMembers = useMemo(() => {
    if (!profile?.user_id) return [];
    return projectUsers.filter(user => 
      user.user_id !== profile.user_id && 
      (user.user_profile?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
       user.role?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [projectUsers, profile?.user_id, searchTerm]);

  const [companyName, setCompanyName] = useState<string>('COMPANY');
  
  useEffect(() => {
    const fetchCompanyName = async () => {
      if (!profile?.user_id) return;
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('company_id, companies(name)')
          .eq('user_id', profile.user_id)
          .single();
        if (profileData?.companies) {
          setCompanyName((profileData.companies as any).name || 'COMPANY');
        }
      } catch (error) {
        console.error('Error fetching company name:', error);
      }
    };
    fetchCompanyName();
  }, [profile?.user_id]);

  const getCurrentProjectName = () => selectedProject?.name || 'Select Project';

  const handleCreateThread = async (title: string, participants: string[]) => {
    await createThread(title, participants);
  };

  const handleSendMessage = async (content: string, attachments?: any[], isInquiry?: boolean) => {
    await sendMessage(content, currentThread || undefined, attachments, isInquiry);
  };

  const handleCreateRFI = async (inquiryData: {
    selectedMessages: string[];
    assignedTo: string;
    subject: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    dueDate?: string;
    attachments?: any[];
  }) => {
    if (!selectedProject || !profile?.user_id) return;
    try {
      const selectedMessageContents = messages
        .filter(msg => inquiryData.selectedMessages.includes(msg.id))
        .map(msg => {
          const senderName = 'Unknown';
          return `[${new Date(msg.created_at).toLocaleString()}] ${senderName}: ${msg.content}`;
        })
        .join('\n\n');
      const fullQuestion = `${inquiryData.subject}\n\n${inquiryData.description}\n\nBased on message history:\n${selectedMessageContents}`;
      await createRFI({
        project_id: selectedProject.id,
        question: fullQuestion,
        subject: inquiryData.subject,
        priority: inquiryData.priority,
        assigned_to: inquiryData.assignedTo,
        required_response_by: inquiryData.dueDate,
        sender_name: profile.name || 'Unknown User',
        sender_email: profile.user_id,
        category: 'Message Inquiry',
        rfi_type: 'general_correspondence',
        project_name: selectedProject.name,
        project_number: selectedProject.id,
      });
    } catch (error) {
      console.error('Error creating RFI:', error);
    }
  };

  const updateThreadTitle = (threadId: string, newTitle: string) => {
    updateThread(threadId, { title: newTitle });
  };

  const closeThread = (threadId: string) => {
    updateThread(threadId, { status: 'closed' });
  };

  const deleteThread = (threadId: string) => {
    if (confirm('Are you sure you want to delete this thread?')) {
      removeThread(threadId);
    }
  };

  const isMessageConsecutive = (currentMsg: any, previousMsg: any) => {
    if (!previousMsg) return false;
    return currentMsg.sender_id === previousMsg.sender_id && 
      new Date(currentMsg.created_at).getTime() - new Date(previousMsg.created_at).getTime() < 300000;
  };

  if (projects.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <div className="mb-6">
              <StorealiteLogo className="text-5xl" />
            </div>
            
            <h3 className="text-lg font-semibold mb-2">Messages</h3>
            <p className="text-muted-foreground mb-4">
              No projects available. Create a project or join a project first to create a message.
            </p>
            <Button asChild><Link to="/projects">Go to Projects</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
    <div className="space-y-6 mx-[25px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div></div>
        <CreateThreadDialog projectId={selectedProject?.id || ''} onCreateThread={handleCreateThread}>
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Create New Message
          </Button>
        </CreateThreadDialog>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="messages" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Messages
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users2 className="h-4 w-4" />
            Team Members
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="messages" className="space-y-6">
          {/* Messages Layout */}
          <div className="flex-1 flex bg-background min-h-[calc(100vh-200px)]">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-muted/5">
          {currentThread ? (
            <>
              <div className="border-b border-border p-3 bg-background flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xs font-semibold">
                  {threads.find(t => t.id === currentThread)?.title?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-foreground">
                    {threads.find(t => t.id === currentThread)?.title}
                  </h3>
                  {typingUsers.size > 0 && (
                    <p className="text-xs text-muted-foreground">
                      <TypingIndicator typingUsers={Array.from(typingUsers)} />
                    </p>
                  )}
                </div>
                {threads.find(t => t.id === currentThread)?.status === 'closed' && (
                  <Badge variant="secondary" className="text-xs">CLOSED</Badge>
                )}
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-1">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm py-8">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    messages.map((message, index) => {
                      const previousMessage = index > 0 ? messages[index - 1] : null;
                      const isConsecutive = isMessageConsecutive(message, previousMessage);
                      const isOwnMessage = message.sender_id === profile?.user_id;
                      const showAvatar = !isConsecutive;
                      return (
                        <MessageBubble 
                          key={message.id} 
                          message={message} 
                          isOwnMessage={isOwnMessage} 
                          showAvatar={showAvatar} 
                          senderName={projectUsers.find(u => u.user_id === message.sender_id)?.user_profile?.name || 'Unknown'} 
                          isConsecutive={isConsecutive}
                        />
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {threads.find(t => t.id === currentThread)?.status !== 'closed' && (
                <div className="border-t border-border bg-background p-3">
                  <MessageInput 
                    onSendMessage={handleSendMessage} 
                    onTyping={(isTyping: boolean) => setTypingIndicator(isTyping)} 
                    onCreateRFI={handleCreateRFI} 
                    placeholder="Type a message..." 
                    supportAttachments={true}
                    supportMentions={true}
                    projectUsers={projectUsers}
                    projectId={selectedProject?.id}
                    messages={messages}
                    currentUserId={profile?.user_id}
                    companyName={companyName}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center space-y-4">
                <MessageSquare className="h-16 w-16 mx-auto opacity-20" />
                <div>
                  <h3 className="text-lg font-semibold mb-1 text-foreground">No conversation selected</h3>
                  <p className="text-sm">Choose a conversation from the sidebar or create a new one</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-60 border-l border-border bg-background flex flex-col">
          <div className="p-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                {getCurrentProjectName().charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-sm text-foreground">{getCurrentProjectName()}</h2>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Circle className={cn("h-2 w-2 fill-current", connectionStatus === 'connected' ? 'text-construction-success' : 'text-destructive')} />
                  {onlineUsers.size} online
                </div>
              </div>
            </div>
          </div>

          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3 w-3" />
              <Input 
                placeholder="Search messages..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="pl-8 h-8 bg-muted/50 border-border rounded-full text-xs" 
              />
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-2 px-2 py-2">
                {pinnedThreads.length > 0 && (
                  <>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Pinned</h3>
                    {pinnedThreads.map(thread => (
                      <ThreadCard 
                        key={thread.id} 
                        thread={thread} 
                        onClick={() => setCurrentThread(thread.id)} 
                        isSelected={currentThread === thread.id} 
                        unreadCount={0}
                        onEdit={(title) => updateThreadTitle(thread.id, title)} 
                        onClose={() => closeThread(thread.id)} 
                        onDelete={() => deleteThread(thread.id)} 
                        onPin={thread.is_pinned ? undefined : () => pinThread(thread.id)} 
                        onUnpin={thread.is_pinned ? () => unpinThread(thread.id) : undefined} 
                        onArchive={() => archiveThread(thread.id)} 
                      />
                    ))}
                    <Separator className="my-2" />
                  </>
                )}
                
                {activeThreads.length > 0 ? (
                  <div className="space-y-1">
                    {activeThreads.map(thread => (
                      <ThreadCard 
                        key={thread.id} 
                        thread={thread} 
                        onClick={() => setCurrentThread(thread.id)} 
                        isSelected={currentThread === thread.id} 
                        unreadCount={0}
                        onEdit={(title) => updateThreadTitle(thread.id, title)} 
                        onClose={() => closeThread(thread.id)} 
                        onDelete={() => deleteThread(thread.id)} 
                        onPin={() => pinThread(thread.id)} 
                        onUnpin={thread.is_pinned ? () => unpinThread(thread.id) : undefined} 
                        onArchive={() => archiveThread(thread.id)} 
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-xs">No active conversations</div>
                )}
                
                {archivedThreads.length > 0 && (
                  <>
                    <Separator className="my-2" />
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Archived</h3>
                    {archivedThreads.map(thread => (
                      <ThreadCard 
                        key={thread.id} 
                        thread={thread} 
                        onClick={() => setCurrentThread(thread.id)} 
                        isSelected={currentThread === thread.id} 
                        unreadCount={0}
                        onEdit={(title) => updateThreadTitle(thread.id, title)} 
                        onClose={() => closeThread(thread.id)} 
                        onDelete={() => deleteThread(thread.id)} 
                        onUnarchive={() => unarchiveThread(thread.id)} 
                      />
                    ))}
                  </>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
          </div>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input 
                    placeholder="Search team members..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    className="pl-10" 
                  />
                </div>

                {filteredTeamMembers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users2 className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground">
                      {searchTerm ? 'No team members found' : 'No team members in this project'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredTeamMembers.map((member) => {
                      const isOnline = onlineUsers.has(member.user_id);
                      return (
                        <div
                          key={member.user_id}
                          className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => {
                            if (profile?.user_id) {
                              createThread(`Direct message with ${member.user_profile?.name || 'User'}`, [member.user_id]);
                            }
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                                {(member.user_profile?.name || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div className={cn(
                                "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background",
                                isOnline ? "bg-construction-success" : "bg-muted-foreground"
                              )} />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">
                                {member.user_profile?.name || 'Unknown User'}
                              </p>
                              <p className="text-sm text-muted-foreground capitalize">
                                {member.role || 'No role'}
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Messages;
