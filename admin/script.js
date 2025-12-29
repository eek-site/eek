// Road and Rescue Admin Panel JavaScript
// Version: 1.2 - Added session rego management and release payment functions
// Last Updated: 2025-12-30

// Session-persistent rego (matches VBA selectedJobRego)
let sessionRego = sessionStorage.getItem('selectedJobRego') || '';

// Load API configuration
let API_CONFIG = {};
try {
    // Load from api-config.js if available
    const script = document.createElement('script');
    script.src = 'api-config.js';
    script.onload = function() {
        API_CONFIG = window.API_CONFIG || {};
    };
    document.head.appendChild(script);
} catch (e) {
    console.warn('API config not loaded, using defaults');
}

/**
 * Sanitize payload before sending to Power Automate flow
 * Removes corrupted characters, encoding issues, and other anomalies
 * @param {Object} payload - Payload to sanitize
 * @returns {Object} Sanitized payload
 */
function sanitizePayload(payload) {
    // Use global sanitizer if available
    if (window.dataSanitizer) {
        return window.dataSanitizer.sanitizeForFlow(payload);
    }
    
    // Fallback basic sanitization
    return basicSanitize(payload);
}

/**
 * Basic fallback sanitization if data-sanitizer.js is not loaded
 * @param {*} value - Value to sanitize
 * @returns {*} Sanitized value
 */
function basicSanitize(value) {
    if (typeof value === 'string') {
        return value
            .replace(/\uFFFD/g, '')           // Unicode replacement char (�)
            .replace(/[\u200B-\u200D\uFEFF]/g, '') // Zero-width chars
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Control chars
            .replace(/[\uE000-\uF8FF]/g, '')  // Private use area
            .replace(/[\uD800-\uDFFF]/g, '')  // Invalid surrogates
            .replace(/\s{2,}/g, ' ')          // Multiple spaces
            .trim();
    }
    
    if (Array.isArray(value)) {
        return value.map(item => basicSanitize(item));
    }
    
    if (value && typeof value === 'object') {
        const sanitized = {};
        for (const [key, val] of Object.entries(value)) {
            sanitized[key] = basicSanitize(val);
        }
        return sanitized;
    }
    
    return value;
}

/**
 * Execute a VBA action via Power Automate or SharePoint API
 */
async function executeAction(actionName, formData = null) {
    try {
        // Get action mapping
        const mapping = API_CONFIG.actionMappings?.[actionName];
        if (!mapping) {
            console.warn(`No mapping found for action: ${actionName}`);
            // Fallback to direct execution
            return await executeViaPowerAutomate(actionName, formData);
        }
        
        // Get flow URL
        const flowUrl = API_CONFIG.flows?.[mapping.flow];
        if (!flowUrl || flowUrl.includes('YOUR_POWER_AUTOMATE')) {
            console.warn(`Flow URL not configured for: ${mapping.flow}`);
            alert(`Action "${actionName}" requires Power Automate flow configuration.\n\nPlease update api-config.js with the correct flow URL.`);
            return;
        }
        
        // Build payload
        const payload = {
            action: mapping.action,
            ...formData
        };
        
        // Sanitize payload before sending to prevent anomalies
        const sanitizedPayload = sanitizePayload(payload);
        console.log('🧹 Sanitized payload for flow:', sanitizedPayload);
        
        // Execute via Power Automate
        const response = await fetch(flowUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sanitizedPayload)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success !== false) {
            alert('Action completed successfully!');
            return result;
        } else {
            throw new Error(result.error || 'Unknown error');
        }
        
    } catch (error) {
        console.error('Error executing action:', error);
        alert(`Error: ${error.message}\n\nCheck console for details.`);
        throw error;
    }
}

/**
 * Execute action directly via Power Automate (fallback)
 */
async function executeViaPowerAutomate(actionName, formData = null) {
    // Try to find a generic flow or use the API management flow
    const flowUrl = API_CONFIG.flows?.jobOperations || API_CONFIG.flows?.apiManagement;
    
    if (!flowUrl || flowUrl.includes('YOUR_POWER_AUTOMATE')) {
        alert(`Action "${actionName}" requires Power Automate flow configuration.\n\nPlease create the flow and update api-config.js.`);
        return;
    }
    
    const payload = {
        action: actionName,
        data: formData
    };
    
    // Sanitize payload before sending to prevent anomalies
    const sanitizedPayload = sanitizePayload(payload);
    console.log('🧹 Sanitized payload for direct flow:', sanitizedPayload);
    
    const response = await fetch(flowUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedPayload)
    });
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
}

/**
 * Get data from SharePoint list (with authentication)
 */
async function getSharePointData(listName, filter = null) {
    try {
        const listPath = API_CONFIG.sharepoint?.lists?.[listName];
        if (!listPath || API_CONFIG.sharepoint.baseUrl.includes('YOUR_TENANT')) {
            console.warn('SharePoint not configured');
            return null;
        }
        
        let url = `${API_CONFIG.sharepoint.baseUrl}/_api/web/lists/getbytitle('${listName}')/items`;
        if (filter) {
            url += `?$filter=${encodeURIComponent(filter)}`;
        }
        
        // Use authenticated fetch if available, otherwise fall back to regular fetch
        let response;
        if (typeof auth !== 'undefined' && auth.isAuthenticated && auth.isAuthenticated()) {
            try {
                response = await auth.authenticatedFetch(url, {
                    method: 'GET'
                });
            } catch (authError) {
                console.warn('Authenticated fetch failed, trying regular fetch:', authError);
                // Fallback to regular fetch with credentials
                response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json;odata=verbose',
                        'Content-Type': 'application/json;odata=verbose'
                    },
                    credentials: 'include'
                });
            }
        } else {
            // No authentication available, use regular fetch
            response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json;odata=verbose',
                    'Content-Type': 'application/json;odata=verbose'
                },
                credentials: 'include'
            });
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data.d.results;
        
    } catch (error) {
        console.error('Error fetching SharePoint data:', error);
        return null;
    }
}

/**
 * Get jobs by rego (yellow highlighted)
 */
async function getJobsByRego(rego = null, yellowOnly = true) {
    try {
        let filter = yellowOnly ? "IsYellowHighlighted eq true" : null;
        if (rego) {
            filter = filter ? `Rego eq '${rego}' and ${filter}` : `Rego eq '${rego}'`;
        }
        
        const jobs = await getSharePointData('Jobs', filter);
        return jobs || [];
    } catch (error) {
        console.error('Error getting jobs:', error);
        return [];
    }
}

/**
 * Get suppliers for a rego
 */
async function getSuppliersForRego(rego) {
    try {
        const filter = `Rego eq '${rego}' and RecordType eq 'Supplier'`;
        const suppliers = await getSharePointData('JobBuildNotes', filter);
        return suppliers || [];
    } catch (error) {
        console.error('Error getting suppliers:', error);
        return [];
    }
}

/**
 * Handle keyboard shortcuts
 */
document.addEventListener('keydown', function(event) {
    // 'q' or 'qq' to exit (matching VBA behavior)
    if (event.key === 'q' || event.key === 'Q') {
        if (event.shiftKey || event.ctrlKey) {
            // 'qq' or Ctrl+Q to exit
            if (confirm('Exit the admin panel?')) {
                window.close();
            }
        } else {
            // 'q' to go back
            const backButton = document.querySelector('.back-button');
            if (backButton) {
                backButton.click();
            }
        }
    }
    
    // Number keys for quick navigation (1-9)
    if (event.key >= '1' && event.key <= '9') {
        const menuItems = document.querySelectorAll('.menu-item, .action-btn');
        const index = parseInt(event.key) - 1;
        if (menuItems[index]) {
            menuItems[index].click();
        }
    }
});

/**
 * Generate Base64-encoded URL parameter for customer-reply form
 * @param {string} bookingId - The booking ID
 * @param {string} contactType - 'customer' or 'supplier'
 * @param {boolean} staffMode - Whether to show staff-only items (customerSupport/supplierSupport)
 * @returns {string} Base64-encoded parameter string
 */
function generateCustomerReplyUrl(bookingId, contactType = 'customer', staffMode = false) {
    // Build query string
    let queryString = `bookingId=${encodeURIComponent(bookingId)}&contactType=${contactType}`;
    
    // Add staff support flag if needed
    if (staffMode) {
        if (contactType === 'customer') {
            queryString += '&customerSupport=true';
        } else if (contactType === 'supplier') {
            queryString += '&supplierSupport=true';
        }
    }
    
    // Encode to Base64
    const encoded = btoa(queryString);
    
    // Return full URL
    return `/customer-reply.html?d=${encoded}`;
}

/**
 * Open customer-reply form with prompt for booking ID
 * @param {string} contactType - 'customer' or 'supplier'
 * @param {boolean} staffMode - Whether to show staff-only items
 */
function openCustomerReplyForm(contactType = 'customer', staffMode = false) {
    const bookingId = prompt(`Enter Booking ID for ${contactType} reply form:`);
    if (!bookingId) {
        return; // User cancelled
    }
    
    const url = generateCustomerReplyUrl(bookingId.trim(), contactType, staffMode);
    window.open(url, '_blank');
}

/**
 * Open customer-reply form with job selection
 * @param {string} contactType - 'customer' or 'supplier'
 * @param {boolean} staffMode - Whether to show staff-only items
 */
async function openCustomerReplyFormWithJobSelection(contactType = 'customer', staffMode = false) {
    // Get rego from user
    const rego = prompt(`Enter Vehicle Registration for ${contactType} reply form:`);
    if (!rego) {
        return; // User cancelled
    }
    
    // Try to get booking ID from SharePoint
    try {
        const jobs = await getJobsByRego(rego.toUpperCase(), false);
        if (jobs && jobs.length > 0) {
            // Use the first job's ID (or let user choose if multiple)
            const job = jobs[0];
            const bookingId = job.Id || job.ID || job.SharePointId || job.Id;
            
            if (bookingId) {
                const url = generateCustomerReplyUrl(bookingId, contactType, staffMode);
                window.open(url, '_blank');
            } else {
                // Fallback: use rego as booking ID
                const url = generateCustomerReplyUrl(rego.toUpperCase(), contactType, staffMode);
                window.open(url, '_blank');
            }
        } else {
            // No job found, use rego as booking ID
            const url = generateCustomerReplyUrl(rego.toUpperCase(), contactType, staffMode);
            window.open(url, '_blank');
        }
    } catch (error) {
        console.error('Error getting job:', error);
        // Fallback: use rego as booking ID
        const url = generateCustomerReplyUrl(rego.toUpperCase(), contactType, staffMode);
        window.open(url, '_blank');
    }
}

// ============================================================================
// SESSION REGO MANAGEMENT (matches VBA selectedJobRego behavior)
// ============================================================================

/**
 * Get the current session rego, prompting if not set
 * @param {boolean} forcePrompt - Force the rego picker even if one is set
 * @returns {string|null} The selected rego or null if cancelled
 */
function getSessionRego(forcePrompt = false) {
    // If rego already set and not forcing prompt, return it
    if (sessionRego && !forcePrompt) {
        console.log('Using existing session rego:', sessionRego);
        return sessionRego;
    }
    
    // Prompt for rego
    const rego = prompt('Enter Vehicle Registration (Rego):');
    if (!rego) {
        return null; // User cancelled
    }
    
    // Store in session
    sessionRego = rego.toUpperCase().trim();
    sessionStorage.setItem('selectedJobRego', sessionRego);
    
    // Update display
    updateRegoDisplay();
    
    return sessionRego;
}

/**
 * Change the session rego (Option 0)
 */
function changeSessionRego() {
    sessionRego = '';
    sessionStorage.removeItem('selectedJobRego');
    const newRego = getSessionRego(true);
    if (newRego) {
        alert(`Session rego changed to: ${newRego}`);
    }
}

/**
 * Update the rego display in the UI
 */
function updateRegoDisplay() {
    const displayEl = document.getElementById('session-rego-display');
    const regoEl = document.getElementById('current-rego');
    
    if (displayEl && regoEl) {
        if (sessionRego) {
            displayEl.style.display = 'block';
            regoEl.textContent = sessionRego;
        } else {
            displayEl.style.display = 'none';
            regoEl.textContent = '-';
        }
    }
}

/**
 * Clear session rego on exit
 */
function clearSessionRego() {
    sessionRego = '';
    sessionStorage.removeItem('selectedJobRego');
}

// ============================================================================
// RELEASE PAYMENT FUNCTIONS (matches VBA Option 9)
// ============================================================================

/**
 * Send Release Payment with Invoice (Main Menu Option 9)
 * Matches VBA SendReleasePaymentWithInvoice
 * Works with both manual entry and SharePoint data sources
 */
async function sendReleasePaymentWithInvoice() {
    try {
        // Get rego (will use session rego if available)
        const rego = getSessionRego();
        if (!rego) {
            return; // User cancelled
        }
        
        console.log('Processing release payment for', rego);
        
        // Get job data based on data source mode
        let jobData;
        if (API_CONFIG.dataSource === 'sharepoint') {
            jobData = await getJobDataForRego(rego);
            if (!jobData) {
                alert('No job found for rego: ' + rego + '\n\nTry manual entry mode.');
                return;
            }
        } else {
            // MANUAL MODE: Prompt for customer details
            jobData = await promptForCustomerDetails(rego);
            if (!jobData) {
                return; // User cancelled
            }
        }
        
        // Get release amount
        let releaseAmount;
        if (API_CONFIG.dataSource === 'sharepoint') {
            releaseAmount = await calculateReleaseAmount(rego);
        } else {
            // MANUAL MODE: Prompt for amount
            const amountStr = prompt('Enter the release amount due (e.g. 250.00):');
            if (!amountStr || isNaN(parseFloat(amountStr))) {
                alert('Invalid amount.');
                return;
            }
            releaseAmount = parseFloat(amountStr);
        }
        
        if (releaseAmount <= 0) {
            alert('Release amount must be greater than $0.00');
            return;
        }
        
        // Confirm with user
        const confirmMsg = `SEND RELEASE PAYMENT\n` +
            `${'─'.repeat(40)}\n\n` +
            `Rego: ${rego}\n` +
            `Customer: ${jobData.customerName}\n` +
            `Email: ${jobData.email}\n` +
            `Mobile: +${jobData.countryCode}${jobData.mobile}\n\n` +
            `AMOUNT DUE: $${releaseAmount.toFixed(2)}\n\n` +
            `This will:\n` +
            `• Create Stripe payment link\n` +
            `• Auto-close job when paid\n\n` +
            `Proceed?`;
        
        if (!confirm(confirmMsg)) {
            return;
        }
        
        // Build unique key for Power Automate
        const uniqueKey = `${rego.toUpperCase().replace(/\s/g, '')}|Release Payment`;
        
        // Build redirect URL for release automation
        const redirectUrl = buildReleaseRedirectUrl(rego, releaseAmount, jobData);
        
        // Create Stripe payment link using REAL API
        const stripeResult = await createStripePaymentLink(
            rego,
            releaseAmount,
            `${rego}: Release Payment`,
            redirectUrl
        );
        
        if (!stripeResult || !stripeResult.url) {
            alert('Failed to create Stripe payment link. Please try again.');
            return;
        }
        
        // Extract token and build final link
        const token = stripeResult.url.split('/').pop();
        const finalLink = `https://www.eek.nz?token=${token}`;
        
        // Generate and open invoice page with payment link
        await generateInvoice({
            rego: rego,
            customerName: jobData.customerName,
            email: jobData.email,
            phone: (jobData.countryCode || '') + (jobData.mobile || ''),
            amount: releaseAmount,
            amountDue: releaseAmount,
            description: 'Release Payment',
            paymentLink: finalLink,
            invoiceType: 'final'
        });
        
        // Copy link to clipboard
        try {
            await navigator.clipboard.writeText(finalLink);
            console.log('Payment link copied to clipboard');
        } catch (e) {
            console.log('Could not copy to clipboard:', e);
        }
        
        // Show success message
        alert(`Release Payment Invoice Generated!\n\n` +
            `Rego: ${rego}\n` +
            `Amount: $${releaseAmount.toFixed(2)}\n\n` +
            `Invoice page opened in new tab.\n` +
            `Payment link copied to clipboard.\n\n` +
            `Customer can:\n` +
            `• View/download invoice as PDF\n` +
            `• Click "Pay Now" to pay via Stripe\n\n` +
            `Job will AUTO-CLOSE when payment is received.`);
        
        console.log('Release payment created:', {
            rego,
            amount: releaseAmount,
            uniqueKey,
            paymentLink: finalLink,
            redirectUrl
        });
        
    } catch (error) {
        console.error('Error sending release payment:', error);
        alert('Error sending release payment: ' + error.message);
    }
}

/**
 * Build the redirect URL for release payment (matches VBA)
 */
function buildReleaseRedirectUrl(rego, amount, jobData) {
    const baseUrl = 'www.eek.nz/thanks/release.html';
    const uniqueKey = `${rego.toUpperCase().replace(/\s/g, '')}|Release Payment`;
    
    const params = new URLSearchParams({
        rego: rego.toUpperCase().replace(/\s/g, ''),
        amount: amount.toFixed(2),
        key: uniqueKey,
        name: jobData.customerName || '',
        email: jobData.email || '',
        phone: (jobData.countryCode || '') + (jobData.mobile || '')
    });
    
    return `${baseUrl}?${params.toString()}`;
}

/**
 * Create Stripe payment link using the REAL Power Automate endpoint
 * This is the same endpoint used by VBA CreateStripeLink
 */
async function createStripePaymentLink(rego, amount, description, redirectUrl) {
    try {
        const flowUrl = API_CONFIG.flows.stripePaymentLink;
        
        // Amount must be in cents for Stripe
        const amountInCents = Math.round(amount * 100);
        
        // Clean description (remove special chars like VBA does)
        const cleanDesc = description
            .replace(/"/g, "'")
            .replace(/[\r\n\t]/g, ' ');
        
        const payload = {
            rego: rego.toUpperCase(),
            amount: amountInCents,
            currency: 'nzd',
            description: cleanDesc,
            redirectUrl: redirectUrl
        };
        
        console.log('Creating Stripe link:', payload);
        
        const response = await fetch(flowUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Stripe link response:', result);
        
        // Extract URL from response
        if (result.url) {
            return { url: result.url };
        }
        
        // Try parsing if response is text
        const text = await response.text();
        const urlMatch = text.match(/"url":"([^"]+)"/);
        if (urlMatch) {
            return { url: urlMatch[1] };
        }
        
        return result;
        
    } catch (error) {
        console.error('Error creating Stripe link:', error);
        throw error;
    }
}

/**
 * Prompt user for customer details (manual mode)
 */
async function promptForCustomerDetails(rego) {
    const customerName = prompt('Enter Customer Name:');
    if (!customerName) return null;
    
    let mobile = prompt('Enter Mobile Number (no country code, e.g. 211234567):');
    if (!mobile) return null;
    if (mobile.startsWith('0')) mobile = mobile.substring(1);
    
    const countryCode = prompt('Enter Country Code (e.g. 64 for NZ):', '64');
    if (!countryCode) return null;
    
    const email = prompt('Enter Customer Email:');
    if (!email) return null;
    
    return {
        customerName,
        mobile,
        countryCode,
        email,
        rego
    };
}

// ============================================================================
// BANK PAYMENT CONFIRMATION (matches VBA Option 10)
// ============================================================================

/**
 * Confirm Bank Payment and Release Vehicle (Main Menu Option 10)
 * Matches VBA ConfirmBankPaymentAndRelease
 * Works with both manual entry and SharePoint data sources
 */
async function confirmBankPaymentAndRelease() {
    try {
        // Get rego
        const rego = getSessionRego();
        if (!rego) {
            return;
        }
        
        // Get job data based on data source mode
        let jobData;
        let releaseAmount;
        
        if (API_CONFIG.dataSource === 'sharepoint') {
            jobData = await getJobDataForRego(rego);
            if (!jobData) {
                alert('No job found for rego: ' + rego + '\n\nTry manual entry mode.');
                return;
            }
            releaseAmount = await calculateReleaseAmount(rego);
        } else {
            // MANUAL MODE: Prompt for details
            const customerName = prompt('Enter Customer Name:');
            if (!customerName) return;
            
            const email = prompt('Enter Customer Email (optional):') || '';
            
            const amountStr = prompt('Enter the bank payment amount received (e.g. 250.00):');
            if (!amountStr || isNaN(parseFloat(amountStr))) {
                alert('Invalid amount.');
                return;
            }
            releaseAmount = parseFloat(amountStr);
            
            jobData = {
                customerName,
                email,
                rego
            };
        }
        
        // Build unique key
        const uniqueKey = `${rego.toUpperCase().replace(/\s/g, '')}|Release Payment`;
        
        // Confirm bank payment
        const confirmMsg = `CONFIRM BANK PAYMENT RECEIVED\n` +
            `${'─'.repeat(40)}\n\n` +
            `Rego: ${rego.toUpperCase()}\n` +
            `Customer: ${jobData.customerName || jobData.CustomerName || 'Unknown'}\n` +
            `Amount: $${releaseAmount.toFixed(2)}\n\n` +
            `This will:\n` +
            `• Record payment as received (Bank)\n` +
            `• Mark job as closed\n` +
            `• Call Power Automate to update xlsm\n\n` +
            `Has the bank payment been received?`;
        
        if (!confirm(confirmMsg)) {
            return;
        }
        
        // Call the release payment confirmation flow (same as release.html does)
        // This adds the "Close Job" row to Job Build Notes
        try {
            const flowUrl = API_CONFIG.flows.releasePaymentConfirmation;
            
            const payload = {
                rego: rego.toUpperCase().replace(/\s/g, ''),
                name: jobData.customerName || jobData.CustomerName || '',
                email: jobData.email || jobData.Email || '',
                phone: '',
                amount: releaseAmount.toFixed(2),
                timestamp: new Date().toISOString(),
                paymentMethod: 'Bank'
            };
            
            console.log('Calling release payment confirmation flow:', payload);
            
            const response = await fetch(flowUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                console.warn('Flow response not OK:', response.status);
            } else {
                console.log('Release payment confirmation flow called successfully');
            }
            
        } catch (flowError) {
            console.warn('Could not call release payment flow:', flowError);
            // Continue anyway - manual confirmation is still valid
        }
        
        alert(`Bank Payment Confirmed!\n\n` +
              `Rego: ${rego.toUpperCase()}\n` +
              `Amount: $${releaseAmount.toFixed(2)}\n` +
              `Method: Bank Transfer\n\n` +
              `Job has been marked as closed.\n` +
              `Power Automate flow triggered to update xlsm.`);
        
        console.log('Bank payment confirmed:', {
            rego,
            amount: releaseAmount,
            uniqueKey,
            method: 'Bank'
        });
        
    } catch (error) {
        console.error('Error confirming bank payment:', error);
        alert('Error confirming bank payment: ' + error.message);
    }
}

// ============================================================================
// SUPPLIER NOTIFICATION FUNCTIONS
// ============================================================================

/**
 * Notify all suppliers for a rego that the vehicle should NOT be released
 * Sent when final billing is issued (before payment)
 * Note: In manual mode, supplier notifications are handled by VBA/xlsm
 */
async function notifySupplierVehicleHold(rego, customerName) {
    // In manual mode, supplier data isn't available in HTML
    // The VBA handles supplier notifications when using xlsm
    if (API_CONFIG.dataSource === 'manual') {
        console.log('Manual mode: Supplier hold notification handled by VBA/xlsm for rego:', rego);
        return;
    }
    
    try {
        // SharePoint mode: Get suppliers and send notifications
        const suppliers = await getSuppliersForRego(rego);
        
        if (!suppliers || suppliers.length === 0) {
            console.log('No suppliers found for rego:', rego);
            return;
        }
        
        const message = `EEK Mechanical Update - Rego ${rego}\n\n` +
            `Final billing has been issued to the customer.\n\n` +
            `IMPORTANT: Please DO NOT release the vehicle until you receive confirmation from EEK Mechanical that payment has been received.\n\n` +
            `Thank you for your cooperation.`;
        
        // Send to each supplier
        for (const supplier of suppliers) {
            const supplierName = supplier.Supplier || supplier.Title;
            const supplierEmail = supplier.Supp_Email;
            const supplierPhone = supplier.Supp_Phone;
            
            if (supplierEmail || supplierPhone) {
                await executeAction('NotifySupplier', {
                    rego: rego,
                    supplierName: supplierName,
                    supplierEmail: supplierEmail,
                    supplierPhone: supplierPhone,
                    subject: `EEK Mechanical - DO NOT RELEASE - ${rego}`,
                    message: message,
                    notificationType: 'vehicleHold'
                });
            }
        }
        
        console.log(`Vehicle hold notifications sent to ${suppliers.length} supplier(s)`);
        
    } catch (error) {
        console.error('Error notifying suppliers (hold):', error);
    }
}

/**
 * Notify all suppliers for a rego that the vehicle CAN be released
 * Sent after payment is confirmed
 * Note: In manual mode, supplier notifications are handled by VBA/xlsm
 */
async function notifySupplierVehicleRelease(rego, customerName) {
    // In manual mode, supplier data isn't available in HTML
    // The VBA handles supplier notifications when using xlsm
    if (API_CONFIG.dataSource === 'manual') {
        console.log('Manual mode: Supplier release notification handled by VBA/xlsm for rego:', rego);
        return;
    }
    
    try {
        // SharePoint mode: Get suppliers and send notifications
        const suppliers = await getSuppliersForRego(rego);
        
        if (!suppliers || suppliers.length === 0) {
            console.log('No suppliers found for rego:', rego);
            return;
        }
        
        const message = `EEK Mechanical Update - Rego ${rego}\n\n` +
            `Payment has been received from the customer.\n\n` +
            `You may now RELEASE THE VEHICLE to the customer.\n\n` +
            `Thank you for your assistance with this job.`;
        
        // Send to each supplier
        for (const supplier of suppliers) {
            const supplierName = supplier.Supplier || supplier.Title;
            const supplierEmail = supplier.Supp_Email;
            const supplierPhone = supplier.Supp_Phone;
            
            if (supplierEmail || supplierPhone) {
                await executeAction('NotifySupplier', {
                    rego: rego,
                    supplierName: supplierName,
                    supplierEmail: supplierEmail,
                    supplierPhone: supplierPhone,
                    subject: `EEK Mechanical - RELEASE VEHICLE - ${rego}`,
                    message: message,
                    notificationType: 'vehicleRelease'
                });
            }
        }
        
        console.log(`Vehicle release notifications sent to ${suppliers.length} supplier(s)`);
        
    } catch (error) {
        console.error('Error notifying suppliers (release):', error);
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get job data from SharePoint for a given rego
 */
async function getJobDataForRego(rego) {
    try {
        const filter = `Rego eq '${rego}'`;
        const jobs = await getSharePointData('Jobs', filter);
        
        if (jobs && jobs.length > 0) {
            // Return the most recent job (or yellow highlighted)
            const yellowJob = jobs.find(j => j.IsYellowHighlighted);
            return yellowJob || jobs[0];
        }
        
        return null;
    } catch (error) {
        console.error('Error getting job data:', error);
        return null;
    }
}

/**
 * Calculate release amount (Total Charges K - Total Payments I)
 */
async function calculateReleaseAmount(rego) {
    try {
        const filter = `Rego eq '${rego}'`;
        const notes = await getSharePointData('JobBuildNotes', filter);
        
        if (!notes || notes.length === 0) {
            return 0;
        }
        
        let totalCharges = 0;  // Column K equivalent
        let totalPayments = 0; // Column I equivalent
        
        for (const note of notes) {
            // Sum up charges (Costings/ChargesK)
            if (note.ChargesK || note.Costings) {
                totalCharges += parseFloat(note.ChargesK || note.Costings || 0);
            }
            // Sum up payments/reimbursements (ReimbursementI)
            if (note.ReimbursementI) {
                totalPayments += parseFloat(note.ReimbursementI || 0);
            }
        }
        
        return totalCharges - totalPayments;
        
    } catch (error) {
        console.error('Error calculating release amount:', error);
        return 0;
    }
}

// ============================================================================
// INVOICE GENERATION FUNCTIONS
// ============================================================================

/**
 * Get all billable line items for a rego from SharePoint
 */
async function getLineItemsForRego(rego) {
    try {
        const filter = `Rego eq '${rego}'`;
        const notes = await getSharePointData('JobBuildNotes', filter);
        
        if (!notes || notes.length === 0) {
            return { lineItems: [], totalCharges: 0, totalPaid: 0 };
        }
        
        const lineItems = [];
        let totalCharges = 0;
        let totalPaid = 0;
        
        for (const note of notes) {
            const recordType = (note.RecordType || note.Type || '').toLowerCase();
            
            // Billable items
            if (recordType === 'billable') {
                const amount = parseFloat(note.ChargesK || note.Costings || 0);
                lineItems.push({
                    description: note.JobNotes || note.Title || 'Service',
                    qty: 1,
                    unitPrice: amount,
                    total: amount,
                    type: 'charge'
                });
                totalCharges += amount;
                
                // Check if paid
                if (note.PaidMethod && note.PaidMethod !== 'No') {
                    totalPaid += amount;
                }
            }
            
            // Deposits/Payments
            if (recordType === 'deposit' || recordType === 'reimbursement') {
                const amount = parseFloat(note.ReimbursementI || 0);
                lineItems.push({
                    description: note.JobNotes || 'Payment Received',
                    qty: 1,
                    unitPrice: -amount,
                    total: -amount,
                    type: 'payment'
                });
                totalPaid += amount;
            }
            
            // Refunds
            if (recordType === 'refund') {
                const amount = parseFloat(note.ReimbursementI || 0);
                lineItems.push({
                    description: note.JobNotes || 'Refund',
                    qty: 1,
                    unitPrice: -amount,
                    total: -amount,
                    type: 'refund'
                });
            }
        }
        
        return { lineItems, totalCharges, totalPaid };
        
    } catch (error) {
        console.error('Error getting line items:', error);
        return { lineItems: [], totalCharges: 0, totalPaid: 0 };
    }
}

/**
 * Generate and open an invoice page
 * @param {Object} options - Invoice options
 */
async function generateInvoice(options = {}) {
    const rego = options.rego || getSessionRego();
    if (!rego) {
        alert('No rego specified');
        return;
    }
    
    let invoiceData = {
        rego: rego.toUpperCase(),
        date: new Date().toISOString(),
        invoiceType: options.invoiceType || 'final'
    };
    
    // Get data based on mode
    if (API_CONFIG.dataSource === 'sharepoint') {
        // SharePoint mode: Pull all data from lists
        const jobData = await getJobDataForRego(rego);
        if (jobData) {
            invoiceData.customerName = jobData.InvoiceName || jobData.CustomerName;
            invoiceData.email = jobData.Email;
            invoiceData.phone = (jobData.Phone1 || '').replace(/[^0-9]/g, '');
            invoiceData.address = jobData.Address || '';
        }
        
        // Get line items
        const { lineItems, totalCharges, totalPaid } = await getLineItemsForRego(rego);
        invoiceData.lineItems = JSON.stringify(lineItems);
        invoiceData.subtotal = totalCharges;
        invoiceData.alreadyPaid = totalPaid;
        invoiceData.amountDue = totalCharges - totalPaid;
        
    } else {
        // Manual mode: Use provided options or prompt
        invoiceData.customerName = options.customerName || prompt('Customer Name:') || 'Customer';
        invoiceData.email = options.email || prompt('Customer Email:') || '';
        invoiceData.phone = options.phone || '';
        
        // Line items from options or single amount
        if (options.lineItems) {
            invoiceData.lineItems = JSON.stringify(options.lineItems);
        } else if (options.amount) {
            invoiceData.lineItems = JSON.stringify([{
                description: options.description || 'Release Payment',
                qty: 1,
                unitPrice: options.amount,
                total: options.amount
            }]);
        }
        
        invoiceData.amountDue = options.amount || options.amountDue || 0;
        invoiceData.alreadyPaid = options.alreadyPaid || 0;
    }
    
    // Add payment link if provided
    if (options.paymentLink) {
        invoiceData.paymentLink = options.paymentLink;
    }
    
    // Generate invoice number
    const timestamp = Date.now().toString().slice(-6);
    const prefix = invoiceData.invoiceType === 'final' ? 'FIN' : 'INT';
    invoiceData.invoiceNumber = `${prefix}-${timestamp}`;
    
    // Open invoice page
    openInvoicePage(invoiceData);
    
    return invoiceData;
}

/**
 * Open the invoice page with data
 */
function openInvoicePage(invoiceData) {
    // Store data in sessionStorage for the invoice page to read
    sessionStorage.setItem('invoiceData', JSON.stringify(invoiceData));
    
    // Also build URL params as backup
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(invoiceData)) {
        if (value !== undefined && value !== null) {
            params.set(key, value);
        }
    }
    
    // Encode params
    const encoded = btoa(params.toString());
    
    // Open invoice page
    const invoiceUrl = `invoice.html?d=${encoded}`;
    window.open(invoiceUrl, '_blank', 'width=900,height=800');
    
    console.log('Invoice page opened with data:', invoiceData);
}

/**
 * Initialize page
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Road and Rescue Admin Panel loaded');
    
    // Update rego display on page load
    updateRegoDisplay();
    
    // Prompt for rego on main menu load (like VBA StartMenu)
    if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/admin/')) {
        // Only prompt if no rego set and not on subpage
        if (!sessionRego) {
            // Small delay to let page render first
            setTimeout(() => {
                const shouldPrompt = confirm('Would you like to select a rego for this session?');
                if (shouldPrompt) {
                    getSessionRego(true);
                }
            }, 500);
        }
    }
    
    // Add loading states to buttons
    const buttons = document.querySelectorAll('.action-btn, .menu-item');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            if (this.classList.contains('action-btn')) {
                this.style.opacity = '0.7';
                setTimeout(() => {
                    this.style.opacity = '1';
                }, 500);
            }
        });
    });
    
    // Clear session rego on window close
    window.addEventListener('beforeunload', function() {
        // Optionally clear session rego when closing
        // clearSessionRego();
    });
});

