/**
 * Road and Rescue - Application Configuration
 * Version: 2.0 - Complete cloud system
 */

const APP_CONFIG = {
    // ========================================================================
    // SUPABASE CONFIGURATION
    // ========================================================================
    // Get these from your Supabase project settings > API
    SUPABASE_URL: 'YOUR_SUPABASE_URL',  // e.g., https://xyzcompany.supabase.co
    SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',  // Public anon key
    
    // ========================================================================
    // DATA SOURCE
    // ========================================================================
    // 'supabase' = Use Supabase database (production)
    // 'manual' = Prompt for data (testing without database)
    // 'demo' = Use demo data (for demos)
    dataSource: 'manual',  // Change to 'supabase' when database is ready
    
    // ========================================================================
    // POWER AUTOMATE FLOWS (Existing - Working)
    // ========================================================================
    flows: {
        // Stripe Payment Link Creation
        // Payload: { rego, amount (cents), currency, description, redirectUrl }
        // Returns: { url: "stripe_checkout_url" }
        stripePaymentLink: "https://prod-22.australiasoutheast.logic.azure.com:443/workflows/e902e35b4e574defb0af836b4259602c/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=4DuJt4Ol0Z75ZXD6m4XEtbtGoPlhCnPhor0FsW8ncog",
        
        // Release Payment Confirmation (called from release.html after Stripe payment)
        // Payload: { rego, name, email, phone, amount, timestamp }
        // Adds "Close Job" row to Job Build Notes in Excel
        releasePaymentConfirmation: "https://default61ffc6bcd9ce458b8120d32187c377.0d.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/4c7d9551c5db4b678a54c799e09a4e0b/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ojmWoeVxo660rE1DN_WaafPN8FuMKJ38IXIscYS5efM",
        
        // API Management Flow
        apiManagement: "https://prod-50.australiasoutheast.logic.azure.com:443/workflows/209524261efe4bf584ad77cd745fc58d/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=21khH6fPcAWT-BzK0J11GCOBTO0EWinYErKPqfBdaXI"
    },
    
    // ========================================================================
    // COMPANY INFORMATION
    // ========================================================================
    company: {
        name: 'EEK Mechanical',
        tradingName: 'Road and Rescue',
        phone: '0800 769 000',
        email: 'info@eek.nz',
        website: 'www.eek.nz',
        address: {
            line1: 'Level 1, 6 Johnsonville Road',
            suburb: 'Johnsonville',
            city: 'Wellington',
            postcode: '6037',
            country: 'New Zealand'
        },
        gstNumber: ''  // Add if applicable
    },
    
    // ========================================================================
    // BANK DETAILS
    // ========================================================================
    bank: {
        name: 'ANZ Chartwell',
        accountName: 'EEK Mechanical',
        accountNumber: '06-0313-0860749-00'
    },
    
    // ========================================================================
    // SMS GATEWAY (TNZ)
    // ========================================================================
    sms: {
        gateway: 'sms.tnz.co.nz',
        defaultCountryCode: '64',
        fromEmail: 'no-reply@eek.nz',
        // Format: +{countryCode}{number}@sms.tnz.co.nz
        buildAddress: function(countryCode, number) {
            let cleanNumber = number.replace(/[^0-9]/g, '');
            if (cleanNumber.startsWith('0')) {
                cleanNumber = cleanNumber.substring(1);
            }
            return `+${countryCode || this.defaultCountryCode}${cleanNumber}@${this.gateway}`;
        }
    },
    
    // ========================================================================
    // STRIPE CONFIGURATION
    // ========================================================================
    stripe: {
        // Redirect URLs after payment
        redirectBase: 'www.eek.nz/thanks',
        releaseRedirect: 'www.eek.nz/thanks/release.html',
        depositRedirect: 'www.eek.nz/thanks/deposit.html',
        
        // Currency
        currency: 'nzd'
    },
    
    // ========================================================================
    // EXTERNAL APIS
    // ========================================================================
    external: {
        carJam: {
            baseUrl: 'https://www.carjam.co.nz',
            apiVehicle: '/api/car/',
            apiAvailability: '/api/availability/',
            apiValuation: '/a/vehicle:valuation',
            apiJapan: '/a/vehicle:japan_lookup'
        }
    },
    
    // ========================================================================
    // INVOICE SETTINGS
    // ========================================================================
    invoice: {
        prefix: {
            final: 'FIN',
            interim: 'INT',
            credit: 'CRD'
        },
        termsUrl: 'https://www.eek.nz/terms-of-service',
        paymentTermsDays: 7
    },
    
    // ========================================================================
    // JOB STATUSES
    // ========================================================================
    jobStatuses: [
        'New',
        'Booked',
        'Dispatched',
        'In Progress',
        'Awaiting Parts',
        'Completed',
        'Awaiting Payment',
        'Closed',
        'Cancelled'
    ],
    
    // ========================================================================
    // RECORD TYPES (for Job Build Notes)
    // ========================================================================
    recordTypes: [
        'Billable',
        'Supplier',
        'Deposit',
        'Reimbursement',
        'Refund',
        'CloseJob'
    ],
    
    // ========================================================================
    // SUPPLIER TYPES
    // ========================================================================
    supplierTypes: [
        'Tow',
        'Workshop',
        'Fuel Extraction',
        'Locksmith',
        'Glass',
        'Electrical',
        'Tyres',
        'Parts',
        'Storage',
        'Transport',
        'Other'
    ],
    
    // ========================================================================
    // REGIONS (NZ)
    // ========================================================================
    regions: [
        'Northland',
        'Auckland',
        'Waikato',
        'Bay of Plenty',
        'Gisborne',
        'Hawkes Bay',
        'Taranaki',
        'Manawatu-Wanganui',
        'Wellington',
        'Tasman',
        'Nelson',
        'Marlborough',
        'West Coast',
        'Canterbury',
        'Otago',
        'Southland'
    ],
    
    // ========================================================================
    // UI SETTINGS
    // ========================================================================
    ui: {
        // Session rego persistence key
        sessionRegoKey: 'selectedJobRego',
        
        // Animation durations (ms)
        animationDuration: 300,
        
        // Date format
        dateFormat: 'dd/MM/yyyy',
        
        // Currency format
        currencySymbol: '$',
        currencyDecimals: 2
    },
    
    // ========================================================================
    // FEATURE FLAGS
    // ========================================================================
    features: {
        // Enable/disable Power Automate integration (disable to use Supabase only)
        usePowerAutomate: true,
        
        // Enable/disable Excel xlsm sync via Power Automate
        syncToExcel: true,
        
        // Enable CarJam vehicle lookup
        enableCarJam: true,
        
        // Enable SMS notifications
        enableSms: true,
        
        // Enable email notifications
        enableEmail: true,
        
        // Enable activity logging
        enableActivityLog: true,
        
        // Demo mode (shows sample data)
        demoMode: false
    }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format currency amount
 */
APP_CONFIG.formatCurrency = function(amount) {
    return this.ui.currencySymbol + parseFloat(amount || 0).toFixed(this.ui.currencyDecimals);
};

/**
 * Format date
 */
APP_CONFIG.formatDate = function(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-NZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

/**
 * Format phone number for display
 */
APP_CONFIG.formatPhone = function(phone, countryCode = '64') {
    if (!phone) return '';
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
        clean = clean.substring(1);
    }
    return `+${countryCode} ${clean.substring(0, 2)} ${clean.substring(2, 5)} ${clean.substring(5)}`;
};

/**
 * Build SMS address
 */
APP_CONFIG.buildSmsAddress = function(phone, countryCode) {
    return this.sms.buildAddress(countryCode, phone);
};

/**
 * Build Stripe redirect URL for release payments
 */
APP_CONFIG.buildReleaseRedirectUrl = function(rego, amount, customerName, email, phone) {
    const uniqueKey = `${rego.toUpperCase().replace(/\s/g, '')}|Release Payment`;
    
    const params = new URLSearchParams({
        rego: rego.toUpperCase().replace(/\s/g, ''),
        amount: parseFloat(amount).toFixed(2),
        key: uniqueKey,
        name: customerName || '',
        email: email || '',
        phone: phone || ''
    });
    
    return `${this.stripe.releaseRedirect}?${params.toString()}`;
};

/**
 * Get bank details formatted for invoice
 */
APP_CONFIG.getBankDetailsFormatted = function() {
    return `Bank: ${this.bank.name}\nAccount: ${this.bank.accountName}\nNumber: ${this.bank.accountNumber}`;
};

/**
 * Get company address formatted
 */
APP_CONFIG.getAddressFormatted = function() {
    const a = this.company.address;
    return `${a.line1}, ${a.suburb}, ${a.city} ${a.postcode}`;
};

// ============================================================================
// EXPORT
// ============================================================================

// Make available globally
window.APP_CONFIG = APP_CONFIG;

// Also keep as API_CONFIG for backward compatibility with existing code
window.API_CONFIG = {
    dataSource: APP_CONFIG.dataSource,
    flows: APP_CONFIG.flows,
    sms: APP_CONFIG.sms,
    bankDetails: APP_CONFIG.bank,
    sharepoint: {
        baseUrl: "https://YOUR_TENANT.sharepoint.com/sites/YOUR_SITE",
        lists: {}
    }
};

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APP_CONFIG;
}

