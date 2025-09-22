/**
 * Eek Mobile Mechanical - Master Configuration & Shared Functions
 * This file contains all shared functionality across the website
 * Include this file on every page to ensure consistency
 */

// === INJECT CRITICAL CSS STYLES ===
function injectMasterStyles() {
    if (document.getElementById('eek-master-styles')) return; // Already injected
    
    const style = document.createElement('style');
    style.id = 'eek-master-styles';
    style.textContent = `
        /* Sticky Call Button */
        .sticky-call {
            position: fixed;
            bottom: 15px;
            right: 15px;
            background-color: #ff5500;
            color: white;
            font-size: 1.1em;
            padding: 14px 20px;
            border-radius: 50px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            text-decoration: none;
            z-index: 999;
            transition: all 0.3s ease;
        }
        
        .sticky-call:hover {
            background-color: #e64a00;
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(0,0,0,0.3);
            color: white;
            text-decoration: none;
        }
        
        .sticky-payment {
            position: fixed;
            bottom: 15px;
            right: 150px;
            background-color: #28a745;
            color: white;
            font-size: 1.1em;
            padding: 14px 20px;
            border-radius: 50px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            text-decoration: none;
            z-index: 999;
            transition: all 0.3s ease;
        }
        
        .sticky-payment:hover {
            background-color: #20a142;
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(0,0,0,0.3);
            color: white;
            text-decoration: none;
        }
        
        /* Business Hours Banner */
        .after-hours-banner {
            background: linear-gradient(135deg, #ff3333, #ff5500);
            color: white;
            padding: 20px;
            margin: 0 auto 20px;
            max-width: 800px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(255,51,51,0.3);
            animation: eek-pulse 2s infinite;
            display: none;
            text-align: center;
        }
        
        @keyframes eek-pulse {
            0%, 100% { box-shadow: 0 4px 12px rgba(255,51,51,0.3); }
            50% { box-shadow: 0 4px 20px rgba(255,51,51,0.5); }
        }
        
        .after-hours-banner h2 {
            margin: 0 0 10px 0;
            font-size: 1.6em;
        }
        
        .after-hours-banner p {
            margin: 10px 0;
            font-size: 1.1em;
        }
        
        /* Mobile responsive */
        @media (max-width: 768px) {
            .sticky-call {
                font-size: 1em;
                padding: 12px 18px;
                bottom: 10px;
                right: 10px;
            }
            
            .sticky-payment {
                font-size: 1em;
                padding: 12px 18px;
                bottom: 10px;
                right: 120px;
            }
        }
    `;
    document.head.appendChild(style);
}

// === REDDIT PIXEL INITIALIZATION ===
function initializeRedditPixel() {
    if (window.rdt) return; // Already initialized
    
    !function(w,d){if(!w.rdt){var p=w.rdt=function(){p.sendEvent?p.sendEvent.apply(p,arguments):p.callQueue.push(arguments)};p.callQueue=[];var t=d.createElement("script");t.src="https://www.redditstatic.com/ads/pixel.js",t.async=!0;var s=d.getElementsByTagName("script")[0];s.parentNode.insertBefore(t,s)}}
    (window,document);
    
    window.rdt('init', 'a2_hf16791nsdhx');
    // Note: PageVisit tracking moved to trackPageView() function to prevent duplicates
    
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

// === TRACKING AND ANALYTICS ===
function buildTrackingPayload(eventType, eventAction, additionalData = {}) {
    return {
        eventType: eventType,
        eventAction: eventAction,
        timestamp: new Date().toISOString(),
        sessionId: EEK_STATE.sessionId,
        gclid: EEK_STATE.gclid,
        
        // Page context
        page: {
            title: document.title,
            url: window.location.href,
            path: window.location.pathname,
            referrer: document.referrer || null
        },
        
        // UTM tracking
        utm: EEK_STATE.utmData,
        
        // Device info
        device: {
            userAgent: navigator.userAgent,
            platform: navigator.platform || null,
            language: navigator.language || null,
            mobile: /Mobi|Android/i.test(navigator.userAgent),
            screen: {
                width: window.screen ? window.screen.width : null,
                height: window.screen ? window.screen.height : null,
                pixelRatio: window.devicePixelRatio || 1
            }
        },
        
        // Source tracking
        source: window.location.pathname.includes('more-options') ? 'more_options_page' : 'main_page',
        formVersion: '2.1',
        
        // Additional data
        ...additionalData
    };
}

async function sendTrackingEvent(payload) {
    try {
        const response = await fetch(EEK_CONFIG.TRACKING_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
            keepalive: true
        });
        
        console.log(`📡 Tracking event sent: ${payload.eventAction} (Status: ${response.status})`);
        return response.ok;
    } catch (error) {
        console.error('❌ Tracking event failed:', error);
        return false;
    }
}

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
    
    // Send to our tracking API
    const payload = buildTrackingPayload('conversion', eventAction, {
        conversionId: conversionId,
        eventValue: eventValue,
        serviceType: serviceType,
        eventCategory: eventCategory
    });
    
    sendTrackingEvent(payload);
}

function trackInteraction(element) {
    const trackingAction = element.dataset.track;
    const linkUrl = element.href;
    const linkText = element.textContent.trim();
    
    if (!trackingAction) {
        console.warn('⚠️ Element missing data-track attribute');
        return;
    }
    
    console.log('👆 Interaction tracked:', trackingAction);
    
    // Build event payload
    const payload = buildTrackingPayload('user_interaction', trackingAction, {
        element: {
            tag: element.tagName.toLowerCase(),
            text: linkText,
            href: linkUrl,
            className: element.className
        },
        interactionType: element.href && element.href.startsWith('tel:') ? 'phone_call' : 'link_click'
    });
    
    // Send tracking event
    sendTrackingEvent(payload);
    
    // If it's a phone call, track as conversion
    if (trackingAction.includes('call') || (element.href && element.href.startsWith('tel:'))) {
        trackConversion(trackingAction, 'Contact');
    }
}

function trackPageView() {
    const firstVisitSent = localStorage.getItem(EEK_CONFIG.STORAGE_KEYS.firstVisitSent);
    const isFirstVisit = !firstVisitSent;
    
    // Single unified event with all tracking data
    const payload = buildTrackingPayload('page_visit', 'page_loaded', {
        pageType: window.location.pathname.includes('more-options') ? 'more_options' : 'main',
        loadTime: Date.now() - performance.navigationStart,
        isFirstVisit: isFirstVisit,
        landingPage: isFirstVisit ? window.location.href : null,
        visitType: isFirstVisit ? 'first_visit' : 'return_visit',
        timestamp: new Date().toISOString()
    });
    
    sendTrackingEvent(payload);
    
    // Mark first visit as sent if this was a first visit
    if (isFirstVisit) {
        localStorage.setItem(EEK_CONFIG.STORAGE_KEYS.firstVisitSent, new Date().toISOString());
        console.log('🆕 First visit data included in unified page visit event');
    }
    
    // Google Analytics page view tracking
    if (typeof gtag !== 'undefined') {
        gtag('event', 'page_view', {
            'page_title': document.title,
            'page_location': window.location.href,
            'gclid': EEK_STATE.gclid
        });
    }
    
    // Reddit Pixel page visit tracking
    if (typeof rdt !== 'undefined') {
        rdt('track', 'PageVisit');
        console.log('📊 Reddit Pixel PageVisit tracked');
    }
}

// Set up scroll tracking
function setupScrollTracking() {
    let scrollTracked = false;
    
    window.addEventListener('scroll', function() {
        if (!scrollTracked && window.scrollY > document.body.scrollHeight * 0.5) {
            scrollTracked = true;
            
            const payload = buildTrackingPayload('user_engagement', 'scroll_50_percent', {
                scrollDepth: '50%',
                pageHeight: document.body.scrollHeight
            });
            
            sendTrackingEvent(payload);
            
            if (typeof gtag !== 'undefined') {
                gtag('event', 'scroll', {
                    'event_category': 'Engagement',
                    'event_label': 'Scrolled 50% of page'
                });
            }
            
            if (typeof rdt !== 'undefined') {
                rdt('track', 'ViewContent', {
                    'customEventName': 'scroll_50_percent',
                    'eventCategory': 'Engagement'
                });
            }
        }
    });
}

// Set up time on page tracking
function setupTimeTracking() {
    const startTime = Date.now();
    
    window.addEventListener('beforeunload', function() {
        const timeOnPage = Date.now() - startTime;
        const payload = buildTrackingPayload('user_engagement', 'time_on_page', {
            timeOnPage: timeOnPage,
            timeOnPageSeconds: Math.round(timeOnPage / 1000)
        });
        
        sendTrackingEvent(payload);
    });
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
    
    // Update debug info if present
    const debugPhoneEl = document.getElementById('debugPhonePreference');
    if (debugPhoneEl) {
        debugPhoneEl.textContent = phoneData === EEK_CONFIG.PHONE_NUMBERS.tracking ? 'tracking' : 'default';
    }
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
    
    // Update global state - check current URL parameters FIRST
    const urlParams = new URLSearchParams(window.location.search);
    EEK_STATE.hasPaymentToken = hasPaymentToken();
    
    // Get current URL GCLID (priority) and stored GCLID (fallback)
    const currentGclid = urlParams.get('gclid');
    EEK_STATE.gclid = getGCLID(); // This now properly handles current URL vs stored
    const effectiveGclid = currentGclid || EEK_STATE.gclid;
    
    console.log('🔍 URL Parameter Check:', {
        currentUrlGclid: currentGclid,
        storedGclid: EEK_STATE.gclid,
        effectiveGclid: effectiveGclid,
        hasPaymentToken: EEK_STATE.hasPaymentToken
    });
    
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
    
    // Update phone numbers FIRST (before other UI elements)
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
    const stripePaymentBlock = document.getElementById('stripePaymentBlock');
    
    // For payment token users, show only the Stripe payment block
    if (EEK_STATE.hasPaymentToken) {
        // Show Stripe payment block for token users
        if (stripePaymentBlock) {
            stripePaymentBlock.style.display = 'block';
            console.log('💳 Showing Stripe payment block for token user');
        }
        
        // Hide closed banner for token users
        if (closedBanner) closedBanner.style.display = 'none';
        
        return;
    }
    
    // Hide Stripe payment block for non-token users
    if (stripePaymentBlock) {
        stripePaymentBlock.style.display = 'none';
    }
    
    // Closed banner logic for non-token users
    if (closedBanner) {
        if (EEK_STATE.gclid) {
            closedBanner.style.display = 'none';
            console.log('🎯 Hiding closed banner (gclid user)');
        } else if (!EEK_STATE.systemActive) {
            closedBanner.style.display = 'block';
            updateClosedBannerContent();
            console.log('🕐 Showing closed banner');
        } else {
            closedBanner.style.display = 'none';
            console.log('✅ Hiding closed banner (system active)');
        }
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
    
    console.log('🔘 Found buttons:', {
        normalButtons: normalButtons.length,
        afterHoursButtons: afterHoursButtons.length,
        showNormal: showNormalButtons,
        showAfterHours: showAfterHoursButtons
    });
    
    normalButtons.forEach((btn, index) => {
        btn.style.display = showNormalButtons ? 'inline-block' : 'none';
        console.log(`  Normal button ${index}: ${showNormalButtons ? 'VISIBLE' : 'HIDDEN'}`);
    });
    
    afterHoursButtons.forEach((btn, index) => {
        btn.style.display = showAfterHoursButtons ? 'inline-block' : 'none';
        console.log(`  After-hours button ${index}: ${showAfterHoursButtons ? 'VISIBLE' : 'HIDDEN'}`);
    });
    
    console.log('🔘 Button update complete - Normal:', showNormalButtons ? 'VISIBLE' : 'HIDDEN', 
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
    const moreOptionsLinks = document.querySelectorAll('.more-options-link, a[href*="more-options"], a[href="/more-options"]');
    moreOptionsLinks.forEach(link => {
        const baseUrl = '/more-options';
        const fullUrl = trackingParams ? `${baseUrl}?${trackingParams}` : baseUrl;
        link.href = fullUrl;
        console.log('🔗 More Options link updated:', fullUrl);
    });
    
    // Update all internal navigation links to preserve tracking
    document.querySelectorAll('a[href^="/"], a[href^="./"], a[href^="../"]').forEach(link => {
        if (link.classList.contains('no-tracking')) return; // Skip if explicitly marked
        
        const currentHref = link.getAttribute('href');
        if (currentHref && !currentHref.includes('?') && trackingParams) {
            link.href = `${currentHref}?${trackingParams}`;
        } else if (currentHref && currentHref.includes('?') && trackingParams) {
            link.href = `${currentHref}&${trackingParams}`;
        }
    });
    
    console.log('🔗 Service links updated with tracking parameters:', trackingParams);
}

function addClickTrackingToElements() {
    // Add tracking to all elements with data-track attributes
    document.querySelectorAll('[data-track]').forEach(element => {
        element.addEventListener('click', function() {
            trackInteraction(this);
        });
    });
    
    // Add tracking to all phone links
    document.querySelectorAll('a[href^="tel:"]').forEach(element => {
        if (!element.dataset.track) {
            element.dataset.track = 'phone_call';
        }
        element.addEventListener('click', function() {
            trackInteraction(this);
        });
    });
}

// === INITIALIZATION ===
function initializePage() {
    console.log('🚀 Initializing Eek Mobile Mechanical page...');
    
    // Inject critical CSS styles first
    injectMasterStyles();
    
    // Create dynamic elements that may not exist on the page
    initializeDynamicElements();
    
    // Initialize tracking pixels
    initializeRedditPixel();
    
    // Initialize state
    EEK_STATE.sessionId = getOrCreateSessionId();
    EEK_STATE.gclid = getGCLID();
    EEK_STATE.utmData = getUTMData();
    EEK_STATE.hasPaymentToken = hasPaymentToken();
    
    // Debug: Check for phone display elements
    const phoneDisplays = document.querySelectorAll('.phone-display');
    const phoneLinks = document.querySelectorAll('.phone-link');
    console.log('🔍 Found phone elements:', {
        phoneDisplays: phoneDisplays.length,
        phoneLinks: phoneLinks.length
    });
    
    phoneDisplays.forEach((el, i) => {
        console.log(`  Phone display ${i}:`, el.textContent, el);
    });
    
    // Update UI
    updateUIState();
    updateServiceLinks();
    
    // Set up tracking
    setupScrollTracking();
    setupTimeTracking();
    addClickTrackingToElements();
    
    // Set up service selection handlers (for main page)
    handleServiceSelection();
    
    trackPageView(); // Single unified event handles both page view AND first visit
    
    // Set up periodic checks
    setInterval(updateUIState, 5 * 60 * 1000); // Every 5 minutes
    
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

// === SERVICE SELECTION HANDLERS ===
function handleServiceSelection() {
    document.querySelectorAll('.service-link').forEach(link => {
        link.addEventListener('click', function(e) {
            const bookingUrl = this.dataset.bookingUrl;
            const service = this.dataset.service;
            
            // Track the service interaction
            if (service) {
                trackInteraction(this);
            }
            
            // Only redirect to booking for service cards (not already direct booking links)
            if (bookingUrl && this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                console.log('🎯 Redirecting to booking page:', bookingUrl);
                window.location.href = bookingUrl;
            }
        });
    });
}

// === DYNAMIC ELEMENT CREATION ===
function createClosedBanner() {
    if (document.getElementById('closedBanner')) return; // Already exists
    
    const banner = document.createElement('div');
    banner.id = 'closedBanner';
    banner.className = 'after-hours-banner';
    banner.style.display = 'none';
    banner.style.background = 'linear-gradient(135deg, #666, #888)';
    
    banner.innerHTML = `
        <h2 id="closedTitle">🕐 CURRENTLY CLOSED</h2>
        <div id="afterHoursMessage">
            <p><strong>Business Hours:</strong></p>
            <p>Monday - Friday: 7:00 AM - 5:00 PM</p>
            <p>Saturday - Sunday: 7:00 AM - 12:00 PM</p>
            <p>Please call during business hours or book online for next available service</p>
        </div>
        <div id="tempUnavailableMessage" style="display: none;">
            <p><strong>We're currently experiencing high demand</strong></p>
            <p>Our mechanics are fully dispatched on emergency calls</p>
            <p>Please book online for the next available appointment or try calling again shortly</p>
            <a href="#service-selection" class="emergency-btn" style="background: rgba(255,255,255,0.25); margin-top: 10px;">📅 Book Online Now</a>
        </div>
    `;
    
    // Insert at top of body
    document.body.insertBefore(banner, document.body.firstChild);
    console.log('📋 Closed banner created dynamically');
}

function createStripePaymentBlock() {
    if (document.getElementById('stripePaymentBlock')) return; // Already exists
    
    const block = document.createElement('section');
    block.id = 'stripePaymentBlock';
    block.style.cssText = 'display: none; background-color: #ffffff; padding: 20px; text-align: center; color: #333; border-bottom: 2px solid #ff5500;';
    
    block.innerHTML = `
        <div style="background-color: #f5f5f5; padding: 30px; border-radius: 12px; max-width: 700px; margin: auto; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
            <h1 style="font-size: 2.2em; margin-bottom: 0.5em;">Secure Roadside Payment</h1>
            <p style="font-size: 1.2em; margin-bottom: 1.5em;">Confirm your payment to get help on the way — fast, safe, and secure.</p>
            <label style="font-size: 1.1em; display: inline-flex; align-items: center; gap: 10px; color: #333;">
                <input type="checkbox" id="termsCheckbox" style="transform: scale(1.5);" />
                <span>I agree to the Eek Mobile Mechanical terms of service 
                    <a href="https://www.eek.nz/terms" target="_blank" style="color: #ff5500; text-decoration: underline;">
                        View terms of use
                    </a>
                </span>
            </label>
            <br><br>
            <button id="payNowButton" style="display: none; background-color: #ff5500; color: white; padding: 14px 32px; font-size: 1.2em; border: none; border-radius: 8px; cursor: pointer;">
                Pay Now
            </button>
        </div>
    `;
    
    // Insert at top of body
    document.body.insertBefore(block, document.body.firstChild);
    console.log('💳 Stripe payment block created dynamically');
}

function createStickyButtons() {
    // Create sticky call button if it doesn't exist
    if (!document.getElementById('stickyCallButton')) {
        const callButton = document.createElement('a');
        callButton.className = 'sticky-call phone-link';
        callButton.href = 'tel:0800769000';
        callButton.id = 'stickyCallButton';
        callButton.setAttribute('data-track', 'sticky_call');
        callButton.innerHTML = '📞 Call <span class="phone-display">Eek Now</span>';
        document.body.appendChild(callButton);
        console.log('📱 Sticky call button created dynamically');
    }
    
    // Create sticky closed button if it doesn't exist
    if (!document.getElementById('stickyClosedButton')) {
        const closedButton = document.createElement('a');
        closedButton.className = 'sticky-call';
        closedButton.href = '#closedBanner';
        closedButton.id = 'stickyClosedButton';
        closedButton.style.cssText = 'display: none; background: #666;';
        closedButton.innerHTML = '🕐 View Hours';
        document.body.appendChild(closedButton);
        console.log('📱 Sticky closed button created dynamically');
    }
    
    // Create sticky payment button if it doesn't exist
    if (!document.getElementById('stripePaymentSticky')) {
        const paymentButton = document.createElement('a');
        paymentButton.className = 'sticky-payment';
        paymentButton.href = '#';
        paymentButton.id = 'stripePaymentSticky';
        paymentButton.style.display = 'none';
        paymentButton.innerHTML = '💳 Make Payment';
        document.body.appendChild(paymentButton);
        console.log('💳 Sticky payment button created dynamically');
    }
}

// === INITIALIZE ALL DYNAMIC ELEMENTS ===
function initializeDynamicElements() {
    console.log('🎬 Creating dynamic elements...');
    createClosedBanner();
    createStripePaymentBlock();
    createStickyButtons();
    console.log('✅ All dynamic elements initialized');
}

// === HELPER FUNCTIONS ===
function getServiceType(eventAction) {
    return EEK_CONFIG.SERVICE_TYPES[eventAction] || 'General Service';
}

// === BACKWARDS COMPATIBILITY WRAPPER ===
// This ensures any existing onclick handlers in HTML still work
window.trackConversionCompat = function(eventAction, eventCategory = 'Contact') {
    // Call the main tracking function that's already defined above
    const conversionId = 'eek_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const eventValue = EEK_CONFIG.SERVICE_VALUES[eventAction] || 25000;
    const serviceType = EEK_CONFIG.SERVICE_TYPES[eventAction] || 'General Service';
    
    console.log('🎯 Conversion tracked (compat):', eventAction, 'Value:', eventValue);
    
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
};

// === EXPORT FOR GLOBAL ACCESS ===
window.EEK_CONFIG = EEK_CONFIG;
window.EEK_STATE = EEK_STATE;
window.updateUIState = updateUIState;
window.updatePhoneNumbers = updatePhoneNumbers;
window.buildTrackingParams = buildTrackingParams;
window.trackConversion = trackConversion;
window.trackConversionCompat = trackConversionCompat;
window.trackInteraction = trackInteraction;
window.handleServiceSelection = handleServiceSelection;
window.getServiceType = getServiceType;
window.initializeDynamicElements = initializeDynamicElements;
window.createClosedBanner = createClosedBanner;
window.createStripePaymentBlock = createStripePaymentBlock;
window.createStickyButtons = createStickyButtons;
