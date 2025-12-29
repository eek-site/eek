-- ============================================================================
-- Road and Rescue - Complete Database Schema for Supabase (PostgreSQL)
-- Version: 2.0 - Full system replication from VBA
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Jobs (Book a Job sheet equivalent)
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sharepoint_id INTEGER,
    
    -- Job identification
    rego VARCHAR(20) NOT NULL,
    job_number VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Customer details
    customer_name VARCHAR(255),
    invoice_name VARCHAR(255),
    phone1 VARCHAR(50),
    phone2 VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    suburb VARCHAR(100),
    city VARCHAR(100),
    postcode VARCHAR(20),
    country_code VARCHAR(10) DEFAULT '64',
    
    -- Vehicle details
    make VARCHAR(100),
    model VARCHAR(100),
    year INTEGER,
    colour VARCHAR(50),
    vin VARCHAR(50),
    odometer INTEGER,
    
    -- Job details
    fault_description TEXT,
    job_type VARCHAR(100),
    priority VARCHAR(50) DEFAULT 'Normal',
    source VARCHAR(100),
    referral_source VARCHAR(255),
    
    -- Location
    pickup_address TEXT,
    pickup_suburb VARCHAR(100),
    destination_address TEXT,
    destination_suburb VARCHAR(100),
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'New',
    is_yellow_highlighted BOOLEAN DEFAULT TRUE,
    is_dnc BOOLEAN DEFAULT FALSE,
    is_cancelled BOOLEAN DEFAULT FALSE,
    is_completed BOOLEAN DEFAULT FALSE,
    is_closed BOOLEAN DEFAULT FALSE,
    is_posted BOOLEAN DEFAULT FALSE,
    
    -- Dates
    booking_date DATE,
    completion_date DATE,
    close_date DATE,
    
    -- Financial
    quoted_amount DECIMAL(10,2),
    deposit_amount DECIMAL(10,2) DEFAULT 0,
    total_charges DECIMAL(10,2) DEFAULT 0,
    total_paid DECIMAL(10,2) DEFAULT 0,
    balance_due DECIMAL(10,2) DEFAULT 0,
    
    -- Notes
    internal_notes TEXT,
    customer_notes TEXT,
    
    -- Audit
    created_by VARCHAR(255),
    modified_by VARCHAR(255),
    
    -- Indexes
    CONSTRAINT jobs_rego_idx UNIQUE (rego, is_yellow_highlighted) 
        DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX idx_jobs_rego ON jobs(rego);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_yellow ON jobs(is_yellow_highlighted);
CREATE INDEX idx_jobs_created ON jobs(created_at DESC);

-- ============================================================================
-- Job Build Notes (Job Build Notes sheet equivalent)
-- ============================================================================

CREATE TABLE IF NOT EXISTS job_build_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sharepoint_id INTEGER,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    
    -- Link to job
    rego VARCHAR(20) NOT NULL,
    
    -- Record identification
    unique_key VARCHAR(255),
    record_type VARCHAR(50) NOT NULL, -- Billable, Supplier, Deposit, Reimbursement, Refund, CloseJob
    completion_time TIMESTAMPTZ DEFAULT NOW(),
    
    -- For all records
    job_notes TEXT,
    email VARCHAR(255),
    name VARCHAR(255),
    
    -- For Supplier records (Column H, X, Y)
    supplier_name VARCHAR(255),
    supplier_email VARCHAR(255),
    supplier_phone VARCHAR(50),
    supplier_type VARCHAR(100),
    
    -- Financial columns (matching Excel)
    reimbursement_i DECIMAL(10,2) DEFAULT 0, -- Column I - Payments/Deposits received
    costings_j DECIMAL(10,2) DEFAULT 0,      -- Column J - Our costs
    charges_k DECIMAL(10,2) DEFAULT 0,       -- Column K - Customer charges
    margin_l DECIMAL(10,2) DEFAULT 0,        -- Column L - Margin
    
    -- Status columns
    paid_method VARCHAR(50),  -- Column M - Stripe, Bank, etc.
    close_job VARCHAR(10),    -- Column N - Yes/No
    
    -- Invoice tracking
    invoice_number VARCHAR(50),
    invoice_date DATE,
    invoice_sent BOOLEAN DEFAULT FALSE,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(255)
);

CREATE INDEX idx_build_notes_rego ON job_build_notes(rego);
CREATE INDEX idx_build_notes_type ON job_build_notes(record_type);
CREATE INDEX idx_build_notes_job ON job_build_notes(job_id);
CREATE INDEX idx_build_notes_key ON job_build_notes(unique_key);

-- ============================================================================
-- Suppliers (Master list)
-- ============================================================================

CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic info
    supplier_name VARCHAR(255) NOT NULL,
    trading_name VARCHAR(255),
    contact_person VARCHAR(255),
    
    -- Contact
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    fax VARCHAR(50),
    
    -- Address
    address TEXT,
    suburb VARCHAR(100),
    city VARCHAR(100),
    postcode VARCHAR(20),
    region VARCHAR(100),
    
    -- Business details
    supplier_type VARCHAR(100), -- Tow, Workshop, Fuel, Storage, etc.
    services TEXT[],
    coverage_areas TEXT[],
    
    -- Financial
    bank_account VARCHAR(50),
    gst_number VARCHAR(50),
    payment_terms VARCHAR(100),
    hourly_rate DECIMAL(10,2),
    callout_fee DECIMAL(10,2),
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_preferred BOOLEAN DEFAULT FALSE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    
    -- Notes
    notes TEXT,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_suppliers_name ON suppliers(supplier_name);
CREATE INDEX idx_suppliers_type ON suppliers(supplier_type);
CREATE INDEX idx_suppliers_region ON suppliers(region);

-- ============================================================================
-- Customers (for repeat customers)
-- ============================================================================

CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Identity
    customer_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    country_code VARCHAR(10) DEFAULT '64',
    
    -- Address
    address TEXT,
    suburb VARCHAR(100),
    city VARCHAR(100),
    postcode VARCHAR(20),
    
    -- Vehicles (array of regos)
    vehicles TEXT[],
    
    -- Status
    is_vip BOOLEAN DEFAULT FALSE,
    is_blocked BOOLEAN DEFAULT FALSE,
    
    -- Stats
    total_jobs INTEGER DEFAULT 0,
    total_spent DECIMAL(12,2) DEFAULT 0,
    
    -- Notes
    notes TEXT,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);

-- ============================================================================
-- Invoices
-- ============================================================================

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id),
    
    -- Invoice details
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    invoice_type VARCHAR(20) NOT NULL, -- interim, final, credit
    rego VARCHAR(20) NOT NULL,
    
    -- Customer
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    customer_address TEXT,
    
    -- Dates
    invoice_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    
    -- Amounts
    subtotal DECIMAL(10,2) DEFAULT 0,
    gst DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) DEFAULT 0,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    amount_due DECIMAL(10,2) DEFAULT 0,
    
    -- Line items (JSON array)
    line_items JSONB DEFAULT '[]'::jsonb,
    
    -- Payment
    payment_link VARCHAR(500),
    payment_method VARCHAR(50),
    payment_date DATE,
    stripe_payment_id VARCHAR(255),
    
    -- Status
    status VARCHAR(50) DEFAULT 'draft', -- draft, sent, viewed, paid, overdue, cancelled
    sent_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    
    -- PDF storage
    pdf_url VARCHAR(500),
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(255)
);

CREATE INDEX idx_invoices_rego ON invoices(rego);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);

-- ============================================================================
-- Transactions (financial tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id),
    invoice_id UUID REFERENCES invoices(id),
    
    -- Transaction details
    transaction_type VARCHAR(50) NOT NULL, -- payment, refund, deposit, charge
    rego VARCHAR(20),
    
    -- Amount
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'NZD',
    
    -- Payment method
    payment_method VARCHAR(50), -- stripe, bank, cash, eftpos
    payment_reference VARCHAR(255),
    stripe_payment_id VARCHAR(255),
    
    -- Bank details (for reconciliation)
    bank_reference VARCHAR(255),
    bank_date DATE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'completed', -- pending, completed, failed, refunded
    
    -- Description
    description TEXT,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by VARCHAR(255)
);

CREATE INDEX idx_transactions_rego ON transactions(rego);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_date ON transactions(created_at DESC);

-- ============================================================================
-- API Numbers (for CarJam and external lookups)
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_numbers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    number VARCHAR(20) NOT NULL,
    label VARCHAR(255),
    category VARCHAR(100),
    description TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Usage tracking
    last_used TIMESTAMPTZ,
    use_count INTEGER DEFAULT 0,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- API Extension List
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_extension_list (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    extension VARCHAR(20) NOT NULL,
    name VARCHAR(255),
    department VARCHAR(100),
    
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- White List (authorized contacts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS white_list (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    email VARCHAR(255),
    phone VARCHAR(50),
    name VARCHAR(255),
    organization VARCHAR(255),
    
    access_level VARCHAR(50) DEFAULT 'basic', -- basic, staff, admin
    
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_whitelist_email ON white_list(email);
CREATE INDEX idx_whitelist_phone ON white_list(phone);

-- ============================================================================
-- Message Templates
-- ============================================================================

CREATE TABLE IF NOT EXISTS message_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    template_name VARCHAR(255) NOT NULL,
    template_type VARCHAR(50) NOT NULL, -- sms, email
    category VARCHAR(100),
    
    subject VARCHAR(500),
    body TEXT NOT NULL,
    
    -- Placeholders: {customerName}, {rego}, {amount}, {paymentLink}, etc.
    placeholders TEXT[],
    
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Activity Log (audit trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- What
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50), -- job, invoice, supplier, etc.
    entity_id UUID,
    rego VARCHAR(20),
    
    -- Details
    description TEXT,
    old_value JSONB,
    new_value JSONB,
    
    -- Who/When
    user_id UUID,
    user_email VARCHAR(255),
    ip_address VARCHAR(50),
    user_agent TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_rego ON activity_log(rego);
CREATE INDEX idx_activity_entity ON activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_date ON activity_log(created_at DESC);

-- ============================================================================
-- Users (for app authentication)
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Supabase auth link
    auth_user_id UUID UNIQUE,
    
    -- Profile
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    phone VARCHAR(50),
    
    -- Role
    role VARCHAR(50) DEFAULT 'user', -- user, staff, admin, super_admin
    permissions JSONB DEFAULT '{}'::jsonb,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMPTZ,
    
    -- Preferences
    preferences JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Settings (app configuration)
-- ============================================================================

CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'string', -- string, number, boolean, json
    category VARCHAR(100),
    description TEXT,
    
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by VARCHAR(255)
);

-- Insert default settings
INSERT INTO settings (setting_key, setting_value, setting_type, category, description) VALUES
    ('company_name', 'EEK Mechanical', 'string', 'company', 'Company name'),
    ('company_phone', '0800 769 000', 'string', 'company', 'Main phone number'),
    ('company_email', 'info@eek.nz', 'string', 'company', 'Main email'),
    ('company_website', 'www.eek.nz', 'string', 'company', 'Website URL'),
    ('company_address', 'Level 1, 6 Johnsonville Road, Johnsonville, Wellington 6037', 'string', 'company', 'Physical address'),
    ('bank_name', 'ANZ Chartwell', 'string', 'bank', 'Bank name'),
    ('bank_account_name', 'EEK Mechanical', 'string', 'bank', 'Account name'),
    ('bank_account_number', '06-0313-0860749-00', 'string', 'bank', 'Account number'),
    ('gst_number', '', 'string', 'tax', 'GST number'),
    ('default_country_code', '64', 'string', 'sms', 'Default country code for phone numbers'),
    ('sms_gateway', 'sms.tnz.co.nz', 'string', 'sms', 'TNZ SMS gateway domain'),
    ('stripe_redirect_base', 'www.eek.nz/thanks', 'string', 'payments', 'Base URL for Stripe redirects')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Active jobs view
CREATE OR REPLACE VIEW active_jobs AS
SELECT 
    j.*,
    COALESCE(SUM(jbn.charges_k), 0) as total_charges_calculated,
    COALESCE(SUM(jbn.reimbursement_i), 0) as total_paid_calculated,
    COALESCE(SUM(jbn.charges_k), 0) - COALESCE(SUM(jbn.reimbursement_i), 0) as balance_calculated
FROM jobs j
LEFT JOIN job_build_notes jbn ON j.rego = jbn.rego AND jbn.record_type = 'Billable'
WHERE j.is_yellow_highlighted = TRUE 
  AND j.is_cancelled = FALSE
GROUP BY j.id;

-- Job financial summary view
CREATE OR REPLACE VIEW job_financials AS
SELECT 
    rego,
    SUM(CASE WHEN record_type = 'Billable' THEN charges_k ELSE 0 END) as total_charges,
    SUM(CASE WHEN record_type IN ('Deposit', 'Reimbursement') THEN reimbursement_i ELSE 0 END) as total_payments,
    SUM(CASE WHEN record_type = 'Refund' THEN reimbursement_i ELSE 0 END) as total_refunds,
    SUM(CASE WHEN record_type = 'Billable' THEN costings_j ELSE 0 END) as total_costs,
    SUM(CASE WHEN record_type = 'Billable' THEN margin_l ELSE 0 END) as total_margin,
    COUNT(DISTINCT CASE WHEN record_type = 'Supplier' THEN id END) as supplier_count
FROM job_build_notes
GROUP BY rego;

-- Supplier summary for a job
CREATE OR REPLACE VIEW job_suppliers AS
SELECT 
    rego,
    supplier_name,
    supplier_email,
    supplier_phone,
    supplier_type,
    job_notes,
    created_at
FROM job_build_notes
WHERE record_type = 'Supplier'
ORDER BY created_at;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update job totals when build notes change
CREATE OR REPLACE FUNCTION update_job_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE jobs SET
        total_charges = (
            SELECT COALESCE(SUM(charges_k), 0) 
            FROM job_build_notes 
            WHERE rego = COALESCE(NEW.rego, OLD.rego) AND record_type = 'Billable'
        ),
        total_paid = (
            SELECT COALESCE(SUM(reimbursement_i), 0) 
            FROM job_build_notes 
            WHERE rego = COALESCE(NEW.rego, OLD.rego) AND record_type IN ('Deposit', 'Reimbursement')
        ),
        balance_due = (
            SELECT COALESCE(SUM(charges_k), 0) - COALESCE(SUM(reimbursement_i), 0)
            FROM job_build_notes 
            WHERE rego = COALESCE(NEW.rego, OLD.rego)
        ),
        updated_at = NOW()
    WHERE rego = COALESCE(NEW.rego, OLD.rego) AND is_yellow_highlighted = TRUE;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for job totals
CREATE TRIGGER update_job_totals_trigger
AFTER INSERT OR UPDATE OR DELETE ON job_build_notes
FOR EACH ROW EXECUTE FUNCTION update_job_totals();

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number(inv_type VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    prefix VARCHAR;
    seq_num INTEGER;
    inv_number VARCHAR;
BEGIN
    prefix := CASE 
        WHEN inv_type = 'interim' THEN 'INT'
        WHEN inv_type = 'credit' THEN 'CRD'
        ELSE 'FIN'
    END;
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 5) AS INTEGER)), 0) + 1
    INTO seq_num
    FROM invoices
    WHERE invoice_number LIKE prefix || '-%';
    
    inv_number := prefix || '-' || LPAD(seq_num::TEXT, 6, '0');
    
    RETURN inv_number;
END;
$$ LANGUAGE plpgsql;

-- Function to log activity
CREATE OR REPLACE FUNCTION log_activity(
    p_action VARCHAR,
    p_entity_type VARCHAR,
    p_entity_id UUID,
    p_rego VARCHAR,
    p_description TEXT,
    p_user_email VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO activity_log (action, entity_type, entity_id, rego, description, user_email)
    VALUES (p_action, p_entity_type, p_entity_id, p_rego, p_description, p_user_email)
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on tables
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_build_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read all data
CREATE POLICY "Allow authenticated read" ON jobs
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read" ON job_build_notes
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read" ON invoices
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read" ON transactions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read" ON suppliers
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read" ON customers
    FOR SELECT TO authenticated USING (true);

-- Policy: Allow authenticated users to insert/update
CREATE POLICY "Allow authenticated write" ON jobs
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated write" ON job_build_notes
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated write" ON invoices
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated write" ON transactions
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated write" ON suppliers
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated write" ON customers
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- SAMPLE DATA (Optional - comment out in production)
-- ============================================================================

-- Sample supplier types
INSERT INTO suppliers (supplier_name, supplier_type, email, phone, region, is_preferred) VALUES
    ('Sample Towing Co', 'Tow', 'tow@example.com', '0211234567', 'Wellington', true),
    ('Sample Workshop', 'Workshop', 'workshop@example.com', '0219876543', 'Wellington', true)
ON CONFLICT DO NOTHING;

-- Sample message templates
INSERT INTO message_templates (template_name, template_type, category, subject, body, placeholders) VALUES
    ('Customer Booking Confirmation', 'sms', 'booking', NULL, 
     'Hi {customerName}, your booking for {rego} has been confirmed. EEK Mechanical - 0800 769 000', 
     ARRAY['customerName', 'rego']),
    ('Driver En Route', 'sms', 'dispatch', NULL,
     'Hi {customerName}, our driver is on the way to your location for {rego}. ETA: {eta}. EEK Mechanical',
     ARRAY['customerName', 'rego', 'eta']),
    ('Invoice Email', 'email', 'billing', 'Invoice from EEK Mechanical - {rego}',
     'Dear {customerName},\n\nPlease find attached your invoice for vehicle {rego}.\n\nAmount Due: ${amount}\n\nPay online: {paymentLink}\n\nThank you for choosing EEK Mechanical.',
     ARRAY['customerName', 'rego', 'amount', 'paymentLink']),
    ('Release Payment Request', 'sms', 'billing', NULL,
     'Hi {customerName}, your final invoice for {rego} is ${amount}. Pay here: {paymentLink} - EEK Mechanical',
     ARRAY['customerName', 'rego', 'amount', 'paymentLink']),
    ('Supplier Hold Notice', 'sms', 'supplier', NULL,
     'EEK Update - {rego}: Final billing issued to customer. DO NOT release vehicle until notified. Thank you.',
     ARRAY['rego']),
    ('Supplier Release Notice', 'sms', 'supplier', NULL,
     'EEK Update - {rego}: Payment received. You may now RELEASE THE VEHICLE. Thank you.',
     ARRAY['rego'])
ON CONFLICT DO NOTHING;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

