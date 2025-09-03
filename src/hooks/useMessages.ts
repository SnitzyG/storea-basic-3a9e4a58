import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MessageThread {
  id: string;
  project_id: string;
  title: string;
  participants: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
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

  const fetchThreads = useCallback(async (filterProjectId?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('message_threads')
        .select('*')
        .order('updated_at', { ascending: false });

      if (filterProjectId) {
        query = query.eq('project_id', filterProjectId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setThreads(data || []);
    } catch (error) {
      console.error('Error fetching threads:', error);
      toast({
        title: "Error",
        description: "Failed to fetch message threads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchMessages = useCallback(async (threadId?: string) => {
    try {
      let query = supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (threadId) {
        query = query.eq('thread_id', threadId);
      } else if (projectId) {
        query = query.eq('project_id', projectId).is('thread_id', null);
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
    }
  }, [projectId, toast]);

  const createThread = async (title: string, participants: string[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !projectId) throw new Error('User not authenticated or no project selected');

      // Ensure all participants are valid UUIDs and include current user
      const validParticipants = [user.id, ...participants.filter(p => {
        // Check if it's a valid UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(p) && p !== user.id;
      })];

      const { data, error } = await supabase
        .from('message_threads')
        .insert({
          project_id: projectId,
          title,
          participants: validParticipants,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Message thread created successfully",
      });

      await fetchThreads(projectId);
      setCurrentThread(data.id);
      return data;
    } catch (error) {
      console.error('Error creating thread:', error);
      toast({
        title: "Error",
        description: "Failed to create message thread. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const sendMessage = async (content: string, threadId?: string, attachments?: any[]) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !projectId) throw new Error('User not authenticated or no project selected');

      const messageData = {
        project_id: projectId,
        thread_id: threadId || null,
        sender_id: user.id,
        content,
        message_type: 'text',
        attachments: attachments || []
      };

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();

      if (error) throw error;

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
      if (!user) return 0;

      let query = supabase
        .from('messages')
        .select('id', { count: 'exact' })
        .eq('project_id', projectId)
        .neq('sender_id', user.id);

      if (threadId) {
        query = query.eq('thread_id', threadId);
      } else {
        query = query.is('thread_id', null);
      }

      // Get messages not in message_participants or with null read_at
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
    if (!projectId) return;

    console.log('Setting up realtime subscriptions for project:', projectId);

    // Subscribe to message changes
    const messagesChannel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          console.log('New message received:', payload);
          const newMessage = {
            ...payload.new,
            attachments: Array.isArray(payload.new.attachments) ? payload.new.attachments : []
          } as Message;
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          console.log('Message updated:', payload);
          const updatedMessage = {
            ...payload.new,
            attachments: Array.isArray(payload.new.attachments) ? payload.new.attachments : []
          } as Message;
          setMessages(prev => prev.map(msg => 
            msg.id === updatedMessage.id ? updatedMessage : msg
          ));
        }
      )
      .subscribe();

    // Subscribe to thread changes
    const threadsChannel = supabase
      .channel('threads-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_threads',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          console.log('Thread changed:', payload);
          fetchThreads(projectId);
        }
      )
      .subscribe();

    // Presence for online users and typing indicators
    const presenceChannel = supabase
      .channel(`project-${projectId}-presence`)
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
  }, [projectId, fetchThreads]);

  // Initial data load
  useEffect(() => {
    if (projectId) {
      fetchThreads(projectId);
      if (currentThread) {
        fetchMessages(currentThread);
      } else {
        fetchMessages(); // Fetch direct messages
      }
    }
  }, [projectId, currentThread, fetchThreads, fetchMessages]);

  const setTypingIndicator = useCallback(async (isTyping: boolean) => {
    if (!projectId) return;

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
  }, [projectId]);

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
    setTypingIndicator
  };
};