import {
  DEMO_PROFILES, DEMO_COMPANIES, DEMO_PROJECTS, DEMO_PROJECT_USERS,
  DEMO_RFIS, DEMO_RFI_ACTIVITIES, DEMO_DOCUMENT_GROUPS, DEMO_DOCUMENT_REVISIONS,
  DEMO_MESSAGE_THREADS, DEMO_MESSAGES, DEMO_MESSAGE_PARTICIPANTS,
  DEMO_TENDERS, DEMO_TENDER_LINE_ITEMS, DEMO_TENDER_BIDS, DEMO_TENDER_BID_LINE_ITEMS,
  DEMO_CALENDAR_EVENTS, DEMO_TODOS, DEMO_ACTIVITY_LOG, DEMO_NOTIFICATIONS,
  DEMO_PROJECT_BUDGETS, DEMO_BUDGET_CATEGORIES, DEMO_PROJECT_INVOICES,
  DEMO_PROJECT_PAYMENTS, DEMO_CHANGE_ORDERS, DEMO_CASHFLOW_ITEMS,
  DEMO_CLIENT_CONTRIBUTIONS, DEMO_LINE_ITEM_BUDGETS, DEMO_PROGRESS_CLAIMS,
  DEMO_VARIATIONS, DEMO_PAYMENT_SCHEDULE_STAGES, DEMO_TENDER_ACCESS,
  DEMO_INVITATIONS, DEMO_USER_ROLES, DEMO_ADMIN_ALERTS,
} from './demoData';

const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

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
    | 'tender_line_items'
    | 'tender_bid_line_items'
    | 'profiles'
    | 'project_users'
    | 'companies'
    | 'rfis'
    | 'rfi_activities'
    | 'rfi_collaboration_comments'
    | 'document_groups'
    | 'document_revisions'
    | 'document_shares'
    | 'document_events'
    | 'notifications'
    | 'invitations'
    | 'tender_access'
    | 'project_budgets'
    | 'project_invoices'
    | 'line_item_budgets'
    | 'progress_claims'
    | 'variations'
    | 'user_roles'
    | 'user_sessions'
    | 'admin_alerts'
    | 'audit_logs'
    | 'system_metrics'
    | 'project_pending_invitations'
    | 'project_join_requests'
    | 'tender_package_documents'
    | 'payment_schedule_stages'
    | 'budget_categories'
    | 'project_payments'
    | 'change_orders'
    | 'cashflow_items'
    | 'client_contributions';

type DBListener = (payload: any) => void;

class LocalDatabase {
    private store: Record<string, any[]> = {};
    private listeners: Record<string, DBListener[]> = {};

    constructor() {
        this.seed();
    }

    private seed() {
        this.store = {
            profiles: [...DEMO_PROFILES],
            companies: [...DEMO_COMPANIES],
            projects: [...DEMO_PROJECTS],
            project_users: [...DEMO_PROJECT_USERS],
            rfis: [...DEMO_RFIS],
            rfi_activities: [...DEMO_RFI_ACTIVITIES],
            rfi_collaboration_comments: [],
            document_groups: [...DEMO_DOCUMENT_GROUPS],
            document_revisions: [...DEMO_DOCUMENT_REVISIONS],
            document_shares: [],
            document_events: [],
            documents: [],
            message_threads: [...DEMO_MESSAGE_THREADS],
            message_participants: [...DEMO_MESSAGE_PARTICIPANTS],
            messages: [...DEMO_MESSAGES],
            tenders: [...DEMO_TENDERS],
            tender_packages: [{ id: 'tp-1', tender_id: 'tender-2', name: 'Scope of Works', description: 'Detailed scope document', created_at: new Date().toISOString() }],
            tender_line_items: [...DEMO_TENDER_LINE_ITEMS],
            tender_bids: [...DEMO_TENDER_BIDS],
            tender_bid_line_items: [...DEMO_TENDER_BID_LINE_ITEMS],
            tender_access: [...DEMO_TENDER_ACCESS],
            tender_package_documents: [],
            calendar_events: [...DEMO_CALENDAR_EVENTS],
            todos: [...DEMO_TODOS],
            activity_log: [...DEMO_ACTIVITY_LOG],
            notifications: [...DEMO_NOTIFICATIONS],
            invitations: [...DEMO_INVITATIONS],
            project_budgets: [...DEMO_PROJECT_BUDGETS],
            budget_categories: [...DEMO_BUDGET_CATEGORIES],
            project_invoices: [...DEMO_PROJECT_INVOICES],
            project_payments: [...DEMO_PROJECT_PAYMENTS],
            change_orders: [...DEMO_CHANGE_ORDERS],
            cashflow_items: [...DEMO_CASHFLOW_ITEMS],
            client_contributions: [...DEMO_CLIENT_CONTRIBUTIONS],
            line_item_budgets: [...DEMO_LINE_ITEM_BUDGETS],
            progress_claims: [...DEMO_PROGRESS_CLAIMS],
            variations: [...DEMO_VARIATIONS],
            payment_schedule_stages: [...DEMO_PAYMENT_SCHEDULE_STAGES],
            user_roles: [...DEMO_USER_ROLES],
            user_sessions: [],
            admin_alerts: [...DEMO_ADMIN_ALERTS],
            audit_logs: [],
            system_metrics: [],
            project_pending_invitations: [],
            project_join_requests: [],
        };
    }

    public from(table: string) {
        if (!this.store[table]) {
            this.store[table] = [];
        }
        return new LocalQueryBuilder(this.store[table], table, this);
    }

    public notify(table: string, event: 'INSERT' | 'UPDATE' | 'DELETE', oldRecord: any, newRecord: any) {
        const channelName = `${table}-changes`;
        const listeners = this.listeners[channelName] || [];
        const payload = { eventType: event, new: newRecord, old: oldRecord, table, schema: 'public' };
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

    select(columns = '*', options?: any) { return this; }

    filter(column: string, operator: string, value: any) {
        if (operator === 'eq') this.filters.push(item => item[column] === value);
        else if (operator === 'neq') this.filters.push(item => item[column] !== value);
        else if (operator === 'in') this.filters.push(item => (value as any[]).includes(item[column]));
        return this;
    }

    eq(column: string, value: any) { this.filters.push(item => item[column] === value); return this; }
    neq(column: string, value: any) { this.filters.push(item => item[column] !== value); return this; }
    in(column: string, values: any[]) { this.filters.push(item => values.includes(item[column])); return this; }

    contains(column: string, value: any) {
        this.filters.push(item => {
            const val = item[column];
            if (Array.isArray(val) && Array.isArray(value)) return value.some(v => val.includes(v));
            if (Array.isArray(val)) return val.includes(value);
            return JSON.stringify(val).includes(JSON.stringify(value));
        });
        return this;
    }

    gt(column: string, value: any) { this.filters.push(item => item[column] > value); return this; }
    gte(column: string, value: any) { this.filters.push(item => item[column] >= value); return this; }
    lt(column: string, value: any) { this.filters.push(item => item[column] < value); return this; }
    lte(column: string, value: any) { this.filters.push(item => item[column] <= value); return this; }
    is(column: string, value: any) { this.filters.push(item => item[column] === value); return this; }

    ilike(column: string, pattern: string) {
        const regex = new RegExp(pattern.replace(/%/g, '.*'), 'i');
        this.filters.push(item => regex.test(String(item[column] || '')));
        return this;
    }

    not(column: string, operator: string, value: any) {
        if (operator === 'eq') this.filters.push(item => item[column] !== value);
        else if (operator === 'is') this.filters.push(item => item[column] !== value);
        else if (operator === 'in') this.filters.push(item => !value.includes(item[column]));
        return this;
    }

    match(criteria: Record<string, any>) {
        Object.entries(criteria).forEach(([col, val]) => { this.filters.push(item => item[col] === val); });
        return this;
    }

    or(filterString: string) {
        const parts = filterString.split(',');
        const orFilters: ((item: any) => boolean)[] = [];
        for (const part of parts) {
            const trimmed = part.trim();
            // Handle nested parenthetical groups like "project_id.in.(a,b),project_id.is.null"
            const dotParts = trimmed.split('.');
            if (dotParts.length >= 3) {
                const col = dotParts[0];
                const op = dotParts[1];
                const val = dotParts.slice(2).join('.');
                if (op === 'eq') orFilters.push(item => String(item[col]) === val);
                else if (op === 'ilike') { const r = new RegExp(val.replace(/%/g, '.*'), 'i'); orFilters.push(item => r.test(String(item[col] || ''))); }
                else if (op === 'is') orFilters.push(item => item[col] === (val === 'null' ? null : val));
                else if (op === 'in') {
                    const inVals = val.replace(/[()]/g, '').split(',');
                    orFilters.push(item => inVals.includes(String(item[col])));
                }
            }
        }
        if (orFilters.length > 0) this.filters.push(item => orFilters.some(f => f(item)));
        return this;
    }

    textSearch(column: string, query: string) {
        const terms = query.toLowerCase().split(/\s+/);
        this.filters.push(item => { const val = String(item[column] || '').toLowerCase(); return terms.some(t => val.includes(t)); });
        return this;
    }

    order(column: string, { ascending = true } = {}) {
        this.sorts.push((a, b) => { if (a[column] < b[column]) return ascending ? -1 : 1; if (a[column] > b[column]) return ascending ? 1 : -1; return 0; });
        return this;
    }

    limit(count: number) { this.limitCount = count; return this; }
    range(from: number, to: number) { this.limitCount = to - from + 1; return this; }
    single() { this.isSingle = true; return this; }
    maybeSingle() { this.isMaybeSingle = true; return this; }

    then<TResult1 = { data: any; error: any; count?: number }, TResult2 = never>(
        onfulfilled?: ((value: { data: any; error: any; count?: number }) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
    ): Promise<TResult1 | TResult2> {
        return new Promise<{ data: any; error: any; count?: number }>((resolve, reject) => {
            try {
                let result = this.data.filter(item => this.filters.every(f => f(item)));
                const totalCount = result.length;
                for (const sort of this.sorts) { result.sort(sort); }
                if (this.limitCount) { result = result.slice(0, this.limitCount); }
                let data: any = result;
                if (this.isSingle) {
                    if (result.length === 0) return resolve({ data: null, error: { message: 'Row not found', code: 'PGRST116' } });
                    if (result.length > 1) return resolve({ data: null, error: { message: 'Multiple rows found', code: 'PGRST116' } });
                    data = result[0];
                } else if (this.isMaybeSingle) {
                    data = result.length > 0 ? result[0] : null;
                }
                resolve({ data, error: null, count: totalCount });
            } catch (err) { reject(err); }
        }).then(onfulfilled as any, onrejected);
    }

    insert(rowOrRows: any): any {
        const rows = Array.isArray(rowOrRows) ? rowOrRows : [rowOrRows];
        const inserted = rows.map(r => ({ id: r.id || generateUUID(), created_at: new Date().toISOString(), ...r }));
        this.data.push(...inserted);
        inserted.forEach(row => this.db.notify(this.table, 'INSERT', null, row));
        const result = Array.isArray(rowOrRows) ? inserted : inserted[0];
        const makePromiseLike = (data: any) => ({
            select: () => makePromiseLike(data), single: () => makePromiseLike(data), maybeSingle: () => makePromiseLike(data),
            then: (onfulfilled?: any, onrejected?: any) => Promise.resolve({ data, error: null }).then(onfulfilled, onrejected),
        });
        return makePromiseLike(result);
    }

    upsert(rowOrRows: any, options?: { onConflict?: string }): any {
        const rows = Array.isArray(rowOrRows) ? rowOrRows : [rowOrRows];
        const conflictKey = options?.onConflict || 'id';
        const results: any[] = [];
        for (const row of rows) {
            const existingIndex = this.data.findIndex(item => item[conflictKey] === row[conflictKey]);
            if (existingIndex >= 0) {
                const old = { ...this.data[existingIndex] };
                Object.assign(this.data[existingIndex], row, { updated_at: new Date().toISOString() });
                this.db.notify(this.table, 'UPDATE', old, this.data[existingIndex]);
                results.push(this.data[existingIndex]);
            } else {
                const newRow = { id: row.id || generateUUID(), created_at: new Date().toISOString(), ...row };
                this.data.push(newRow);
                this.db.notify(this.table, 'INSERT', null, newRow);
                results.push(newRow);
            }
        }
        const result = Array.isArray(rowOrRows) ? results : results[0];
        const makePromiseLike = (data: any) => ({
            select: () => makePromiseLike(data), single: () => makePromiseLike(data), maybeSingle: () => makePromiseLike(data),
            then: (onfulfilled?: any, onrejected?: any) => Promise.resolve({ data, error: null }).then(onfulfilled, onrejected),
        });
        return makePromiseLike(result);
    }

    update(updates: any): any {
        const self = this;
        const doUpdate = () => {
            const matches = self.data.filter(item => self.filters.every(f => f(item)));
            const updated = matches.map(item => {
                const old = { ...item };
                Object.assign(item, updates, { updated_at: new Date().toISOString() });
                self.db.notify(self.table, 'UPDATE', old, item);
                return item;
            });
            return updated;
        };

        const chainable: any = {
            eq: (col: string, val: any) => { self.eq(col, val); return chainable; },
            in: (col: string, vals: any[]) => { self.in(col, vals); return chainable; },
            neq: (col: string, val: any) => { self.neq(col, val); return chainable; },
            select: () => chainable,
            then: (onfulfilled?: any, onrejected?: any) => {
                const updated = doUpdate();
                return Promise.resolve({ data: updated, error: null }).then(onfulfilled, onrejected);
            },
        };
        return chainable;
    }

    delete(..._args: any[]): any {
        const self = this;
        const doDelete = () => {
            const matches = self.data.filter(item => self.filters.every(f => f(item)));
            const matchIds = new Set(matches.map(m => m.id));
            for (let i = self.data.length - 1; i >= 0; i--) {
                if (matchIds.has(self.data[i].id)) {
                    const removed = self.data[i];
                    self.data.splice(i, 1);
                    self.db.notify(self.table, 'DELETE', removed, null);
                }
            }
            return matches;
        };

        const chainable: any = {
            eq: (col: string, val: any) => { self.eq(col, val); return chainable; },
            in: (col: string, vals: any[]) => { self.in(col, vals); return chainable; },
            then: (onfulfilled?: any, onrejected?: any) => {
                const deleted = doDelete();
                return Promise.resolve({ data: deleted, error: null }).then(onfulfilled, onrejected);
            },
        };
        return chainable;
    }
}

// Global Singleton
export const localDB = new LocalDatabase();
