import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useProjectSelection } from '@/context/ProjectSelectionContext';

export interface MessageThread {
  id: string;
  project_id: string;
  title: string;
  participants: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
  status?: string;
  is_pinned?: boolean;
  is_archived?: boolean;
}

export interface Message {
  id: string;
  project_id: string;
  thread_id?: string | null;
  sender_id: string;
  content: string;
  message_type?: string;
  attachments?: any;
  created_at: string;
  updated_at: string;
}

export interface MessageParticipant {
  id: string;
  message_id: string;
  user_id: string;
  read_at?: string;
  created_at: string;
}

export const useMessages = (projectId?: string) => {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentThread, setCurrentThread] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { selectedProject } = useProjectSelection();

  // Use selectedProject.id if no projectId is provided
  const activeProjectId = projectId || selectedProject?.id;

  const fetchThreads = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !activeProjectId) {
        setThreads([]);
        return;
      }

      // CRITICAL: Only fetch threads where the current user is a participant
      let query = supabase
        .from('message_threads')
        .select('*')
        .eq('project_id', activeProjectId)
        .contains('participants', [user.id])  // User must be in participants array
        .order('updated_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching threads:', error);
        throw error;
      }
      
      // Double-check client-side that user is truly a participant
      const userThreads = (data || []).filter(thread => 
        thread.participants && thread.participants.includes(user.id)
      );
      
      setThreads(userThreads);
    } catch (error) {
      console.error('Error fetching threads:', error);
      toast({
        title: "Error",
        description: "Failed to fetch message threads",
        variant: "destructive",
      });
      setThreads([]);
    } finally {
      setLoading(false);
    }
  }, [activeProjectId, toast]);

  // Refresh data when selected project changes
  useEffect(() => {
    fetchThreads();
  }, [activeProjectId, fetchThreads]);

  const fetchMessages = useCallback(async (threadId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !activeProjectId) {
        setMessages([]);
        return;
      }

      let query = supabase
        .from('messages')
        .select('*')
        .eq('project_id', activeProjectId)
        .order('created_at', { ascending: true });

      if (threadId) {
        // For threaded messages, verify user is participant of the thread
        const { data: threadData } = await supabase
          .from('message_threads')
          .select('participants')
          .eq('id', threadId)
          .single();
        
        if (!threadData || !threadData.participants.includes(user.id)) {
          console.warn('User not authorized to view this thread');
          setMessages([]);
          return;
        }
        
        query = query.eq('thread_id', threadId);
      } else {
        // For direct messages (no thread), only show messages user sent or received
        query = query.is('thread_id', null);
        // Note: RLS policies will handle filtering for project members
      }

      const { data, error } = await query;

      if (error) throw error;
      const messagesData = (data || []).map(msg => ({
        ...msg,
        attachments: Array.isArray(msg.attachments) ? msg.attachments : []
      }));
      setMessages(messagesData);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to fetch messages",
        variant: "destructive",
      });
      setMessages([]);
    }
  }, [activeProjectId, toast]);

  const createThread = async (title: string, participants: string[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !activeProjectId) throw new Error('User not authenticated or no project selected');

      // Ensure all participants are valid UUIDs and include current user
      const validParticipants = [user.id, ...participants.filter(p => {
        // Check if it's a valid UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(p) && p !== user.id;
      })];

      if (validParticipants.length < 2) {
        throw new Error('At least one other participant is required');
      }

      console.log('Creating thread with validated participants:', validParticipants);

      const { data, error } = await supabase
        .from('message_threads')
        .insert({
          project_id: activeProjectId,
          title,
          participants: validParticipants,
          created_by: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating thread:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      console.log('Thread created successfully:', data);

      await fetchThreads();
      setCurrentThread(data.id);
      return data;
    } catch (error) {
      console.error('Error creating thread:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: "Error",
        description: `Failed to create message thread: ${errorMessage}`,
        variant: "destructive",
      });
      return null;
    }
  };

  const updateThread = async (threadId: string, updates: Partial<MessageThread>) => {
    try {
      const { error } = await supabase
        .from('message_threads')
        .update(updates)
        .eq('id', threadId);

      if (error) throw error;
      
      await fetchThreads();
      
      toast({
        title: "Success",
        description: "Thread updated successfully",
      });
    } catch (error) {
      console.error('Error updating thread:', error);
      toast({
        title: "Error",
        description: "Failed to update thread",
        variant: "destructive",
      });
    }
  };


  const removeThread = async (threadId: string) => {
    try {
      const { error } = await supabase
        .from('message_threads')
        .delete()
        .eq('id', threadId);

      if (error) throw error;
      
      await fetchThreads();
      
      if (currentThread === threadId) {
        setCurrentThread(null);
      }
      
      toast({
        title: "Success",
        description: "Thread deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting thread:', error);
      toast({
        title: "Error",
        description: "Failed to delete thread",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async (content: string, threadId?: string, attachments?: any[], isInquiry?: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !activeProjectId) throw new Error('User not authenticated or no project selected');

      const messageData = {
        project_id: activeProjectId,
        thread_id: threadId || null,
        sender_id: user.id,
        content,
        message_type: isInquiry ? 'inquiry' : 'text',
        attachments: attachments || []
      };

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();

      if (error) throw error;

      // Log activity for new message
      await supabase
        .from('activity_log')
        .insert([{
          user_id: user.id,
          project_id: activeProjectId,
          entity_type: 'message',
          entity_id: data.id,
          action: 'created',
          description: `Posted a new message${threadId ? ' in thread' : ''}: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
          metadata: { thread_id: threadId, content_preview: content.substring(0, 100) }
        }]);

      // Mark message as read for the sender
      await markMessageAsRead(data.id, user.id);

      // Update thread's updated_at if it's a threaded message
      if (threadId) {
        await supabase
          .from('message_threads')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', threadId);
      }

      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
      return null;
    }
  };

  const markMessageAsRead = async (messageId: string, userId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const readerId = userId || user?.id;
      if (!readerId) return;

      const { error } = await supabase
        .from('message_participants')
        .upsert({
          message_id: messageId,
          user_id: readerId,
          read_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const getUnreadCount = async (threadId?: string): Promise<number> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !activeProjectId) return 0;

      // Base query for messages in this project
      let query = supabase
        .from('messages')
        .select('id', { count: 'exact' })
        .eq('project_id', activeProjectId)
        .neq('sender_id', user.id); // Exclude messages sent by current user

      if (threadId) {
        // For threaded messages, verify user is participant first
        const { data: threadData } = await supabase
          .from('message_threads')
          .select('participants')
          .eq('id', threadId)
          .single();
        
        if (!threadData || !threadData.participants.includes(user.id)) {
          return 0; // User not authorized to view this thread
        }
        
        query = query.eq('thread_id', threadId);
      } else {
        query = query.is('thread_id', null);
      }

      // Get messages not marked as read
      const { data: unreadMessages, error } = await query;

      if (error) throw error;

      // Check which messages are unread
      const { data: readStatuses, error: readError } = await supabase
        .from('message_participants')
        .select('message_id')
        .eq('user_id', user.id)
        .not('read_at', 'is', null);

      if (readError) throw readError;

      const readMessageIds = new Set(readStatuses?.map(r => r.message_id) || []);
      const unreadCount = (unreadMessages || []).filter(m => !readMessageIds.has(m.id)).length;

      return unreadCount;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  };

  // Real-time subscriptions
  useEffect(() => {
    if (!activeProjectId) return;

    console.log('Setting up realtime subscriptions for project:', activeProjectId);

    // Subscribe to message changes - only for user's accessible threads
    const messagesChannel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `project_id=eq.${activeProjectId}`
        },
        async (payload) => {
          console.log('New message received:', payload);
          const newMessage = {
            ...payload.new,
            attachments: Array.isArray(payload.new.attachments) ? payload.new.attachments : []
          } as Message;
          
          // Verify user can access this message
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          
          // If it's a threaded message, check thread participation
          if (newMessage.thread_id) {
            const { data: threadData } = await supabase
              .from('message_threads')
              .select('participants')
              .eq('id', newMessage.thread_id)
              .single();
            
            if (!threadData || !threadData.participants.includes(user.id)) {
              return; // User not authorized to see this message
            }
          }
          
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `project_id=eq.${activeProjectId}`
        },
        async (payload) => {
          console.log('Message updated:', payload);
          const updatedMessage = {
            ...payload.new,
            attachments: Array.isArray(payload.new.attachments) ? payload.new.attachments : []
          } as Message;
          
          // Verify user can access this message
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          
          // If it's a threaded message, check thread participation
          if (updatedMessage.thread_id) {
            const { data: threadData } = await supabase
              .from('message_threads')
              .select('participants')
              .eq('id', updatedMessage.thread_id)
              .single();
            
            if (!threadData || !threadData.participants.includes(user.id)) {
              return; // User not authorized to see this message
            }
          }
          
          setMessages(prev => prev.map(msg => 
            msg.id === updatedMessage.id ? updatedMessage : msg
          ));
        }
      )
      .subscribe();

    // Subscribe to thread changes - only for user's accessible threads
    const threadsChannel = supabase
      .channel('threads-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_threads',
          filter: `project_id=eq.${activeProjectId}`
        },
        async (payload) => {
          console.log('Thread changed:', payload);
          // Only refresh if user is involved in this thread
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          
           const threadData: any = payload.new || payload.old;
           if (threadData && 
               threadData.participants && 
               Array.isArray(threadData.participants) && 
               threadData.participants.includes(user.id)) {
             fetchThreads();
           }
        }
      )
      .subscribe();

    // Presence for online users and typing indicators
    const presenceChannel = supabase
      .channel(`project-${activeProjectId}-presence`)
      .on('presence', { event: 'sync' }, () => {
        const newState = presenceChannel.presenceState();
        const users = new Set<string>();
        Object.values(newState).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            if (presence.user_id) users.add(presence.user_id);
          });
        });
        setOnlineUsers(users);
        console.log('Online users:', users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await presenceChannel.track({
              user_id: user.id,
              online_at: new Date().toISOString(),
            });
          }
        }
      });

    return () => {
      console.log('Cleaning up realtime subscriptions');
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(threadsChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, [activeProjectId, fetchThreads]);

  // Initial data load
  useEffect(() => {
    if (activeProjectId) {
      fetchThreads();
      if (currentThread) {
        fetchMessages(currentThread);
      } else {
        fetchMessages(); // Fetch direct messages
      }
    }
  }, [activeProjectId, currentThread, fetchThreads, fetchMessages]);

  const setTypingIndicator = useCallback(async (isTyping: boolean) => {
    if (!activeProjectId) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (isTyping) {
      setTypingUsers(prev => new Set([...prev, user.id]));
    } else {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(user.id);
        return newSet;
      });
    }
  }, [activeProjectId]);

  const pinThread = async (threadId: string) => {
    await updateThread(threadId, { is_pinned: true });
  };

  const unpinThread = async (threadId: string) => {
    await updateThread(threadId, { is_pinned: false });
  };

  const archiveThread = async (threadId: string) => {
    await updateThread(threadId, { is_archived: true });
  };

  const unarchiveThread = async (threadId: string) => {
    await updateThread(threadId, { is_archived: false });
  };

  return {
    threads,
    messages,
    currentThread,
    setCurrentThread,
    loading,
    onlineUsers,
    typingUsers,
    fetchThreads,
    fetchMessages,
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
  };
};