/**
 * Eek Mobile Mechanical - Master Configuration & Shared Functions (COMPLETE FIX)
 * This file contains all shared functionality across the website
 * Include this file on every page to ensure consistency
 * 
 * COMPLETE FIX VERSION: Properly corrected syntax error in detectAndUpdateLogo function
 */

// === INJECT COMPREHENSIVE STYLE GUIDE ===
function injectMasterStyles() {
    if (document.getElementById('eek-master-styles')) return; // Already injected
    
    // Check if style guide is already loaded
    const existingStyleGuide = document.querySelector('link[href*="eek-style-guide"]') || 
                               document.getElementById('eek-style-guide');
    
    if (existingStyleGuide) {
        console.log('📋 Style guide already loaded');
        return;
    }
    
    // Try to load external style guide first
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/eek-style-guide.css';
    link.id = 'eek-style-guide';
    
    // If external file fails, inject critical styles
    link.onerror = function() {
        injectFallbackStyles();
    };
    
    document.head.appendChild(link);
    console.log('📋 Style guide linked');
}

function injectFallbackStyles() {
    if (document.getElementById('eek-master-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'eek-master-styles';
    style.textContent = `
        /* Critical fallback styles - minimal CSS variables only */
        :root {
            --eek-primary: #ff5500;
            --eek-primary-hover: #e64a00;
            --eek-success: #28a745;
            --eek-success-hover: #20a142;
            --eek-bg-body: #f5f5f5;
            --eek-bg-white: #ffffff;
            --eek-text: #333;
            --eek-shadow-md: 0 4px 8px rgba(0,0,0,0.1);
            --eek-radius-lg: 12px;
            --eek-radius-full: 50px;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: var(--eek-bg-body);
            color: var(--eek-text);
            margin: 0;
            padding: 0 0 80px 0;
            text-align: center;
        }
        
        /* Payment Block Visibility Control */
        #stripePaymentBlock {
            display: none !important;
        }
        
        body.eek-has-payment-token #stripePaymentBlock {
            display: block !important;
        }
        
        #stripePaymentSticky {
            display: none !important;
        }
        
        body.eek-has-payment-token #stripePaymentSticky {
            display: block !important;
        }
        
        #payNowButton.eek-hidden {
            display: none !important;
        }
        
        .eek-payment-block.eek-hidden {
            display: none !important;
        }
        
        .sticky-payment.eek-hidden {
            display: none !important;
        }
        
        .eek-hidden {
            display: none !important;
        }
    `;
    document.head.appendChild(style);
    console.log('📋 Fallback styles injected');
}

function initializeRedditPixel() {
    if (window.rdt) return; // Already initialized
    
    !function(w,d){if(!w.rdt){var p=w.rdt=function(){p.sendEvent?p.sendEvent.apply(p,arguments):p.callQueue.push(arguments)};p.callQueue=[];var t=d.createElement("script");t.src="https://www.redditstatic.com/ads/pixel.js",t.async=!0;var s=d.getElementsByTagName("script")[0];s.parentNode.insertBefore(t,s)}}
    (window,document);
    
    window.rdt('init', 'a2_hf16791nsdhx');
    
    console.log('📊 Reddit Pixel initialized (PageVisit will be tracked by trackPageView)');
}

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
    },
    
    // Service Values for tracking (in cents)
    SERVICE_VALUES: {
        'inspection_call': 19900,
        'breakdown_call': 28900,
        'battery_call': 14900,
        'fuel_drain_call': 39900,
        'header_call': 25000,
        'sticky_call': 25000,
        'more_options_call': 25000,
        'customer_call': 25000,
        'emergency_rescue': 35000,
        'customer_emergency': 35000,
        'find_me_tool': 15000,
        'customer_find_me': 15000,
        'customer_support': 10000,
        'supplier_portal': 5000,
        'supplier_relations': 5000,
        'employment_apply': 8000,
        'utility_maps': 5000,
        'book_online_after_hours': 20000,
        'customer_book_online': 20000,
        'after_hours_emergency': 35000,
        'breakdown_after_hours': 35000,
        'battery_after_hours': 20000,
        'fuel_drain_after_hours': 45000,
        'inspection_after_hours': 25000
    },
    
    // Service Type Mapping
    SERVICE_TYPES: {
        'inspection_call': 'Pre-Purchase Inspection',
        'breakdown_call': 'Emergency Breakdown',
        'battery_call': 'Battery Jump Start',
        'fuel_drain_call': 'Wrong Fuel Rescue',
        'header_call': 'General Inquiry',
        'sticky_call': 'General Inquiry',
        'more_options_call': 'General Inquiry',
        'customer_call': 'General Inquiry',
        'emergency_rescue': 'Emergency Service',
        'customer_emergency': 'Emergency Service',
        'find_me_tool': 'Location Service',
        'customer_find_me': 'Location Service',
        'customer_support': 'Customer Support',
        'after_hours_emergency': 'After Hours Emergency',
        'breakdown_after_hours': 'After Hours Breakdown',
        'battery_after_hours': 'After Hours Battery',
        'fuel_drain_after_hours': 'After Hours Fuel Drain',
        'inspection_after_hours': 'After Hours Inspection'
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

// === LOGO MANAGEMENT (COMPLETELY FIXED) ===
function getLogoForPageType() {
    const currentPath = window.location.pathname.toLowerCase();
    const urlParams = new URLSearchParams(window.location.search);
    const serviceType = urlParams.get('service');
    
    console.log('🔍 Determining logo for path:', currentPath, 'service:', serviceType);
    
    // Pre-purchase inspection pages use lemon logo
    if (currentPath.includes('inspection') || 
        currentPath.includes('pre-purchase') ||
        serviceType === 'inspection') {
        return { file: 'lemon.png', class: 'lemon', type: 'Pre-Purchase Inspection' };
    }
    
    // Inquiry/support pages use sweet-ride logo
    if (currentPath.includes('more-options') ||
        currentPath.includes('customer-escalation') ||
        currentPath.includes('supplier') ||
        currentPath.includes('apply') ||
        currentPath.includes('contact') ||
        currentPath.includes('support')) {
        return { file: 'sweet-ride.png', class: 'sweet-ride', type: 'Inquiry/Support' };
    }
    
    // Index page and booking steps use brand-image (default)
    return { file: 'brand-image.png', class: 'brand-image', type: 'Main/Booking' };
}

function detectAndUpdateLogo() {
    const logoImages = document.querySelectorAll('.eek-brand-image, img[src*="brand-image"], img[src*="sweet-ride"], img[src*="lemon"]');
    
    if (logoImages.length === 0) {
        console.log('ℹ️ No logo images found on page');
        return Promise.resolve();
    }
    
    const logoInfo = getLogoForPageType();
    console.log('🎯 Selected logo:', logoInfo.file, 'for page type:', logoInfo.type);
    
    const updatePromises = Array.from(logoImages).map(img => {
        // If image already has the correct src, skip
        if (img.src && img.src.endsWith(logoInfo.file)) {
            console.log('✅ Logo already correct:', img.src);
            return Promise.resolve();
        }
        
        return new Promise((resolve) => {
            const testImg = new Image();
            
            testImg.onload = function() {
                // Update the logo with full path
                img.src = `/${logoInfo.file}`;
                img.alt = `Eek Mobile Mechanical - Mobile Mechanic Services`;
                
                // Remove old logo classes
                img.classList.remove('brand-image', 'sweet-ride', 'lemon');
                // Add appropriate class
                img.classList.add(logoInfo.class);
                
                console.log('🖼️ Logo updated to:', `/${logoInfo.file}`, 'class:', logoInfo.class);
                resolve();
            };

            testImg.onerror = function() {
                console.warn('❌ Logo file not found:', `/${logoInfo.file}`, '- falling back to /brand-image.png');
                
                // Fallback to brand-image if selected logo doesn't exist
                if (logoInfo.file !== 'brand-image.png') {
                    img.src = '/brand-image.png';
                    img.classList.remove('sweet-ride', 'lemon');
                    img.classList.add('brand-image');
                    console.log('🔄 Fallback logo applied: /brand-image.png');
                }
                resolve();
            };

            testImg.src = `/${logoInfo.file}`;
        });
    });
    
    return Promise.all(updatePromises);
}

// === TRACKING AND ANALYTICS ===
function trackConversion(eventAction, eventCategory = 'Contact') {
    const conversionId = 'eek_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const eventValue = EEK_CONFIG.SERVICE_VALUES[eventAction] || 25000;
    const serviceType = EEK_CONFIG.SERVICE_TYPES[eventAction] || 'General Service';
    
    console.log('🎯 Conversion tracked:', eventAction, 'Value:', eventValue);
    
    // Google Analytics tracking
    if (typeof gtag !== 'undefined') {
        gtag('event', eventAction, {
            'event_category': eventCategory,
            'event_label': serviceType,
            'value': eventValue / 100, // Convert to dollars
            'gclid': EEK_STATE.gclid
        });
        
        // Track phone calls as conversions
        if (eventAction.includes('call')) {
            gtag('event', 'conversion', {
                'send_to': 'AW-17084465163/7Mh8CKFRydsaEIuAwJI_'
            });
        }
    }
    
    // Reddit Pixel tracking
    if (typeof rdt !== 'undefined') {
        rdt('track', 'Lead', {
            'customEventName': eventAction,
            'conversionId': conversionId,
            'value': eventValue,
            'currency': 'NZD',
            'itemCount': 1,
            'eventSource': window.location.pathname.includes('more-options') ? 'more_options_page' : 'main_page',
            'eventCategory': eventCategory,
            'serviceType': serviceType,
            'gclid': EEK_STATE.gclid
        });
    }
}

// === PHONE NUMBER MANAGEMENT ===
function getDisplayPhoneNumber() {
    const urlParams = new URLSearchParams(window.location.search);
    const currentGclid = urlParams.get('gclid');
    const currentToken = urlParams.get('token');
    
    // PRIORITY 1: Current URL GCLID (always takes precedence)
    if (currentGclid) {
        localStorage.setItem(EEK_CONFIG.STORAGE_KEYS.phonePreference, 'tracking');
        console.log('📞 Using tracking number (current URL GCLID):', currentGclid);
        return EEK_CONFIG.PHONE_NUMBERS.tracking;
    }
    
    // PRIORITY 2: Payment token users get tracking number
    if (currentToken) {
        localStorage.setItem(EEK_CONFIG.STORAGE_KEYS.phonePreference, 'tracking');
        console.log('📞 Using tracking number (payment token):', currentToken);
        return EEK_CONFIG.PHONE_NUMBERS.tracking;
    }
    
    // PRIORITY 3: Check if there's a valid stored GCLID
    const storedGclid = localStorage.getItem(EEK_CONFIG.STORAGE_KEYS.gclid);
    if (storedGclid && isGCLIDValid()) {
        console.log('📞 Using tracking number (stored valid GCLID):', storedGclid);
        return EEK_CONFIG.PHONE_NUMBERS.tracking;
    }
    
    // PRIORITY 4: Default number for all other cases
    localStorage.setItem(EEK_CONFIG.STORAGE_KEYS.phonePreference, 'default');
    console.log('📞 Using default number (no valid GCLID or token)');
    return EEK_CONFIG.PHONE_NUMBERS.default;
}

function updatePhoneNumbers() {
    const phoneData = getDisplayPhoneNumber();
    
    console.log('📞 Updating phone numbers to:', phoneData.display, 'Tel:', phoneData.tel);
    
    // Update all phone links
    document.querySelectorAll('.phone-link').forEach((link, index) => {
        link.href = phoneData.tel;
        console.log(`  Updated phone link ${index}:`, link.href);
    });
    
    // Update phone display text - preserve special text like "Eek Now"
    document.querySelectorAll('.phone-display').forEach((span, index) => {
        console.log(`  Phone display ${index} before:`, span.textContent);
        if (span.textContent === 'Eek Now' || span.textContent.includes('Eek')) {
            console.log(`  Keeping special text: "${span.textContent}"`);
            return; // Keep sticky button text unchanged
        }
        span.textContent = phoneData.display;
        console.log(`  Phone display ${index} after:`, span.textContent);
    });
    
    console.log('📞 Phone numbers updated to:', phoneData.display);
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
    
    // PRIORITY 1: If GCLID in current URL, use it and store it
    if (gclidValue) {
        localStorage.setItem(EEK_CONFIG.STORAGE_KEYS.gclid, gclidValue);
        localStorage.setItem(EEK_CONFIG.STORAGE_KEYS.gclidTimestamp, new Date().toISOString());
        localStorage.setItem(EEK_CONFIG.STORAGE_KEYS.phonePreference, "tracking");
        console.log('✅ GCLID captured from current URL:', gclidValue);
        return gclidValue;
    }
    
    // PRIORITY 2: Try to get stored GCLID (only if still valid)
    const storedGclid = localStorage.getItem(EEK_CONFIG.STORAGE_KEYS.gclid);
    
    if (storedGclid && isGCLIDValid()) {
        console.log('📋 Using stored valid GCLID:', storedGclid);
        return storedGclid;
    } else if (storedGclid) {
        // GCLID expired - clean it up
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

// === PAYMENT TOKEN HANDLING ===
function hasPaymentToken() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    // Ensure token exists and is not empty/whitespace
    return !!(token && token.trim() !== '');
}

function getPaymentToken() {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    // Return token only if it exists and is not empty/whitespace
    return (token && token.trim() !== '') ? token.trim() : null;
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

// === UI UPDATE FUNCTION ===
async function updateUIState() {
    console.log('🔄 Starting master UI state update...');
    
    // CRITICAL: Always get fresh state from current URL and reset payment token state first
    EEK_STATE.hasPaymentToken = false;
    
    const urlParams = new URLSearchParams(window.location.search);
    const currentGclid = urlParams.get('gclid');
    const currentToken = urlParams.get('token');
    
    // Update global state from current URL
    EEK_STATE.gclid = getGCLID();
    EEK_STATE.hasPaymentToken = hasPaymentToken();
    
    console.log('🔍 URL Parameter Check:', {
        currentUrlGclid: currentGclid,
        currentUrlToken: currentToken,
        storedGclid: EEK_STATE.gclid,
        hasPaymentToken: EEK_STATE.hasPaymentToken
    });
    
    // System status logic
    if (currentGclid || currentToken) {
        EEK_STATE.systemActive = true;
        console.log('🎯 Current URL GCLID or Token detected - forcing system active');
    } else {
        EEK_STATE.systemActive = await checkSystemStatus();
        console.log('🔄 No current URL params - checking system status via API');
    }
    
    EEK_STATE.duringBusinessHours = isWithinBusinessHours();
    
    console.log('📊 Master State:', {
        systemActive: EEK_STATE.systemActive,
        duringBusinessHours: EEK_STATE.duringBusinessHours,
        hasPaymentToken: EEK_STATE.hasPaymentToken,
        hasCurrentGclid: !!currentGclid,
        hasCurrentToken: !!currentToken,
        hasStoredGclid: !!EEK_STATE.gclid
    });
    
    // CRITICAL: Update body classes first to ensure CSS state is correct
    updateBodyStateClasses();
    
    // Update UI elements based on state
    updateBannerVisibility();
    updateButtonVisibility();
    
    // Update phone numbers
    updatePhoneNumbers();
    
    console.log('✅ Master UI state update completed');
}

// === BANNER VISIBILITY MANAGEMENT ===
function updateBannerVisibility() {
    const banner = document.getElementById('closedBanner');
    
    if (!banner) {
        console.log('⚠️ No closedBanner element found');
        return;
    }
    
    // Show banner when system is inactive OR after business hours (unless payment token)
    const shouldShowBanner = (!EEK_STATE.systemActive || !EEK_STATE.duringBusinessHours) && !EEK_STATE.hasPaymentToken;
    
    if (shouldShowBanner) {
        banner.style.display = 'block';
        console.log('🏷️ Showing after-hours banner');
    } else {
        banner.style.display = 'none';
        console.log('🏷️ Hiding after-hours banner');
    }
}

// === BUTTON VISIBILITY MANAGEMENT ===
function updateButtonVisibility() {
    const callButton = document.getElementById('stickyCallButton');
    const closedButton = document.getElementById('stickyClosedButton');
    const paymentButton = document.getElementById('stripePaymentSticky');
    
    // Update "Book Online" buttons
    const afterHoursButtons = document.querySelectorAll('.after-hours-btn');
    const normalHoursButtons = document.querySelectorAll('.normal-hours-btn');
    
    // Update phone links
    const phoneLinks = document.querySelectorAll('.phone-link');
    
    const shouldShowAfterHours = (!EEK_STATE.systemActive || !EEK_STATE.duringBusinessHours) && !EEK_STATE.hasPaymentToken;
    
    // Show/hide "Book Online" vs normal buttons
    afterHoursButtons.forEach(btn => {
        btn.style.display = shouldShowAfterHours ? 'inline-block' : 'none';
    });
    
    normalHoursButtons.forEach(btn => {
        btn.style.display = shouldShowAfterHours ? 'none' : 'inline-block';
    });
    
    // CRITICAL: Hide phone numbers when system inactive or after hours (unless payment token)
    const shouldShowPhoneNumbers = (EEK_STATE.systemActive && EEK_STATE.duringBusinessHours) || EEK_STATE.hasPaymentToken;
    
    phoneLinks.forEach(link => {
        link.style.display = shouldShowPhoneNumbers ? 'inline-block' : 'none';
    });
    
    console.log('📞 Phone numbers:', shouldShowPhoneNumbers ? 'SHOWN' : 'HIDDEN');
    console.log('📅 Book online buttons:', shouldShowAfterHours ? 'SHOWN' : 'HIDDEN');
    
    // Sticky button logic
    if (EEK_STATE.hasPaymentToken) {
        // Payment token: only show payment button
        if (callButton) callButton.style.display = 'none';
        if (closedButton) closedButton.style.display = 'none';
        if (paymentButton) {
            paymentButton.style.display = 'block';
            paymentButton.style.backgroundColor = '#28a745';
        }
        console.log('💳 Payment mode: showing payment button only');
        
    } else if (!EEK_STATE.systemActive || !EEK_STATE.duringBusinessHours) {
        // System inactive or after hours: show "View Hours" button
        if (callButton) callButton.style.display = 'none';
        if (paymentButton) paymentButton.style.display = 'none';
        if (closedButton) closedButton.style.display = 'block';
        console.log('🕐 After hours mode: showing View Hours button');
        
    } else {
        // Normal hours: show call button
        if (closedButton) closedButton.style.display = 'none';
        if (paymentButton) paymentButton.style.display = 'none';
        if (callButton) callButton.style.display = 'block';
        console.log('📞 Normal hours mode: showing call button');
    }
}

// === BODY STATE CLASS MANAGEMENT ===
function updateBodyStateClasses() {
    const body = document.body;
    
    // CRITICAL: Remove all payment-related classes first
    body.classList.remove('eek-has-payment-token', 'eek-no-payment-token');
    
    // System state classes
    body.classList.toggle('eek-system-active', EEK_STATE.systemActive);
    body.classList.toggle('eek-system-inactive', !EEK_STATE.systemActive);
    
    // Business hours classes
    body.classList.toggle('eek-during-business-hours', EEK_STATE.duringBusinessHours);
    body.classList.toggle('eek-after-hours', !EEK_STATE.duringBusinessHours);
    
    // Payment token classes - CRITICAL: Only add if we actually have a token
    if (EEK_STATE.hasPaymentToken) {
        body.classList.add('eek-has-payment-token');
        console.log('💳 Added eek-has-payment-token class');
    } else {
        body.classList.add('eek-no-payment-token');
        console.log('💳 Added eek-no-payment-token class');
    }
    
    // GCLID classes
    body.classList.toggle('eek-has-gclid', !!EEK_STATE.gclid);
    body.classList.toggle('eek-no-gclid', !EEK_STATE.gclid);
    
    // Phone number type class
    const phoneType = getDisplayPhoneNumber() === EEK_CONFIG.PHONE_NUMBERS.tracking ? 'tracking' : 'default';
    body.classList.toggle('eek-phone-tracking', phoneType === 'tracking');
    body.classList.toggle('eek-phone-default', phoneType === 'default');
    
    console.log('📋 Body state classes updated:', {
        systemActive: EEK_STATE.systemActive,
        duringBusinessHours: EEK_STATE.duringBusinessHours,
        hasPaymentToken: EEK_STATE.hasPaymentToken,
        hasGclid: !!EEK_STATE.gclid,
        phoneType: phoneType
    });
}

// === INITIALIZATION ===
function initializePage() {
    console.log('🚀 Initializing Eek Mobile Mechanical page...');
    
    // Inject critical CSS styles first
    injectMasterStyles();
    
    // CRITICAL: Reset payment state before checking current page
    EEK_STATE.hasPaymentToken = false;
    
    // Initialize tracking pixels
    initializeRedditPixel();
    
    // Detect and update logos (now properly async)
    detectAndUpdateLogo().catch(error => {
        console.error('❌ Error in logo detection:', error);
    });
    
    // Initialize state from current page URL
    EEK_STATE.sessionId = getOrCreateSessionId();
    EEK_STATE.gclid = getGCLID();
    EEK_STATE.hasPaymentToken = hasPaymentToken(); // Check current URL
    
    // Update UI with corrected state management
    updateUIState();
    
    console.log('✅ Page initialization complete');
    console.log('📊 Final State:', {
        sessionId: EEK_STATE.sessionId,
        gclid: EEK_STATE.gclid,
        hasPaymentToken: EEK_STATE.hasPaymentToken,
        phoneNumber: getDisplayPhoneNumber().display
    });
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
window.trackConversion = trackConversion;
window.getLogoForPageType = getLogoForPageType;
window.detectAndUpdateLogo = detectAndUpdateLogo;
window.updateBodyStateClasses = updateBodyStateClasses;
