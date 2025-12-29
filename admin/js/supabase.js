/**
 * Road and Rescue - Supabase Database Client
 * Complete database operations matching VBA functionality
 * Version: 2.0
 */

// Supabase client instance
let supabase = null;

/**
 * Initialize Supabase client
 */
function initSupabase() {
    if (supabase) return supabase;
    
    const config = window.APP_CONFIG || {};
    
    if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
        console.warn('Supabase not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in config.js');
        return null;
    }
    
    // Check if Supabase library is loaded
    if (typeof window.supabase === 'undefined') {
        console.error('Supabase library not loaded. Add the script tag to your HTML.');
        return null;
    }
    
    supabase = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
    console.log('Supabase client initialized');
    return supabase;
}

/**
 * Get Supabase client (initialize if needed)
 */
function getSupabase() {
    return supabase || initSupabase();
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

const auth = {
    /**
     * Sign up new user
     */
    async signUp(email, password, metadata = {}) {
        const client = getSupabase();
        if (!client) return { error: { message: 'Supabase not initialized' } };
        
        const { data, error } = await client.auth.signUp({
            email,
            password,
            options: {
                data: metadata
            }
        });
        
        return { data, error };
    },
    
    /**
     * Sign in user
     */
    async signIn(email, password) {
        const client = getSupabase();
        if (!client) return { error: { message: 'Supabase not initialized' } };
        
        const { data, error } = await client.auth.signInWithPassword({
            email,
            password
        });
        
        if (data?.user) {
            // Update last login
            await db.users.updateLastLogin(data.user.id);
        }
        
        return { data, error };
    },
    
    /**
     * Sign out
     */
    async signOut() {
        const client = getSupabase();
        if (!client) return { error: { message: 'Supabase not initialized' } };
        
        const { error } = await client.auth.signOut();
        return { error };
    },
    
    /**
     * Get current user
     */
    async getUser() {
        const client = getSupabase();
        if (!client) return null;
        
        const { data: { user } } = await client.auth.getUser();
        return user;
    },
    
    /**
     * Check if authenticated
     */
    async isAuthenticated() {
        const user = await this.getUser();
        return !!user;
    },
    
    /**
     * Get session
     */
    async getSession() {
        const client = getSupabase();
        if (!client) return null;
        
        const { data: { session } } = await client.auth.getSession();
        return session;
    },
    
    /**
     * Listen for auth changes
     */
    onAuthStateChange(callback) {
        const client = getSupabase();
        if (!client) return null;
        
        return client.auth.onAuthStateChange(callback);
    }
};

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

const db = {
    // ========================================================================
    // JOBS (Book a Job equivalent)
    // ========================================================================
    jobs: {
        /**
         * Get all active (yellow highlighted) jobs
         */
        async getActive() {
            const client = getSupabase();
            if (!client) return [];
            
            const { data, error } = await client
                .from('jobs')
                .select('*')
                .eq('is_yellow_highlighted', true)
                .eq('is_cancelled', false)
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('Error fetching active jobs:', error);
                return [];
            }
            return data || [];
        },
        
        /**
         * Get job by rego (yellow highlighted only)
         */
        async getByRego(rego) {
            const client = getSupabase();
            if (!client) return null;
            
            const { data, error } = await client
                .from('jobs')
                .select('*')
                .eq('rego', rego.toUpperCase())
                .eq('is_yellow_highlighted', true)
                .single();
            
            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching job:', error);
            }
            return data;
        },
        
        /**
         * Get all jobs for a rego (including historical)
         */
        async getAllByRego(rego) {
            const client = getSupabase();
            if (!client) return [];
            
            const { data, error } = await client
                .from('jobs')
                .select('*')
                .eq('rego', rego.toUpperCase())
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('Error fetching jobs:', error);
                return [];
            }
            return data || [];
        },
        
        /**
         * Get job by ID
         */
        async getById(id) {
            const client = getSupabase();
            if (!client) return null;
            
            const { data, error } = await client
                .from('jobs')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) {
                console.error('Error fetching job:', error);
                return null;
            }
            return data;
        },
        
        /**
         * Create new job (Booking Form equivalent)
         */
        async create(jobData) {
            const client = getSupabase();
            if (!client) return { error: { message: 'Supabase not initialized' } };
            
            // Ensure rego is uppercase
            if (jobData.rego) {
                jobData.rego = jobData.rego.toUpperCase().replace(/\s/g, '');
            }
            
            // Set defaults
            jobData.is_yellow_highlighted = true;
            jobData.status = jobData.status || 'New';
            jobData.created_at = new Date().toISOString();
            
            const { data, error } = await client
                .from('jobs')
                .insert(jobData)
                .select()
                .single();
            
            if (error) {
                console.error('Error creating job:', error);
            } else {
                // Log activity
                await db.activity.log('job_created', 'job', data.id, data.rego, 
                    `New job created for ${data.customer_name || 'Unknown'}`);
            }
            
            return { data, error };
        },
        
        /**
         * Update job
         */
        async update(id, updates) {
            const client = getSupabase();
            if (!client) return { error: { message: 'Supabase not initialized' } };
            
            updates.updated_at = new Date().toISOString();
            
            const { data, error } = await client
                .from('jobs')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            
            if (error) {
                console.error('Error updating job:', error);
            }
            
            return { data, error };
        },
        
        /**
         * Update job by rego (yellow highlighted)
         */
        async updateByRego(rego, updates) {
            const client = getSupabase();
            if (!client) return { error: { message: 'Supabase not initialized' } };
            
            updates.updated_at = new Date().toISOString();
            
            const { data, error } = await client
                .from('jobs')
                .update(updates)
                .eq('rego', rego.toUpperCase())
                .eq('is_yellow_highlighted', true)
                .select()
                .single();
            
            if (error) {
                console.error('Error updating job:', error);
            }
            
            return { data, error };
        },
        
        /**
         * Mark job as DNC (matches VBA MarkDNCJob)
         */
        async markDNC(rego) {
            return await this.updateByRego(rego, { is_dnc: true });
        },
        
        /**
         * Mark job complete (matches VBA JobComplete)
         */
        async markComplete(rego) {
            return await this.updateByRego(rego, { 
                is_completed: true,
                completion_date: new Date().toISOString().split('T')[0]
            });
        },
        
        /**
         * Close job (matches VBA CloseJob)
         */
        async close(rego) {
            return await this.updateByRego(rego, {
                is_closed: true,
                close_date: new Date().toISOString().split('T')[0]
            });
        },
        
        /**
         * Cancel job (matches VBA Cancellation)
         */
        async cancel(rego, reason = '') {
            const client = getSupabase();
            if (!client) return { error: { message: 'Supabase not initialized' } };
            
            // Update job
            const result = await this.updateByRego(rego, {
                is_cancelled: true,
                status: 'Cancelled',
                internal_notes: reason
            });
            
            if (!result.error) {
                // Log activity
                await db.activity.log('job_cancelled', 'job', result.data?.id, rego, 
                    `Job cancelled: ${reason}`);
            }
            
            return result;
        },
        
        /**
         * Post job (un-yellow) - matches VBA post functionality
         */
        async post(rego) {
            return await this.updateByRego(rego, {
                is_yellow_highlighted: false,
                is_posted: true
            });
        },
        
        /**
         * Update invoice name (matches VBA UpdateInvoiceName)
         */
        async updateInvoiceName(rego, invoiceName) {
            return await this.updateByRego(rego, { invoice_name: invoiceName });
        },
        
        /**
         * Update job address (matches VBA UpdateJobAddressByRego)
         */
        async updateAddress(rego, addressData) {
            return await this.updateByRego(rego, addressData);
        },
        
        /**
         * Search jobs
         */
        async search(query, options = {}) {
            const client = getSupabase();
            if (!client) return [];
            
            let queryBuilder = client
                .from('jobs')
                .select('*');
            
            // Text search
            if (query) {
                queryBuilder = queryBuilder.or(
                    `rego.ilike.%${query}%,customer_name.ilike.%${query}%,phone1.ilike.%${query}%,email.ilike.%${query}%`
                );
            }
            
            // Filters
            if (options.yellowOnly !== false) {
                queryBuilder = queryBuilder.eq('is_yellow_highlighted', true);
            }
            if (options.status) {
                queryBuilder = queryBuilder.eq('status', options.status);
            }
            if (options.fromDate) {
                queryBuilder = queryBuilder.gte('created_at', options.fromDate);
            }
            if (options.toDate) {
                queryBuilder = queryBuilder.lte('created_at', options.toDate);
            }
            
            // Order
            queryBuilder = queryBuilder.order('created_at', { ascending: false });
            
            // Limit
            if (options.limit) {
                queryBuilder = queryBuilder.limit(options.limit);
            }
            
            const { data, error } = await queryBuilder;
            
            if (error) {
                console.error('Error searching jobs:', error);
                return [];
            }
            return data || [];
        }
    },
    
    // ========================================================================
    // JOB BUILD NOTES
    // ========================================================================
    buildNotes: {
        /**
         * Get all build notes for a rego
         */
        async getByRego(rego) {
            const client = getSupabase();
            if (!client) return [];
            
            const { data, error } = await client
                .from('job_build_notes')
                .select('*')
                .eq('rego', rego.toUpperCase())
                .order('completion_time', { ascending: false });
            
            if (error) {
                console.error('Error fetching build notes:', error);
                return [];
            }
            return data || [];
        },
        
        /**
         * Get suppliers for a rego (matches VBA GetSuppliersForRego)
         */
        async getSuppliersForRego(rego) {
            const client = getSupabase();
            if (!client) return [];
            
            const { data, error } = await client
                .from('job_build_notes')
                .select('*')
                .eq('rego', rego.toUpperCase())
                .eq('record_type', 'Supplier');
            
            if (error) {
                console.error('Error fetching suppliers:', error);
                return [];
            }
            return data || [];
        },
        
        /**
         * Get billable items for a rego
         */
        async getBillableItems(rego) {
            const client = getSupabase();
            if (!client) return [];
            
            const { data, error } = await client
                .from('job_build_notes')
                .select('*')
                .eq('rego', rego.toUpperCase())
                .eq('record_type', 'Billable');
            
            if (error) {
                console.error('Error fetching billable items:', error);
                return [];
            }
            return data || [];
        },
        
        /**
         * Calculate release amount (Total Charges - Total Paid)
         * Matches VBA release amount calculation
         */
        async calculateReleaseAmount(rego) {
            const client = getSupabase();
            if (!client) return 0;
            
            const { data, error } = await client
                .from('job_financials')
                .select('total_charges, total_payments')
                .eq('rego', rego.toUpperCase())
                .single();
            
            if (error || !data) {
                // Fallback to manual calculation
                const notes = await this.getByRego(rego);
                let totalCharges = 0;
                let totalPayments = 0;
                
                for (const note of notes) {
                    if (note.record_type === 'Billable') {
                        totalCharges += parseFloat(note.charges_k || 0);
                    }
                    if (['Deposit', 'Reimbursement'].includes(note.record_type)) {
                        totalPayments += parseFloat(note.reimbursement_i || 0);
                    }
                }
                
                return totalCharges - totalPayments;
            }
            
            return (data.total_charges || 0) - (data.total_payments || 0);
        },
        
        /**
         * Add build note
         */
        async add(noteData) {
            const client = getSupabase();
            if (!client) return { error: { message: 'Supabase not initialized' } };
            
            // Ensure rego is uppercase
            if (noteData.rego) {
                noteData.rego = noteData.rego.toUpperCase();
            }
            
            // Generate unique key if not provided
            if (!noteData.unique_key) {
                noteData.unique_key = `${noteData.rego}|${noteData.job_notes || noteData.record_type}`;
            }
            
            noteData.completion_time = noteData.completion_time || new Date().toISOString();
            
            const { data, error } = await client
                .from('job_build_notes')
                .insert(noteData)
                .select()
                .single();
            
            if (error) {
                console.error('Error adding build note:', error);
            }
            
            return { data, error };
        },
        
        /**
         * Add supplier record
         */
        async addSupplier(rego, supplierData) {
            return await this.add({
                rego,
                record_type: 'Supplier',
                supplier_name: supplierData.name,
                supplier_email: supplierData.email,
                supplier_phone: supplierData.phone,
                supplier_type: supplierData.type,
                job_notes: supplierData.notes || `Supplier: ${supplierData.name}`,
                ...supplierData
            });
        },
        
        /**
         * Add billable item
         */
        async addBillable(rego, description, chargeAmount, costAmount = 0) {
            const margin = chargeAmount - costAmount;
            
            return await this.add({
                rego,
                record_type: 'Billable',
                job_notes: description,
                charges_k: chargeAmount,
                costings_j: costAmount,
                margin_l: margin
            });
        },
        
        /**
         * Add deposit/payment (matches VBA reimbursement handling)
         */
        async addPayment(rego, amount, method, description = 'Payment Received') {
            return await this.add({
                rego,
                record_type: 'Reimbursement',
                job_notes: description,
                reimbursement_i: amount,
                paid_method: method
            });
        },
        
        /**
         * Add release payment row (matches VBA AddReleasePaymentRow)
         * This is called when confirming bank payment
         */
        async addReleasePaymentRow(rego, amount, customerName, email, method = 'Bank') {
            const uniqueKey = `${rego.toUpperCase().replace(/\s/g, '')}|Release Payment`;
            
            return await this.add({
                rego,
                record_type: 'Billable',
                unique_key: uniqueKey,
                job_notes: 'Release Payment',
                name: customerName,
                email: email,
                charges_k: amount,
                reimbursement_i: amount,
                paid_method: method,
                close_job: 'Yes'
            });
        },
        
        /**
         * Add close job record (matches Power Automate Close Job action)
         */
        async addCloseJob(rego, customerName, email, paymentMethod = 'Stripe') {
            return await this.add({
                rego,
                record_type: 'CloseJob',
                job_notes: `Release Payment Received (${paymentMethod})`,
                name: customerName,
                email: email,
                close_job: 'Yes'
            });
        },
        
        /**
         * Update build note
         */
        async update(id, updates) {
            const client = getSupabase();
            if (!client) return { error: { message: 'Supabase not initialized' } };
            
            const { data, error } = await client
                .from('job_build_notes')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            
            if (error) {
                console.error('Error updating build note:', error);
            }
            
            return { data, error };
        },
        
        /**
         * Delete build note
         */
        async delete(id) {
            const client = getSupabase();
            if (!client) return { error: { message: 'Supabase not initialized' } };
            
            const { error } = await client
                .from('job_build_notes')
                .delete()
                .eq('id', id);
            
            return { error };
        }
    },
    
    // ========================================================================
    // SUPPLIERS
    // ========================================================================
    suppliers: {
        /**
         * Get all suppliers
         */
        async getAll(activeOnly = true) {
            const client = getSupabase();
            if (!client) return [];
            
            let query = client
                .from('suppliers')
                .select('*')
                .order('supplier_name');
            
            if (activeOnly) {
                query = query.eq('is_active', true);
            }
            
            const { data, error } = await query;
            
            if (error) {
                console.error('Error fetching suppliers:', error);
                return [];
            }
            return data || [];
        },
        
        /**
         * Get suppliers by type
         */
        async getByType(supplierType) {
            const client = getSupabase();
            if (!client) return [];
            
            const { data, error } = await client
                .from('suppliers')
                .select('*')
                .eq('supplier_type', supplierType)
                .eq('is_active', true)
                .order('is_preferred', { ascending: false });
            
            if (error) {
                console.error('Error fetching suppliers by type:', error);
                return [];
            }
            return data || [];
        },
        
        /**
         * Get suppliers by region
         */
        async getByRegion(region) {
            const client = getSupabase();
            if (!client) return [];
            
            const { data, error } = await client
                .from('suppliers')
                .select('*')
                .eq('region', region)
                .eq('is_active', true);
            
            if (error) {
                console.error('Error fetching suppliers by region:', error);
                return [];
            }
            return data || [];
        },
        
        /**
         * Get supplier by ID
         */
        async getById(id) {
            const client = getSupabase();
            if (!client) return null;
            
            const { data, error } = await client
                .from('suppliers')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) {
                console.error('Error fetching supplier:', error);
                return null;
            }
            return data;
        },
        
        /**
         * Search suppliers
         */
        async search(query) {
            const client = getSupabase();
            if (!client) return [];
            
            const { data, error } = await client
                .from('suppliers')
                .select('*')
                .or(`supplier_name.ilike.%${query}%,trading_name.ilike.%${query}%,region.ilike.%${query}%`)
                .eq('is_active', true);
            
            if (error) {
                console.error('Error searching suppliers:', error);
                return [];
            }
            return data || [];
        },
        
        /**
         * Create supplier
         */
        async create(supplierData) {
            const client = getSupabase();
            if (!client) return { error: { message: 'Supabase not initialized' } };
            
            const { data, error } = await client
                .from('suppliers')
                .insert(supplierData)
                .select()
                .single();
            
            return { data, error };
        },
        
        /**
         * Update supplier (matches VBA UpdateSupplierDetails)
         */
        async update(id, updates) {
            const client = getSupabase();
            if (!client) return { error: { message: 'Supabase not initialized' } };
            
            updates.updated_at = new Date().toISOString();
            
            const { data, error } = await client
                .from('suppliers')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            
            return { data, error };
        }
    },
    
    // ========================================================================
    // INVOICES
    // ========================================================================
    invoices: {
        /**
         * Get invoices for a rego
         */
        async getByRego(rego) {
            const client = getSupabase();
            if (!client) return [];
            
            const { data, error } = await client
                .from('invoices')
                .select('*')
                .eq('rego', rego.toUpperCase())
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('Error fetching invoices:', error);
                return [];
            }
            return data || [];
        },
        
        /**
         * Get invoice by number
         */
        async getByNumber(invoiceNumber) {
            const client = getSupabase();
            if (!client) return null;
            
            const { data, error } = await client
                .from('invoices')
                .select('*')
                .eq('invoice_number', invoiceNumber)
                .single();
            
            if (error) {
                console.error('Error fetching invoice:', error);
                return null;
            }
            return data;
        },
        
        /**
         * Create invoice
         */
        async create(invoiceData) {
            const client = getSupabase();
            if (!client) return { error: { message: 'Supabase not initialized' } };
            
            // Generate invoice number if not provided
            if (!invoiceData.invoice_number) {
                const { data: numData } = await client.rpc('generate_invoice_number', {
                    inv_type: invoiceData.invoice_type || 'final'
                });
                invoiceData.invoice_number = numData;
            }
            
            const { data, error } = await client
                .from('invoices')
                .insert(invoiceData)
                .select()
                .single();
            
            if (error) {
                console.error('Error creating invoice:', error);
            }
            
            return { data, error };
        },
        
        /**
         * Update invoice
         */
        async update(id, updates) {
            const client = getSupabase();
            if (!client) return { error: { message: 'Supabase not initialized' } };
            
            const { data, error } = await client
                .from('invoices')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            
            return { data, error };
        },
        
        /**
         * Mark invoice as sent
         */
        async markSent(id) {
            return await this.update(id, {
                status: 'sent',
                sent_at: new Date().toISOString()
            });
        },
        
        /**
         * Mark invoice as paid
         */
        async markPaid(id, paymentMethod, paymentRef = null) {
            return await this.update(id, {
                status: 'paid',
                paid_at: new Date().toISOString(),
                payment_method: paymentMethod,
                stripe_payment_id: paymentRef,
                amount_due: 0
            });
        }
    },
    
    // ========================================================================
    // TRANSACTIONS
    // ========================================================================
    transactions: {
        /**
         * Get transactions for a rego
         */
        async getByRego(rego) {
            const client = getSupabase();
            if (!client) return [];
            
            const { data, error } = await client
                .from('transactions')
                .select('*')
                .eq('rego', rego.toUpperCase())
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('Error fetching transactions:', error);
                return [];
            }
            return data || [];
        },
        
        /**
         * Record payment
         */
        async recordPayment(transactionData) {
            const client = getSupabase();
            if (!client) return { error: { message: 'Supabase not initialized' } };
            
            transactionData.transaction_type = transactionData.transaction_type || 'payment';
            
            const { data, error } = await client
                .from('transactions')
                .insert(transactionData)
                .select()
                .single();
            
            return { data, error };
        }
    },
    
    // ========================================================================
    // CUSTOMERS
    // ========================================================================
    customers: {
        /**
         * Find customer by email
         */
        async findByEmail(email) {
            const client = getSupabase();
            if (!client) return null;
            
            const { data, error } = await client
                .from('customers')
                .select('*')
                .eq('email', email.toLowerCase())
                .single();
            
            if (error && error.code !== 'PGRST116') {
                console.error('Error finding customer:', error);
            }
            return data;
        },
        
        /**
         * Find customer by phone
         */
        async findByPhone(phone) {
            const client = getSupabase();
            if (!client) return null;
            
            // Clean phone number
            const cleanPhone = phone.replace(/[^0-9]/g, '');
            
            const { data, error } = await client
                .from('customers')
                .select('*')
                .or(`phone.ilike.%${cleanPhone}%,mobile.ilike.%${cleanPhone}%`)
                .limit(1)
                .single();
            
            if (error && error.code !== 'PGRST116') {
                console.error('Error finding customer:', error);
            }
            return data;
        },
        
        /**
         * Create or update customer
         */
        async upsert(customerData) {
            const client = getSupabase();
            if (!client) return { error: { message: 'Supabase not initialized' } };
            
            if (customerData.email) {
                customerData.email = customerData.email.toLowerCase();
            }
            
            const { data, error } = await client
                .from('customers')
                .upsert(customerData, {
                    onConflict: 'email'
                })
                .select()
                .single();
            
            return { data, error };
        }
    },
    
    // ========================================================================
    // USERS
    // ========================================================================
    users: {
        /**
         * Get user by auth ID
         */
        async getByAuthId(authUserId) {
            const client = getSupabase();
            if (!client) return null;
            
            const { data, error } = await client
                .from('users')
                .select('*')
                .eq('auth_user_id', authUserId)
                .single();
            
            if (error) {
                console.error('Error fetching user:', error);
                return null;
            }
            return data;
        },
        
        /**
         * Update last login
         */
        async updateLastLogin(authUserId) {
            const client = getSupabase();
            if (!client) return;
            
            await client
                .from('users')
                .update({ last_login: new Date().toISOString() })
                .eq('auth_user_id', authUserId);
        }
    },
    
    // ========================================================================
    // SETTINGS
    // ========================================================================
    settings: {
        /**
         * Get setting value
         */
        async get(key) {
            const client = getSupabase();
            if (!client) return null;
            
            const { data, error } = await client
                .from('settings')
                .select('setting_value, setting_type')
                .eq('setting_key', key)
                .single();
            
            if (error || !data) return null;
            
            // Convert based on type
            switch (data.setting_type) {
                case 'number':
                    return parseFloat(data.setting_value);
                case 'boolean':
                    return data.setting_value === 'true';
                case 'json':
                    return JSON.parse(data.setting_value);
                default:
                    return data.setting_value;
            }
        },
        
        /**
         * Get all settings in a category
         */
        async getCategory(category) {
            const client = getSupabase();
            if (!client) return {};
            
            const { data, error } = await client
                .from('settings')
                .select('*')
                .eq('category', category);
            
            if (error) return {};
            
            const settings = {};
            for (const item of data || []) {
                settings[item.setting_key] = item.setting_value;
            }
            return settings;
        },
        
        /**
         * Set setting value
         */
        async set(key, value, type = 'string') {
            const client = getSupabase();
            if (!client) return { error: { message: 'Supabase not initialized' } };
            
            const stringValue = type === 'json' ? JSON.stringify(value) : String(value);
            
            const { data, error } = await client
                .from('settings')
                .upsert({
                    setting_key: key,
                    setting_value: stringValue,
                    setting_type: type,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'setting_key'
                });
            
            return { data, error };
        }
    },
    
    // ========================================================================
    // ACTIVITY LOG
    // ========================================================================
    activity: {
        /**
         * Log an activity
         */
        async log(action, entityType, entityId, rego, description, userEmail = null) {
            const client = getSupabase();
            if (!client) return;
            
            try {
                await client
                    .from('activity_log')
                    .insert({
                        action,
                        entity_type: entityType,
                        entity_id: entityId,
                        rego: rego?.toUpperCase(),
                        description,
                        user_email: userEmail
                    });
            } catch (err) {
                console.warn('Failed to log activity:', err);
            }
        },
        
        /**
         * Get activity for a rego
         */
        async getByRego(rego, limit = 50) {
            const client = getSupabase();
            if (!client) return [];
            
            const { data, error } = await client
                .from('activity_log')
                .select('*')
                .eq('rego', rego.toUpperCase())
                .order('created_at', { ascending: false })
                .limit(limit);
            
            if (error) {
                console.error('Error fetching activity:', error);
                return [];
            }
            return data || [];
        }
    },
    
    // ========================================================================
    // MESSAGE TEMPLATES
    // ========================================================================
    templates: {
        /**
         * Get template by name
         */
        async get(name) {
            const client = getSupabase();
            if (!client) return null;
            
            const { data, error } = await client
                .from('message_templates')
                .select('*')
                .eq('template_name', name)
                .eq('is_active', true)
                .single();
            
            if (error) {
                console.error('Error fetching template:', error);
                return null;
            }
            return data;
        },
        
        /**
         * Get templates by category
         */
        async getByCategory(category) {
            const client = getSupabase();
            if (!client) return [];
            
            const { data, error } = await client
                .from('message_templates')
                .select('*')
                .eq('category', category)
                .eq('is_active', true);
            
            if (error) {
                console.error('Error fetching templates:', error);
                return [];
            }
            return data || [];
        },
        
        /**
         * Render template with data
         */
        render(template, data) {
            let rendered = template.body;
            
            for (const [key, value] of Object.entries(data)) {
                rendered = rendered.replace(new RegExp(`\\{${key}\\}`, 'g'), value || '');
            }
            
            let subject = template.subject || '';
            for (const [key, value] of Object.entries(data)) {
                subject = subject.replace(new RegExp(`\\{${key}\\}`, 'g'), value || '');
            }
            
            return { body: rendered, subject };
        }
    },
    
    // ========================================================================
    // API NUMBERS
    // ========================================================================
    apiNumbers: {
        /**
         * Get all API numbers
         */
        async getAll() {
            const client = getSupabase();
            if (!client) return [];
            
            const { data, error } = await client
                .from('api_numbers')
                .select('*')
                .eq('is_active', true)
                .order('number');
            
            if (error) {
                console.error('Error fetching API numbers:', error);
                return [];
            }
            return data || [];
        },
        
        /**
         * Add API number
         */
        async add(number, label, category = null) {
            const client = getSupabase();
            if (!client) return { error: { message: 'Supabase not initialized' } };
            
            const { data, error } = await client
                .from('api_numbers')
                .insert({ number, label, category })
                .select()
                .single();
            
            return { data, error };
        },
        
        /**
         * Delete API number
         */
        async delete(id) {
            const client = getSupabase();
            if (!client) return { error: { message: 'Supabase not initialized' } };
            
            const { error } = await client
                .from('api_numbers')
                .update({ is_active: false })
                .eq('id', id);
            
            return { error };
        }
    }
};

// ============================================================================
// EXPORT
// ============================================================================

// Make available globally
window.db = db;
window.auth = auth;
window.initSupabase = initSupabase;
window.getSupabase = getSupabase;

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { db, auth, initSupabase, getSupabase };
}

