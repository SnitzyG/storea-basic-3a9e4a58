import { createClient } from '@supabase/supabase-js';

// Global in-memory store (module-level) to persist data during the session
// This acts as our "database"
const db: any = {
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
    ]
};

// Ensure array existence
const ensureTable = (table: string) => {
    if (!db[table]) db[table] = [];
    return db[table];
};

class MockBuilder {
    table: string;
    filters: ((item: any) => boolean)[];
    sort?: (a: any, b: any) => number;
    limitCount?: number;
    isSingle: boolean;
    isMaybeSingle: boolean;
    pendingUpdate: any = null;
    pendingDelete: boolean = false;

    constructor(table: string) {
        this.table = table;
        this.filters = [];
        this.isSingle = false;
        this.isMaybeSingle = false;
    }

    select(columns: string) {
        return this;
    }

    insert(data: any) {
        // STATEFUL INSERT: Push to global store
        const tableData = ensureTable(this.table);
        const rowsToInsert = Array.isArray(data) ? data : [data];

        const insertedRows = rowsToInsert.map((row: any) => {
            const newRow = {
                id: `mock-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                created_at: new Date().toISOString(),
                ...row
            };
            tableData.push(newRow);
            return newRow;
        });

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
                resolve({ data: Array.isArray(data) ? insertedRows : (insertedRows[0] || null), error: null });
            }
        };
    }

    update(updates: any) {
        // We defer update execution to 'then' because we need to apply filters first
        this.pendingUpdate = updates;
        return this;
    }

    delete() {
        this.pendingDelete = true;
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

    contains(column: string, value: any) {
        this.filters.push((item) => {
            const itemValue = item[column];
            if (Array.isArray(itemValue) && Array.isArray(value)) {
                return value.every(v => itemValue.includes(v));
            }
            if (Array.isArray(itemValue)) {
                return itemValue.includes(value);
            }
            return JSON.stringify(itemValue).includes(JSON.stringify(value));
        });
        return this;
    }

    gt(column: string, value: any) {
        this.filters.push((item) => item[column] > value);
        return this;
    }

    gte(column: string, value: any) {
        this.filters.push((item) => item[column] >= value);
        return this;
    }

    lt(column: string, value: any) {
        this.filters.push((item) => item[column] < value);
        return this;
    }

    lte(column: string, value: any) {
        this.filters.push((item) => item[column] <= value);
        return this;
    }

    range(from: number, to: number) {
        this.limitCount = to - from + 1;
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
        try {
            const tableData = ensureTable(this.table);

            // Apply filtering logic
            // Note: For Update/Delete, in a real DB we'd modify the source. 
            // In in-memory array, modifying filtered result references modifies the store.
            // But 'filter' returns new array. So we must find INDICES or references.

            // Simple approach: Filter the global array directly to find matching items
            let matchingItems = tableData.filter((item: any) => {
                return this.filters.every(filter => filter(item));
            });

            if (this.pendingUpdate) {
                // STATEFUL UPDATE
                matchingItems.forEach((item: any) => {
                    Object.assign(item, this.pendingUpdate);
                });
                resolve({ data: matchingItems, error: null });
                return;
            }

            if (this.pendingDelete) {
                // STATEFUL DELETE
                // We need to remove these items from the global 'db[this.table]' array
                const idsToDelete = new Set(matchingItems.map((i: any) => i.id));
                db[this.table] = db[this.table].filter((item: any) => !idsToDelete.has(item.id));
                resolve({ data: matchingItems, error: null });
                return;
            }

            // READ OPERATION
            let result = [...matchingItems];

            if (this.sort) {
                result.sort(this.sort);
            }
            if (this.limitCount) {
                result = result.slice(0, this.limitCount);
            }

            let data: any = result;
            if (this.isSingle) {
                if (result.length === 0) {
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
    from: (table: string) => {
        return new MockBuilder(table);
    },
    rpc: (func: string, params: any) => {
        if (func === 'has_role') {
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
        onAuthStateChange: (callback: any) => {
            callback('SIGNED_IN', {
                user: { id: 'mock-user-id', email: 'demo@storea.com' }
            });
            return { data: { subscription: { unsubscribe: () => { } } } };
        },
        signOut: () => Promise.resolve({ error: null })
    },
    channel: (name: string) => new MockRealtimeChannel(name),
    removeChannel: (channel: any) => { },
    storage: {
        from: () => ({
            upload: () => Promise.resolve({ data: { path: 'mock/path' }, error: null }),
            getPublicUrl: () => ({ data: { publicUrl: 'https://placehold.co/600x400' } })
        })
    }
};

class MockRealtimeChannel {
    name: string;
    constructor(name: string) {
        this.name = name;
    }

    on(event: string, ...args: any[]) {
        // Return this to allow chaining .on().on()
        return this;
    }

    subscribe(callback?: (status: string) => void) {
        // Simulate successful subscription
        if (callback) {
            setTimeout(() => callback('SUBSCRIBED'), 0);
        }
        return this;
    }

    unsubscribe() {
        return Promise.resolve('ok');
    }

    track(payload: any) {
        return Promise.resolve('ok');
    }

    send(type: any) {
        return Promise.resolve('ok');
    }

    presenceState() {
        return {};
    }
}
