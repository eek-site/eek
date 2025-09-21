/**
 * Eek Mobile Mechanical - Master Configuration & Shared Functions
 * This file contains all shared functionality across the website
 * Include this file on every page to ensure consistency
 */

// === CONFIGURATION ===
const EEK_CONFIG = {
    // API Endpoints
    TRACKING_API_URL: "https://default61ffc6bcd9ce458b8120d32187c377.0d.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/2f31c90260554c5a9d6dcffec47bc6c2/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Ou7iqzZ1YI2PzT_9X-M6PT5iVo2QRboWnFZrO3IBOL4",
    SYSTEM_STATUS_API_URL: "https://default61ffc6bcd9ce458b8120d32187c377.0d.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/17b1d2990e6f4082a2b0d9c2f1a29025/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=bPyoxJ24kuxJZOyLGAclGaEuH6BHwUTFaGmYOwHofa8",
    FIRST_VISIT_URL: "https://default61ffc6bcd9ce458b8120d32187c377.0d.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/2f31c90260554c5a9d6dcffec47bc6c2/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Ou7iqzZ1YI2PzT_9X-M6PT5iVo2QRboWnFZrO3IBOL4",
    
    // Phone Numbers
    PHONE_NUMBERS: {
        default: {
            tel: 'tel:0800769000',
            display: '0800 769 000'
        },
        tracking: {
            tel: 'tel:0800447153', 
            display: '0800 447 153'
        }
    },
    
    // Business Hours (NZ Time)
    BUSINESS_HOURS: {
        weekdays: { start: 7, end: 17 }, // 7 AM - 5 PM
        weekends: { start: 7, end: 12 }  // 7 AM - 12 PM
    },
    
    // Storage Keys
    STORAGE_KEYS: {
        sessionId: "eek_session_id",
        gclid: "eek_gclid",
        gclidTimestamp: "eek_gclid_timestamp",
        phonePreference: "eek_phone_preference",
        firstVisitSent: "eek_first_visit_sent"
    }
};

// === GLOBAL STATE ===
let EEK_STATE = {
    sessionId: null,
    gclid: null,
    utmData: {},
    hasPaymentToken: false,
    systemActive: true,
    duringBusinessHours: false
};

// === PHONE NUMBER MANAGEMENT ===
function getDisplayPhoneNumber() {
    const urlParams = new URLSearchParams(window.location.search);
    const currentGclid = urlParams.get('gclid');
    
    // PRIORITY 1: Current URL GCLID
    if (currentGclid) {
        localStorage.setItem(EEK_CONFIG.STORAGE_KEYS.phonePreference, 'tracking');
        return EEK_CONFIG.PHONE_NUMBERS.tracking;
    }
    
    // PRIORITY 2: Stored GCLID or preference
    const storedGclid = localStorage.getItem(EEK_CONFIG.STORAGE_KEYS.gclid);
    const storedPreference = localStorage.getItem(EEK_CONFIG.STORAGE_KEYS.phonePreference);
    
    if (storedGclid && isGCLIDValid() || storedPreference === 'tracking') {
        return EEK_CONFIG.PHONE_NUMBERS.tracking;
    }
    
    // PRIORITY 3: Default
    localStorage.setItem(EEK_CONFIG.STORAGE_KEYS.phonePreference, 'default');
    return EEK_CONFIG.PHONE_NUMBERS.default;
}

function updatePhoneNumbers() {
    const phoneData = getDisplayPhoneNumber();
    
    // Update all phone links
    document.querySelectorAll('.phone-link').forEach(link => {
        link.href = phoneData.tel;
    });
    
    // Update phone display text
    document.querySelectorAll('.phone-display').forEach(span => {
        if (span.textContent === 'Eek Now') {
            return; // Keep sticky button text unchanged
        }
        span.textContent = phoneData.display;
    });
    
    console.log('📞 Phone numbers updated:', phoneData.display);
}

// === GCLID MANAGEMENT ===
function isGCLIDValid() {
    const storedTimestamp = localStorage.getItem(EEK_CONFIG.STORAGE_KEYS.gclidTimestamp);
    if (!storedTimestamp) return false;
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return new Date(storedTimestamp) > thirtyDaysAgo;
}

function getGCLID() {
    const urlParams = new URLSearchParams(window.location.search);
    let gclidValue = urlParams.get('gclid');
    
    // If GCLID in URL, store it
    if (gclidValue) {
        localStorage.setItem(EEK_CONFIG.STORAGE_KEYS.gclid, gclidValue);
        localStorage.setItem(EEK_CONFIG.STORAGE_KEYS.gclidTimestamp, new Date().toISOString());
        localStorage.setItem(EEK_CONFIG.STORAGE_KEYS.phonePreference, "tracking");
        console.log('✅ GCLID captured from URL:', gclidValue);
        return gclidValue;
    }
    
    // Otherwise, try to get stored GCLID
    const storedGclid = localStorage.getItem(EEK_CONFIG.STORAGE_KEYS.gclid);
    
    if (storedGclid && isGCLIDValid()) {
        console.log('📋 Using stored GCLID:', storedGclid);
        return storedGclid;
    } else if (storedGclid) {
        // GCLID expired
        localStorage.removeItem(EEK_CONFIG.STORAGE_KEYS.gclid);
        localStorage.removeItem(EEK_CONFIG.STORAGE_KEYS.gclidTimestamp);
        localStorage.removeItem(EEK_CONFIG.STORAGE_KEYS.phonePreference);
        console.log('⚠️ GCLID expired and removed');
    }
    
    return null;
}

// === SESSION MANAGEMENT ===
function getOrCreateSessionId() {
    let sid = localStorage.getItem(EEK_CONFIG.STORAGE_KEYS.sessionId);
    
    if (!sid) {
        // Try to get from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        sid = urlParams.get('session_id');
        
        if (sid) {
            localStorage.setItem(EEK_CONFIG.STORAGE_KEYS.sessionId, sid);
            console.log('🔄 Session ID restored from URL');
        } else {
            // Create new session ID
            sid = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem(EEK_CONFIG.STORAGE_KEYS.sessionId, sid);
            console.log('🆕 New session ID created');
        }
    } else {
        console.log('✅ Existing session ID found');
    }
    
    return sid;
}

// === BUSINESS HOURS ===
function isWithinBusinessHours() {
    const nzTime = new Date().toLocaleString("en-US", {timeZone: "Pacific/Auckland"});
    const now = new Date(nzTime);
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday
    const hour = now.getHours();
    const minutes = now.getMinutes();
    const time = hour + minutes / 60;
    
    let isOpen = false;
    
    // Monday-Friday: 7:00 AM - 5:00 PM (NZ time)
    if (day >= 1 && day <= 5) {
        isOpen = time >= EEK_CONFIG.BUSINESS_HOURS.weekdays.start && 
                 time < EEK_CONFIG.BUSINESS_HOURS.weekdays.end;
    }
    
    // Saturday-Sunday: 7:00 AM - 12:00 PM (NZ time)
    if (day === 0 || day === 6) {
        isOpen = time >= EEK_CONFIG.BUSINESS_HOURS.weekends.start && 
                 time < EEK_CONFIG.BUSINESS_HOURS.weekends.end;
    }
    
    console.log('🕒 Business hours check:', isOpen ? 'OPEN' : 'CLOSED', `(${now.toLocaleString()} NZ Time)`);
    
    return isOpen;
}

// === SYSTEM STATUS ===
async function checkSystemStatus() {
    try {
        console.log('🔄 Checking system status...');
        
        const response = await fetch(EEK_CONFIG.SYSTEM_STATUS_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({}),
            cache: "no-store",
            timeout: 10000
        });
        
        if (response.ok) {
            const data = await response.json();
            const isActive = data.state === 'Active';
            console.log('✅ System status check successful:', isActive ? 'ACTIVE' : 'INACTIVE');
            return isActive;
        } else {
            console.warn('⚠️ System status API returned non-OK status:', response.status);
        }
    } catch (error) {
        console.error('❌ Error checking system status:', error);
    }
    
    // Default to active if check fails
    console.log('🔄 Defaulting to ACTIVE due to API failure');
    return true;
}

// === PAYMENT TOKEN HANDLING ===
function hasPaymentToken() {
    const urlParams = new URLSearchParams(window.location.search);
    return !!urlParams.get('token');
}

function getPaymentToken() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('token');
}

// === URL PARAMETER UTILITIES ===
function buildTrackingParams() {
    const params = new URLSearchParams();
    const urlParams = new URLSearchParams(window.location.search);
    
    // Preserve payment token if present
    const token = urlParams.get('token');
    if (token) {
        params.set('token', token);
    }
    
    // Preserve GCLID if present
    const gclid = urlParams.get('gclid');
    if (gclid) {
        params.set('gclid', gclid);
    }
    
    // Preserve UTM parameters
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
        const value = urlParams.get(param);
        if (value) {
            params.set(param, value);
        }
    });
    
    // Add session ID for tracking continuity
    const sessionId = localStorage.getItem(EEK_CONFIG.STORAGE_KEYS.sessionId);
    if (sessionId) {
        params.set('session_id', sessionId);
    }
    
    return params.toString();
}

function getUTMData() {
    const urlParams = new URLSearchParams(window.location.search);
    const utm = {};
    const utmParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
    
    // Check URL parameters
    utmParams.forEach(param => {
        const value = urlParams.get(param);
        if (value) {
            utm[param] = value;
            // Store for future use
            localStorage.setItem(`eek_${param}`, value);
        }
    });
    
    // Fill in from localStorage if not in URL
    utmParams.forEach(param => {
        if (!utm[param]) {
            const stored = localStorage.getItem(`eek_${param}`);
            if (stored) {
                utm[param] = stored;
            }
        }
    });
    
    return utm;
}

// === MASTER UI UPDATE FUNCTION ===
async function updateUIState() {
    console.log('🔄 Starting master UI state update...');
    
    // Update global state
    const urlParams = new URLSearchParams(window.location.search);
    EEK_STATE.hasPaymentToken = hasPaymentToken();
    EEK_STATE.gclid = getGCLID();
    const currentGclid = urlParams.get('gclid');
    const effectiveGclid = currentGclid || EEK_STATE.gclid;
    
    // System status logic
    if (effectiveGclid || EEK_STATE.hasPaymentToken) {
        EEK_STATE.systemActive = true;
        console.log('🎯 GCLID or Token detected - forcing system active');
    } else {
        EEK_STATE.systemActive = await checkSystemStatus();
    }
    
    EEK_STATE.duringBusinessHours = isWithinBusinessHours();
    
    console.log('📊 Master State:', {
        systemActive: EEK_STATE.systemActive,
        duringBusinessHours: EEK_STATE.duringBusinessHours,
        hasPaymentToken: EEK_STATE.hasPaymentToken,
        hasGclid: !!effectiveGclid
    });
    
    // Update phone numbers
    updatePhoneNumbers();
    
    // Update banners and buttons
    updateBanners();
    updateButtons();
    updateStickyButtons();
    updatePaymentUI();
    
    console.log('✅ Master UI state update completed');
}

// === BANNER MANAGEMENT ===
function updateBanners() {
    const closedBanner = document.getElementById('closedBanner');
    const paymentBanner = document.getElementById('paymentBanner');
    
    // Payment banner (priority)
    if (paymentBanner && EEK_STATE.hasPaymentToken) {
        paymentBanner.style.display = 'block';
        if (closedBanner) closedBanner.style.display = 'none';
        console.log('💳 Showing payment banner');
        return;
    }
    
    // Closed banner logic
    if (closedBanner) {
        if (EEK_STATE.hasPaymentToken || EEK_STATE.gclid) {
            closedBanner.style.display = 'none';
            console.log('💳🎯 Hiding closed banner (token/gclid user)');
        } else if (!EEK_STATE.systemActive) {
            closedBanner.style.display = 'block';
            updateClosedBannerContent();
            console.log('🕐 Showing closed banner');
        } else {
            closedBanner.style.display = 'none';
            console.log('✅ Hiding closed banner (system active)');
        }
    }
    
    if (paymentBanner && !EEK_STATE.hasPaymentToken) {
        paymentBanner.style.display = 'none';
    }
}

function updateClosedBannerContent() {
    const closedTitle = document.getElementById('closedTitle');
    const afterHoursMessage = document.getElementById('afterHoursMessage');
    const tempUnavailableMessage = document.getElementById('tempUnavailableMessage');
    
    if (EEK_STATE.duringBusinessHours) {
        if (closedTitle) closedTitle.innerHTML = '🚧 PHONE LINES BUSY';
        if (afterHoursMessage) afterHoursMessage.style.display = 'none';
        if (tempUnavailableMessage) tempUnavailableMessage.style.display = 'block';
        const closedBanner = document.getElementById('closedBanner');
        if (closedBanner) closedBanner.style.background = 'linear-gradient(135deg, #ff8c00, #ff6b00)';
    } else {
        if (closedTitle) closedTitle.innerHTML = '🕐 CURRENTLY CLOSED';
        if (afterHoursMessage) afterHoursMessage.style.display = 'block';
        if (tempUnavailableMessage) tempUnavailableMessage.style.display = 'none';
        const closedBanner = document.getElementById('closedBanner');
        if (closedBanner) closedBanner.style.background = 'linear-gradient(135deg, #666, #888)';
    }
}

// === BUTTON MANAGEMENT ===
function updateButtons() {
    const normalButtons = document.querySelectorAll('.normal-hours-btn');
    const afterHoursButtons = document.querySelectorAll('.after-hours-btn');
    
    const showNormalButtons = EEK_STATE.systemActive;
    const showAfterHoursButtons = !EEK_STATE.systemActive;
    
    normalButtons.forEach(btn => {
        btn.style.display = showNormalButtons ? 'inline-block' : 'none';
    });
    
    afterHoursButtons.forEach(btn => {
        btn.style.display = showAfterHoursButtons ? 'inline-block' : 'none';
    });
    
    console.log('🔘 Buttons - Normal:', showNormalButtons ? 'VISIBLE' : 'HIDDEN', 
                'After-hours:', showAfterHoursButtons ? 'VISIBLE' : 'HIDDEN');
}

// === STICKY BUTTON MANAGEMENT ===
function updateStickyButtons() {
    const stickyCall = document.getElementById('stickyCallButton');
    const stickyClosed = document.getElementById('stickyClosedButton');
    
    if (stickyCall) {
        if (EEK_STATE.hasPaymentToken) {
            stickyCall.style.display = 'none';
            console.log('📱 Sticky call button: HIDDEN (payment token)');
        } else {
            const shouldShow = EEK_STATE.systemActive;
            stickyCall.style.display = shouldShow ? 'inline-block' : 'none';
            console.log('📱 Sticky call button:', shouldShow ? 'VISIBLE' : 'HIDDEN');
        }
    }
    
    if (stickyClosed) {
        if (!EEK_STATE.systemActive && !EEK_STATE.hasPaymentToken && !EEK_STATE.gclid) {
            stickyClosed.style.display = 'inline-block';
            if (EEK_STATE.duringBusinessHours) {
                stickyClosed.innerHTML = '📅 Book Online';
                stickyClosed.style.background = '#ff8c00';
                stickyClosed.href = '#service-selection';
            } else {
                stickyClosed.innerHTML = '🕐 View Hours';
                stickyClosed.style.background = '#666';
                stickyClosed.href = '#closedBanner';
            }
        } else {
            stickyClosed.style.display = 'none';
        }
    }
}

// === PAYMENT UI MANAGEMENT ===
function updatePaymentUI() {
    const paymentToken = getPaymentToken();
    
    if (paymentToken) {
        // Hide normal service buttons for payment users
        const normalButtons = document.querySelectorAll('.normal-hours-btn');
        normalButtons.forEach(btn => {
            btn.style.display = 'none';
        });
        
        // Set up payment functionality
        setupPaymentHandlers(paymentToken);
        console.log('💳 Payment UI configured for token:', paymentToken);
    }
}

function setupPaymentHandlers(token) {
    // Main page payment setup
    const stripePaymentBlock = document.getElementById('stripePaymentBlock');
    const termsCheckbox = document.getElementById('termsCheckbox');
    const payNowButton = document.getElementById('payNowButton');
    const stripePaymentSticky = document.getElementById('stripePaymentSticky');
    
    if (stripePaymentBlock && termsCheckbox && payNowButton && stripePaymentSticky) {
        stripePaymentBlock.style.display = 'block';
        stripePaymentSticky.style.display = 'inline-block';
        stripePaymentSticky.href = '#stripePaymentBlock';
        
        termsCheckbox.addEventListener('change', () => {
            payNowButton.style.display = termsCheckbox.checked ? 'inline-block' : 'none';
        });
        
        payNowButton.addEventListener('click', () => {
            window.location.href = `https://buy.stripe.com/${token}`;
        });
    }
    
    // More Options page payment setup
    const paymentBannerButton = document.getElementById('paymentBannerButton');
    if (paymentBannerButton) {
        paymentBannerButton.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = `https://buy.stripe.com/${token}`;
        });
    }
}

// === LINK MANAGEMENT ===
function updateServiceLinks() {
    const trackingParams = buildTrackingParams();
    
    document.querySelectorAll('.service-link').forEach(link => {
        const service = link.dataset.service;
        if (service) {
            const baseUrl = `/book-service?service=${service}`;
            const fullUrl = trackingParams ? `${baseUrl}&${trackingParams}` : baseUrl;
            
            if (link.classList.contains('after-hours-btn') || link.getAttribute('href') === '#service-selection') {
                link.href = fullUrl;
            } else {
                link.dataset.bookingUrl = fullUrl;
            }
        }
    });
    
    // Update More Options link
    const moreOptionsLink = document.querySelector('.more-options-link, a[href*="more-options"]');
    if (moreOptionsLink) {
        const baseUrl = '/more-options';
        const fullUrl = trackingParams ? `${baseUrl}?${trackingParams}` : baseUrl;
        moreOptionsLink.href = fullUrl;
        console.log('🔗 More Options link updated:', fullUrl);
    }
    
    console.log('🔗 Service links updated with tracking parameters:', trackingParams);
}

// === INITIALIZATION ===
function initializePage() {
    console.log('🚀 Initializing Eek Mobile Mechanical page...');
    
    // Initialize state
    EEK_STATE.sessionId = getOrCreateSessionId();
    EEK_STATE.gclid = getGCLID();
    EEK_STATE.utmData = getUTMData();
    EEK_STATE.hasPaymentToken = hasPaymentToken();
    
    // Update UI
    updateUIState();
    updateServiceLinks();
    
    // Set up periodic checks
    setInterval(updateUIState, 5 * 60 * 1000); // Every 5 minutes
    
    console.log('✅ Page initialization complete');
}

// === AUTO-INITIALIZE ON DOM CONTENT LOADED ===
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePage);
} else {
    initializePage();
}

// === EXPORT FOR GLOBAL ACCESS ===
window.EEK_CONFIG = EEK_CONFIG;
window.EEK_STATE = EEK_STATE;
window.updateUIState = updateUIState;
window.updatePhoneNumbers = updatePhoneNumbers;
window.buildTrackingParams = buildTrackingParams;
