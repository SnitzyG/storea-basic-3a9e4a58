import { localDB } from '@/services/localDB';

export const supabase = {
  from: (table: any) => {
    return localDB.from(table);
  },

  // Realtime
  channel: (name: string) => {
    return new MockRealtimeChannel(name);
  },
  removeChannel: (channel: any) => {
    if (channel && typeof channel.unsubscribe === 'function') {
      channel.unsubscribe();
    }
  },

  // Auth
  auth: {
    getUser: async () => ({
      data: {
        user: {
          id: 'mock-user-id',
          email: 'richard@storea.com',
          user_metadata: { name: 'Richard Architect', role: 'architect' },
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString()
        }
      },
      error: null
    }),
    getSession: async () => ({
      data: {
        session: {
          access_token: 'mock-token',
          refresh_token: 'mock-refresh',
          expires_in: 3600,
          token_type: 'bearer',
          user: {
            id: 'mock-user-id',
            email: 'richard@storea.com',
            user_metadata: { name: 'Richard Architect', role: 'architect' },
            app_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString()
          }
        }
      },
      error: null
    }),
    onAuthStateChange: (callback: any) => {
      // Immediately trigger signed in state
      callback('SIGNED_IN', {
        user: { id: 'mock-user-id', email: 'richard@storea.com' }
      });
      return { data: { subscription: { unsubscribe: () => { } } } };
    },
    signOut: async () => ({ error: null }),
    signUp: async () => ({ data: { user: null, session: null }, error: null }),
    signInWithPassword: async () => ({ data: { user: { id: 'mock-user-id' }, session: {} }, error: null })
  },

  // RPC
  rpc: async (func: string, params: any) => {
    console.log(`[MockRPC] Calling ${func}`, params);
    return { data: true, error: null };
  },

  // Storage
  storage: {
    from: (bucket: string) => ({
      upload: async (path: string, file: any) => {
        console.log(`[MockStorage] Uploaded ${path} to ${bucket}`);
        return { data: { path }, error: null };
      },
      getPublicUrl: (path: string) => {
        return { data: { publicUrl: `https://placehold.co/600x400?text=${encodeURIComponent(path)}` } };
      },
      download: async () => ({ data: new Blob(['mock content']), error: null })
    })
  }
};

// Robust Realtime Channel Mock using LocalDB events
class MockRealtimeChannel {
  name: string;
  subscriptions: any[] = [];

  constructor(name: string) {
    this.name = name;
  }

  on(type: string, filter: any, callback: (payload: any) => void) {
    if (type === 'postgres_changes') {
      // Map postgres filter to localDB subscription
      // filter example: { event: '*', schema: 'public', table: 'messages' }
      const tableName = filter.table;
      const channelName = `${tableName}-changes`;

      const sub = localDB.subscribe(channelName, (payload) => {
        // Apply event filter (INSERT/UPDATE/DELETE)
        if (filter.event !== '*' && filter.event !== payload.eventType) return;

        // Apply row-level filter (e.g. filter: "project_id=eq.123")
        if (filter.filter) {
          const [col, val] = filter.filter.split('=eq.');
          if (col && val) {
            const record = payload.new || payload.old;
            if (record && String(record[col]) !== String(val)) return;
          }
        }

        callback(payload);
      });

      this.subscriptions.push(sub);
    }
    return this;
  }

  subscribe(callback?: (status: string) => void) {
    setTimeout(() => callback && callback('SUBSCRIBED'), 0);
    return this;
  }

  unsubscribe() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    return Promise.resolve('ok');
  }

  track(payload: any) { return Promise.resolve('ok'); }
  send(type: any) { return Promise.resolve('ok'); }
  presenceState() { return {}; }
}