
import { createClient } from '@supabase/supabase-js';

// Mock data store
const mockData = {
    projects: [
        {
            id: 'proj-1',
            name: 'Luxury Villa Renovation',
            address: '123 Ocean Drive, Gold Coast',
            status: 'active',
            architectural_stage: 'Construction Documentation',
            budget: 1500000,
            estimated_start_date: '2026-02-01',
            estimated_finish_date: '2026-12-01',
            project_reference_number: 'PRJ-2026-001',
            project_id: 'PRJ-001',
            homeowner_name: 'John Smith',
            description: 'Full renovation of existing 2-storey beachfront property.',
            priority: 'high',
            created_at: new Date().toISOString()
        },
        {
            id: 'proj-2',
            name: 'City Apartment Complex',
            address: '45 High Street, Melbourne',
            status: 'on_hold',
            architectural_stage: 'Concept',
            budget: 5000000,
            estimated_start_date: '2026-06-01',
            estimated_finish_date: '2027-06-01',
            project_reference_number: 'PRJ-2026-002',
            project_id: 'PRJ-002',
            homeowner_name: 'Metro Developments',
            description: 'New 20-unit apartment complex.',
            priority: 'medium',
            created_at: new Date().toISOString()
        },
        {
            id: 'proj-3',
            name: 'Suburban Family Home',
            address: '88 Maple Ave, Sydney',
            status: 'completed',
            architectural_stage: 'Site Services',
            budget: 850000,
            estimated_start_date: '2025-01-15',
            estimated_finish_date: '2025-11-30',
            project_reference_number: 'PRJ-2025-089',
            project_id: 'PRJ-003',
            homeowner_name: 'Sarah Jones',
            description: 'New build double storey home.',
            priority: 'low',
            created_at: new Date().toISOString()
        }
    ],
    activity_log: [
        {
            id: 'act-1',
            project_id: 'proj-1',
            user_id: 'mock-user-id',
            entity_type: 'document',
            action: 'uploaded',
            description: 'Uploaded architectural plans v2.pdf',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
            user_profile: { name: 'Demo User' },
            project: { name: 'Luxury Villa Renovation' }
        },
        {
            id: 'act-2',
            project_id: 'proj-1',
            user_id: 'mock-user-id',
            entity_type: 'rfi',
            action: 'created',
            description: 'Created RFI #12: Structural beam clarification',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
            user_profile: { name: 'Demo User' },
            project: { name: 'Luxury Villa Renovation' }
        },
        {
            id: 'act-3',
            project_id: 'proj-2',
            user_id: 'mock-user-id',
            entity_type: 'project',
            action: 'updated',
            description: 'Project status changed to On Hold',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
            user_profile: { name: 'System Admin' },
            project: { name: 'City Apartment Complex' }
        }
    ],
    todos: [
        {
            id: 'todo-1',
            title: 'Review structural engineering report',
            completed: false,
            priority: 'high',
            due_date: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
            project_id: 'proj-1',
            created_at: new Date().toISOString()
        },
        {
            id: 'todo-2',
            title: 'Call local council regarding permits',
            completed: true,
            priority: 'medium',
            due_date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            project_id: 'proj-1',
            created_at: new Date().toISOString()
        }
    ],
    calendar_events: [
        {
            id: 'evt-1',
            title: 'Site Meeting',
            start_datetime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
            end_datetime: new Date(Date.now() + 1000 * 60 * 60 * 25).toISOString(),
            project_id: 'proj-1',
            description: 'Weekly site progress meeting',
            priority: 'high',
            is_meeting: true,
            status: 'scheduled'
        }
    ],
    documents: [
        {
            id: 'doc-1',
            name: 'Floor Plans.pdf',
            size: 1024 * 1024 * 2.5,
            type: 'application/pdf',
            project_id: 'proj-1',
            created_at: new Date().toISOString(),
            category: 'Plans'
        }
    ],
    messages: [
        {
            id: 'msg-1',
            conversation_id: 'conv-1',
            content: 'Hey, did you see the new plans?',
            sender_id: 'mock-user-id',
            created_at: new Date().toISOString()
        }
    ],
    tenders: [
        {
            id: 'tend-1',
            title: 'Electrical Works',
            status: 'open',
            project_id: 'proj-1',
            due_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString()
        }
    ],
    profiles: [
        {
            id: 'prof-1',
            user_id: 'mock-user-id',
            name: 'Demo User',
            role: 'architect',
            email: 'demo@storea.com',
            approved: true
        }
    ],
    project_users: [
        {
            id: 'pu-1',
            project_id: 'proj-1',
            user_id: 'mock-user-id',
            role: 'architect',
            created_at: new Date().toISOString()
        },
        {
            id: 'pu-2',
            project_id: 'proj-2',
            user_id: 'mock-user-id',
            role: 'architect',
            created_at: new Date().toISOString()
        },
        {
            id: 'pu-3',
            project_id: 'proj-3',
            user_id: 'mock-user-id',
            role: 'architect',
            created_at: new Date().toISOString()
        }
    ]
};

class MockBuilder {
    data: any[];
    filters: ((item: any) => boolean)[];
    sort?: (a: any, b: any) => number;
    limitCount?: number;
    isSingle: boolean;
    isMaybeSingle: boolean;

    constructor(data: any[]) {
        this.data = data;
        this.filters = [];
        this.isSingle = false;
        this.isMaybeSingle = false;
    }

    select(columns: string) {
        return this;
    }

    insert(data: any) {
        if (Array.isArray(data)) {
            this.data.push(...data);
        } else {
            this.data.push(data);
        }
        // Return a Promise-like object that resolves to the inserted data
        return {
            select: () => this,
            maybeSingle: () => {
                this.isMaybeSingle = true;
                return this;
            },
            single: () => {
                this.isSingle = true;
                return this;
            },
            then: (resolve: (value: { data: any[] | any | null; error: null }) => void) => {
                // For insert, we usually return the inserted data
                resolve({ data: Array.isArray(data) ? data : [data], error: null });
            }
        };
    }

    update(data: any) {
        return this;
    }

    delete() {
        return this;
    }

    eq(column: string, value: any) {
        this.filters.push((item) => item[column] === value);
        return this;
    }

    neq(column: string, value: any) {
        this.filters.push((item) => item[column] !== value);
        return this;
    }

    filter(column: string, operator: string, value: any) {
        if (operator === 'eq') {
            this.filters.push((item) => {
                const parts = column.split(/->>|->/);
                let current = item;
                for (const part of parts) {
                    if (current === undefined || current === null) return false;
                    current = current[part];
                }
                return current === value;
            });
        }
        return this;
    }

    or(filters: string) {
        return this;
    }

    in(column: string, values: any[]) {
        this.filters.push((item) => values.includes(item[column]));
        return this;
    }

    is(column: string, value: any) {
        this.filters.push((item) => item[column] === value);
        return this;
    }

    order(column: string, { ascending = true } = {}) {
        this.sort = (a: any, b: any) => {
            const valA = a[column];
            const valB = b[column];
            if (valA < valB) return ascending ? -1 : 1;
            if (valA > valB) return ascending ? 1 : -1;
            return 0;
        };
        return this;
    }

    single() {
        this.isSingle = true;
        return this;
    }

    maybeSingle() {
        this.isMaybeSingle = true;
        return this;
    }

    limit(count: number) {
        this.limitCount = count;
        return this;
    }

    then(resolve: (value: { data: any[] | any | null; error: null }) => void, reject?: (reason: any) => void) {
        let result = [...this.data];

        try {
            for (const filter of this.filters) {
                result = result.filter(filter);
            }
            if (this.sort) {
                result.sort(this.sort);
            }
            if (this.limitCount) {
                result = result.slice(0, this.limitCount);
            }

            let data: any = result;
            if (this.isSingle) {
                if (result.length === 0) {
                    // single() expects exactly one row, throws if 0
                    // But for mock flexibility we might just return null and error
                    // Real supabase throws error
                    throw new Error('Row not found');
                }
                if (result.length > 1) {
                    throw new Error('Multiple rows found');
                }
                data = result[0];
            } else if (this.isMaybeSingle) {
                data = result.length > 0 ? result[0] : null;
            }

            resolve({ data, error: null });
        } catch (e) {
            if (reject) reject(e);
            else console.error("Mock query failed", e);
        }
    }
}

export const mockSupabase = {
    from: (table) => {
        return new MockBuilder(mockData[table] || []);
    },
    rpc: (func, params) => {
        if (func === 'has_role') {
            const { _role } = params;
            // Mock user has 'admin', 'architect', etc based on context, but let's say true for verified
            return Promise.resolve({ data: true, error: null });
        }
        return Promise.resolve({ data: null, error: null });
    },
    auth: {
        getUser: () => Promise.resolve({
            data: {
                user: {
                    id: 'mock-user-id',
                    email: 'demo@storea.com',
                    email_confirmed_at: new Date().toISOString()
                }
            },
            error: null
        }),
        getSession: () => Promise.resolve({
            data: {
                session: {
                    user: {
                        id: 'mock-user-id',
                        email: 'demo@storea.com'
                    },
                    access_token: 'mock-token'
                }
            },
            error: null
        }),
        onAuthStateChange: (callback) => {
            callback('SIGNED_IN', {
                user: { id: 'mock-user-id', email: 'demo@storea.com' }
            });
            return { data: { subscription: { unsubscribe: () => { } } } };
        },
        signOut: () => Promise.resolve({ error: null })
    },
    channel: () => ({
        on: () => ({ subscribe: () => { } }),
        subscribe: () => { }
    }),
    removeChannel: () => { },
    storage: {
        from: () => ({
            upload: () => Promise.resolve({ data: { path: 'mock/path' }, error: null }),
            getPublicUrl: () => ({ data: { publicUrl: 'https://placehold.co/600x400' } })
        })
    }
};
