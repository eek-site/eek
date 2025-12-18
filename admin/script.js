// Road and Rescue Admin Panel JavaScript

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
        
        // Execute via Power Automate
        const response = await fetch(flowUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
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
    
    const response = await fetch(flowUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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

/**
 * Initialize page
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Road and Rescue Admin Panel loaded');
    
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
});

