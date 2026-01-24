// import { v4 as uuidv4 } from 'uuid'; // Removed dependency

const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// Types for our local database
export type TableName =
    | 'projects'
    | 'activity_log'
    | 'todos'
    | 'calendar_events'
    | 'documents'
    | 'messages'
    | 'message_threads'
    | 'message_participants'
    | 'tenders'
    | 'tender_packages'
    | 'tender_bids'
    | 'profiles'
    | 'project_users'
    | 'companies';

type DBListener = (payload: any) => void;

class LocalDatabase {
    private store: Record<string, any[]> = {};
    private listeners: Record<string, DBListener[]> = {};

    constructor() {
        this.seed();
    }

    private seed() {
        // Initial seed data
        const userId = 'mock-user-id';
        const now = new Date().toISOString();
        const yesterday = new Date(Date.now() - 86400000).toISOString();
        const twoHoursAgo = new Date(Date.now() - 7200000).toISOString();

        this.store = {
            profiles: [{
                id: 'prof-1',
                user_id: userId,
                name: 'Richard Architect',
                role: 'architect',
                email: 'richard@storea.com',
                created_at: now,
                approved: true
            }],
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
                    created_by: userId,
                    created_at: now
                },
                {
                    id: 'proj-2',
                    name: 'City Apartment Complex',
                    address: '45 High Street, Melbourne',
                    status: 'on_hold',
                    architectural_stage: 'Concept',
                    budget: 5000000,
                    created_by: userId,
                    created_at: yesterday
                }
            ],
            project_users: [
                { id: 'pu-1', project_id: 'proj-1', user_id: userId, role: 'architect', created_at: now },
                { id: 'pu-2', project_id: 'proj-2', user_id: userId, role: 'architect', created_at: now }
            ],
            activity_log: [
                {
                    id: 'act-1',
                    project_id: 'proj-1',
                    user_id: userId,
                    entity_type: 'document',
                    action: 'uploaded',
                    description: 'Uploaded architectural plans v2.pdf',
                    created_at: twoHoursAgo,
                    user_profile: { name: 'Richard Architect' },
                    project: { name: 'Luxury Villa Renovation' }
                }
            ],
            todos: [
                {
                    id: 'todo-1',
                    project_id: 'proj-1',
                    title: 'Review structural engineering report',
                    completed: false,
                    priority: 'high',
                    due_date: new Date(Date.now() + 86400000 * 2).toISOString(),
                    created_at: now
                }
            ],
            calendar_events: [],
            documents: [],
            messages: [],
            message_threads: [],
            message_participants: [],
            tenders: [],
            tender_packages: [],
            tender_bids: [],
            companies: []
        };
    }

    // --- Core CRUD ---

    public from(table: TableName) {
        if (!this.store[table]) {
            this.store[table] = [];
        }
        return new LocalQueryBuilder(this.store[table], table, this);
    }

    // Internal method to commit changes and notify listeners
    public notify(table: string, event: 'INSERT' | 'UPDATE' | 'DELETE', oldRecord: any, newRecord: any) {
        const channelName = `${table}-changes`;
        const listeners = this.listeners[channelName] || [];

        const payload = {
            eventType: event,
            new: newRecord,
            old: oldRecord,
            table,
            schema: 'public'
        };

        listeners.forEach(cb => cb(payload));
    }

    public subscribe(channel: string, callback: DBListener) {
        if (!this.listeners[channel]) {
            this.listeners[channel] = [];
        }
        this.listeners[channel].push(callback);
        return {
            unsubscribe: () => {
                this.listeners[channel] = this.listeners[channel].filter(cb => cb !== callback);
            }
        };
    }
}

class LocalQueryBuilder {
    private data: any[];
    private table: string;
    private db: LocalDatabase;
    private filters: ((item: any) => boolean)[] = [];
    private sorts: ((a: any, b: any) => number)[] = [];
    private limitCount?: number;
    private isSingle = false;
    private isMaybeSingle = false;

    constructor(data: any[], table: string, db: LocalDatabase) {
        this.data = data;
        this.table = table;
        this.db = db;
    }

    select(columns = '*') {
        return this;
    }

    // Filters
    eq(column: string, value: any) {
        this.filters.push(item => item[column] === value);
        return this;
    }

    neq(column: string, value: any) {
        this.filters.push(item => item[column] !== value);
        return this;
    }

    in(column: string, values: any[]) {
        this.filters.push(item => values.includes(item[column]));
        return this;
    }

    contains(column: string, value: any) {
        this.filters.push(item => {
            const val = item[column];
            if (Array.isArray(val)) return val.includes(value);
            // Simplified JSON check
            return JSON.stringify(val).includes(JSON.stringify(value));
        });
        return this;
    }

    gt(column: string, value: any) {
        this.filters.push(item => item[column] > value);
        return this;
    }

    gte(column: string, value: any) {
        this.filters.push(item => item[column] >= value);
        return this;
    }

    lt(column: string, value: any) {
        this.filters.push(item => item[column] < value);
        return this;
    }

    lte(column: string, value: any) {
        this.filters.push(item => item[column] <= value);
        return this;
    }

    is(column: string, value: any) {
        this.filters.push(item => item[column] === value);
        return this;
    }

    // Modifiers
    order(column: string, { ascending = true } = {}) {
        this.sorts.push((a, b) => {
            if (a[column] < b[column]) return ascending ? -1 : 1;
            if (a[column] > b[column]) return ascending ? 1 : -1;
            return 0;
        });
        return this;
    }

    limit(count: number) {
        this.limitCount = count;
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

    // Execution
    then(resolve: (value: { data: any, error: any }) => void, reject?: (reason: any) => void) {
        try {
            let result = this.data.filter(item => this.filters.every(f => f(item)));

            for (const sort of this.sorts) {
                result.sort(sort);
            }

            if (this.limitCount) {
                result = result.slice(0, this.limitCount);
            }

            let data: any = result;
            if (this.isSingle) {
                if (result.length === 0) return resolve({ data: null, error: { message: 'Row not found', code: 'PGRST116' } });
                if (result.length > 1) return resolve({ data: null, error: { message: 'Multiple rows found', code: 'PGRST116' } });
                data = result[0];
            } else if (this.isMaybeSingle) {
                data = result.length > 0 ? result[0] : null;
            }

            resolve({ data, error: null });
        } catch (err) {
            if (reject) reject(err);
        }
    }

    // Mutations - These behave like Promises but modify the source array
    insert(rowOrRows: any) {
        const rows = Array.isArray(rowOrRows) ? rowOrRows : [rowOrRows];
        const inserted = rows.map(r => ({
            id: r.id || generateUUID(),
            created_at: new Date().toISOString(),
            ...r
        }));

        this.data.push(...inserted);

        // Notify listeners
        inserted.forEach(row => this.db.notify(this.table, 'INSERT', null, row));

        // Return partial query builder to allow .select().single() chain which assumes we return the data
        return {
            select: () => this,
            single: () => this,
            maybeSingle: () => this,
            then: (resolve: any) => resolve({ data: Array.isArray(rowOrRows) ? inserted : inserted[0], error: null })
        };
    }

    update(updates: any) {
        // Find matching items
        const matches = this.data.filter(item => this.filters.every(f => f(item)));

        const updated = matches.map(item => {
            const old = { ...item };
            Object.assign(item, updates, { updated_at: new Date().toISOString() });
            this.db.notify(this.table, 'UPDATE', old, item);
            return item;
        });

        return {
            eq: (col: string, val: any) => { this.eq(col, val); return this.update(updates); }, // Handle latent filtering
            select: () => this,
            then: (resolve: any) => resolve({ data: updated, error: null })
        };
    }

    delete() {
        const matches = this.data.filter(item => this.filters.every(f => f(item)));
        const matchIds = new Set(matches.map(m => m.id));

        // Remove from source array (mutative)
        // We have to find index in original array
        for (let i = this.data.length - 1; i >= 0; i--) {
            if (matchIds.has(this.data[i].id)) {
                const removed = this.data[i];
                this.data.splice(i, 1);
                this.db.notify(this.table, 'DELETE', removed, null);
            }
        }

        return {
            eq: (col: string, val: any) => { this.eq(col, val); return this.delete(); },
            then: (resolve: any) => resolve({ data: matches, error: null })
        };
    }
}

// Global Singleton
export const localDB = new LocalDatabase();
