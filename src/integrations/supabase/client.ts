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
          user_metadata: { name: 'Richard Architect', role: 'architect', company: 'STOREA Architecture', disabled: false } as any,
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
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          token_type: 'bearer',
          user: {
            id: 'mock-user-id',
            email: 'richard@storea.com',
            user_metadata: { name: 'Richard Architect', role: 'architect', company: 'STOREA Architecture', disabled: false } as any,
            app_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString()
          }
        }
      },
      error: null
    }),
    onAuthStateChange: (callback: any) => {
      callback('SIGNED_IN', {
        user: { id: 'mock-user-id', email: 'richard@storea.com' }
      });
      return { data: { subscription: { unsubscribe: () => { } } } };
    },
    signOut: async () => ({ error: null }),
    signUp: async () => ({ data: { user: null, session: null }, error: null }),
    signInWithPassword: async () => ({ data: { user: { id: 'mock-user-id' }, session: {} }, error: null }),
    resetPasswordForEmail: async (_email: string, _options?: any) => ({ data: {}, error: null }),
    updateUser: async (_updates: any) => ({ data: { user: { id: 'mock-user-id' } }, error: null }),
    admin: {
      listUsers: async () => ({
        data: {
          users: [
            { id: 'mock-user-id', email: 'richard@storea.com', user_metadata: { name: 'Richard Architect', role: 'architect' }, created_at: new Date().toISOString(), last_sign_in_at: new Date().toISOString() },
            { id: 'user-sarah', email: 'sarah@buildright.com', user_metadata: { name: 'Sarah Builder', role: 'builder' }, created_at: new Date().toISOString(), last_sign_in_at: new Date().toISOString() },
            { id: 'user-james', email: 'james@homevision.com', user_metadata: { name: 'James Contractor', role: 'contractor' }, created_at: new Date().toISOString(), last_sign_in_at: new Date().toISOString() },
            { id: 'user-emma', email: 'emma@email.com', user_metadata: { name: 'Emma Client', role: 'homeowner' }, created_at: new Date().toISOString(), last_sign_in_at: new Date().toISOString() },
          ]
        },
        error: null
      }),
      getUserById: async (userId: string) => ({
        data: { user: { id: userId, email: `user-${userId}@example.com`, user_metadata: { role: 'user', disabled: false } as any, created_at: new Date().toISOString() } },
        error: null
      }),
      updateUserById: async (_userId: string, _updates: any) => ({ data: { user: { id: _userId } }, error: null }),
      deleteUser: async (_userId: string) => ({ data: {}, error: null }),
    },
  },

  // RPC
  rpc: async (func: string, params?: any) => {
    console.log(`[MockRPC] Calling ${func}`, params);
    if (func === 'has_role') return { data: true, error: null };
    if (func === 'cleanup_expired_invitations') return { data: null, error: null };
    if (func === 'get_active_users_count') return { data: 4, error: null };
    if (func === 'get_user_activity_summary') return { data: { total_users: 4, new_users: 1, active_users: 3, pending_approvals: 0, users_by_role: { architect: 1, builder: 1, contractor: 1, homeowner: 1 } }, error: null };
    if (func === 'get_db_performance_metrics') return { data: { total_activity_logs: 10, activity_logs_24h: 5, total_user_sessions: 3, active_sessions: 2, avg_session_duration_minutes: 25 }, error: null };
    return { data: true, error: null };
  },

  // Functions (Edge Functions mock)
  functions: {
    invoke: async (functionName: string, options?: { body?: any; headers?: any }): Promise<{ data: any; error: any }> => {
      console.log(`[MockFunctions] Invoking ${functionName}`, options?.body);
      if (functionName === 'get-weather') {
        return {
          data: {
            current: { temp: 22, condition: 'Partly Cloudy', humidity: 65, wind_kmh: 12, rainfall_mm: 0 },
            city: options?.body?.location || 'Melbourne CBD',
            forecast: [
              { day: 'Mon', minTemp: 14, maxTemp: 22, condition: 'Partly Cloudy', rainfall: 0 },
              { day: 'Tue', minTemp: 15, maxTemp: 24, condition: 'Sunny', rainfall: 0 },
              { day: 'Wed', minTemp: 16, maxTemp: 26, condition: 'Sunny', rainfall: 0 },
              { day: 'Thu', minTemp: 14, maxTemp: 20, condition: 'Showers', rainfall: 5 },
              { day: 'Fri', minTemp: 12, maxTemp: 18, condition: 'Cloudy', rainfall: 2 },
            ]
          },
          error: null
        };
      }
      if (functionName === 'send-team-invitation') {
        return { data: { success: true }, error: null };
      }
      if (functionName === 'generate-invite-link') {
        return { data: { token: 'proj_generated_' + Date.now(), link: window.location.origin + '/join/proj_generated_' + Date.now() }, error: null };
      }
      if (functionName === 'link-pending-projects') {
        return { data: { linked: 0 }, error: null };
      }
      if (functionName === 'parse-line-items') {
        return { data: { lineItems: [] }, error: null };
      }
      return { data: {}, error: null };
    }
  },

  // Storage
  storage: {
    listBuckets: async () => ({ data: [{ id: 'avatars', name: 'avatars', public: true }, { id: 'documents', name: 'documents', public: false }], error: null }),
    from: (bucket: string) => ({
      upload: async (path: string, file: any, options?: any) => {
        console.log(`[MockStorage] Uploaded ${path} to ${bucket}`);
        return { data: { path }, error: null };
      },
      getPublicUrl: (path: string) => {
        return { data: { publicUrl: `https://placehold.co/600x400?text=${encodeURIComponent(path)}` } };
      },
      download: async (_path?: string) => ({ data: new Blob(['mock content']), error: null }),
      remove: async (paths: string[]) => {
        console.log(`[MockStorage] Removed ${paths.join(', ')} from ${bucket}`);
        return { data: paths.map(p => ({ name: p })), error: null };
      },
      list: async () => ({ data: [], error: null }),
      createSignedUrl: async (path: string, expiresIn: number) => {
        return { data: { signedUrl: `https://placehold.co/600x400?text=${encodeURIComponent(path)}&signed=true` }, error: null };
      },
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
      const tableName = filter.table;
      const channelName = `${tableName}-changes`;

      const sub = localDB.subscribe(channelName, (payload) => {
        if (filter.event !== '*' && filter.event !== payload.eventType) return;

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
