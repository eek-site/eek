/**
 * Eek Mobile Mechanical - Master Configuration & Shared Functions (ENHANCED TRACKING - FIXED)
 * This file contains all shared functionality across the website
 * Include this file on every page to ensure consistency
 * 
 * ENHANCED VERSION: Includes comprehensive location and engagement tracking
 * FIXED VERSION: Resolves duplicate event tracking issues and service selection redirects
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
    link.id = 'eek-style-guide-link';
    
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
        /* Critical fallback styles */
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
        }
        
        /* CRITICAL: Payment Block Visibility Control */
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
        
        /* CRITICAL: Pay Now Button Visibility */
        #payNowButton {
            display: none !important;
        }
        
        #payNowButton.show-button,
        #payNowButton:not(.eek-hidden) {
            display: inline-block !important;
        }
        
        #payNowButton.eek-hidden {
            display: none !important;
        }
        
        .eek-payment-block.eek-hidden,
        .sticky-payment.eek-hidden,
        .eek-hidden {
            display: none !important;
        }
        
        /* Sticky buttons */
        .sticky-call, .eek-sticky-button {
            position: fixed;
            bottom: 15px;
            right: 15px;
            background-color: var(--eek-primary);
            color: white;
            font-size: 1.1em;
            padding: 14px 20px;
            border-radius: var(--eek-radius-full);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            text-decoration: none;
            z-index: 999;
            transition: all 0.3s ease;
        }
        
        .sticky-call:hover, .eek-sticky-button:hover {
            background-color: var(--eek-primary-hover);
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(0,0,0,0.3);
            color: white;
            text-decoration: none;
        }
        
        .sticky-payment, .eek-sticky-payment {
            position: fixed;
            bottom: 15px;
            right: 150px;
            background-color: var(--eek-success);
            color: white;
            font-size: 1.1em;
            padding: 14px 20px;
            border-radius: var(--eek-radius-full);
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            text-decoration: none;
            z-index: 999;
            transition: all 0.3s ease;
        }
        
        .sticky-payment:hover, .eek-sticky-payment:hover {
            background-color: var(--eek-success-hover);
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(0,0,0,0.3);
            color: white;
            text-decoration: none;
        }
        
        /* Business Hours Banner */
        .after-hours-banner, .eek-banner {
            background: linear-gradient(135deg, #ff3333, #ff5500);
            color: white;
            padding: 20px;
            margin: 0 auto 20px;
            max-width: 800px;
            border-radius: var(--eek-radius-lg);
            box-shadow: 0 4px 12px rgba(255,51,51,0.3);
            animation: eek-pulse 2s infinite;
            display: none;
            text-align: center;
        }
        
        @keyframes eek-pulse {
            0%, 100% { box-shadow: 0 4px 12px rgba(255,51,51,0.3); }
            50% { box-shadow: 0 4px 20px rgba(255,51,51,0.5); }
        }
        
        /* STATE-BASED VISIBILITY CONTROLS */
        body.eek-system-inactive .after-hours-btn,
        body.eek-system-inactive .eek-emergency-btn.after-hours-btn,
        body.eek-system-inactive .eek-contact-btn.after-hours-btn {
            display: inline-block !important;
        }
        
        body.eek-system-inactive .normal-hours-btn,
        body.eek-system-inactive .eek-emergency-btn.normal-hours-btn,
        body.eek-system-inactive .eek-contact-btn.normal-hours-btn {
            display: none !important;
        }
        
        body.eek-has-payment-token .sticky-call,
        body.eek-has-payment-token #stickyCallButton {
            display: none !important;
        }
        
        body.eek-has-payment-token .sticky-payment,
        body.eek-has-payment-token #stripePaymentSticky {
            display: block !important;
            background-color: #28a745 !important;
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
        'legal_terms': 1000,
        'legal_supplier_terms': 1000,
        'legal_privacy': 1000,
        'legal_privacy_report': 2000,
        'legal_authority': 1000,
        'footer_home': 500,
        'footer_privacy': 500,
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
        'supplier_portal': 'Supplier Portal',
        'supplier_relations': 'Supplier Relations',
        'employment_apply': 'Employment Application',
        'utility_maps': 'Utility Tool',
        'legal_terms': 'Legal Document',
        'legal_supplier_terms': 'Legal Document',
        'legal_privacy': 'Legal Document',
        'legal_privacy_report': 'Privacy Report',
        'legal_authority': 'Legal Authority',
        'footer_home': 'Navigation',
        'footer_privacy': 'Navigation',
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
    currentUrlGclid: null,        // FIXED: Only current URL GCLID
    storedGclidForTracking: null, // FIXED: Stored GCLID for analytics only
    utmData: {},
    hasPaymentToken: false,
    systemActive: true,
    duringBusinessHours: false
};

// === ENGAGEMENT TRACKING GLOBALS ===
let focusTime = 0;
let lastFocusTime = Date.now();
let isPageFocused = true;
let clickCount = 0;
let firstInteractionTime = null;
let sessionCount = parseInt(localStorage.getItem('eek_session_count') || '1');

// === FIXED: EVENT DEDUPLICATION ===
let recentEvents = new Map();
let eventSequence = 0;

function isDuplicateEvent(eventAction, timeWindow = 5000) {
    const now = Date.now();
    const lastTime = recentEvents.get(eventAction);
    
    if (lastTime && (now - lastTime) < timeWindow) {
        console.log('🚫 Skipping duplicate event:', eventAction, 'within', timeWindow, 'ms');
        return true;
    }
    
    recentEvents.set(eventAction, now);
    return false;
}

// Set up engagement event listeners
window.addEventListener('focus', () => {
    isPageFocused = true;
    lastFocusTime = Date.now();
});

window.addEventListener('blur', () => {
    if (isPageFocused) {
        focusTime += Date.now() - lastFocusTime;
        isPageFocused = false;
    }
});

window.addEventListener('click', () => {
    clickCount++;
    if (!firstInteractionTime) {
        firstInteractionTime = Date.now();
    }
});

// === ENHANCED HELPER FUNCTIONS ===
function getTimezone() {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
    } catch (e) {
        return null;
    }
}

function getTimezoneAbbreviation() {
    try {
        const date = new Date();
        const shortFormat = date.toLocaleTimeString('en', {timeZoneName: 'short'});
        return shortFormat.split(' ').pop() || null;
    } catch (e) {
        return null;
    }
}

function getLocale() {
    try {
        return Intl.DateTimeFormat().resolvedOptions().locale || navigator.language || null;
    } catch (e) {
        return navigator.language || null;
    }
}

function getCurrencyFromLocale() {
    try {
        const locale = getLocale();
        if (!locale) return null;
        
        // Common currency mappings
        const currencyMap = {
            'en-NZ': 'NZD',
            'en-AU': 'AUD', 
            'en-US': 'USD',
            'en-GB': 'GBP',
            'en-CA': 'CAD'
        };
        
        return currencyMap[locale] || null;
    } catch (e) {
        return null;
    }
}

function getConnectionType() {
    try {
        return navigator.connection ? navigator.connection.effectiveType : null;
    } catch (e) {
        return null;
    }
}

function getISPHints() {
    try {
        const connection = navigator.connection;
        if (connection && connection.effectiveType) {
            return {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt
            };
        }
        return null;
    } catch (e) {
        return null;
    }
}

function getTimeFormat() {
    try {
        const testTime = new Date('2023-01-01 13:00:00');
        const formatted = testTime.toLocaleTimeString();
        return formatted.includes('PM') ? '12-hour' : '24-hour';
    } catch (e) {
        return null;
    }
}

function getReferrerDomain() {
    try {
        if (!document.referrer) return null;
        return new URL(document.referrer).hostname;
    } catch (e) {
        return null;
    }
}

function extractGeoFromCampaign() {
    const urlParams = new URLSearchParams(window.location.search);
    const campaign = urlParams.get('utm_campaign') || '';
    const term = urlParams.get('utm_term') || '';
    const content = urlParams.get('utm_content') || '';
    
    // Look for geographic indicators in campaign data
    const geoKeywords = ['auckland', 'wellington', 'christchurch', 'hamilton', 'tauranga', 'dunedin', 'palmerston', 'hastings', 'rotorua', 'whangarei', 'new-zealand', 'nz', 'north-island', 'south-island'];
    
    const allCampaignText = (campaign + ' ' + term + ' ' + content).toLowerCase();
    const foundGeo = geoKeywords.filter(keyword => allCampaignText.includes(keyword));
    
    return foundGeo.length > 0 ? foundGeo : null;
}

function getScreenInfo() {
    try {
        return {
            width: window.screen ? window.screen.width : null,
            height: window.screen ? window.screen.height : null,
            resolution: window.screen ? `${window.screen.width}x${window.screen.height}` : null,
            colorDepth: window.screen ? window.screen.colorDepth : null,
            pixelRatio: window.devicePixelRatio || 1
        };
    } catch (e) {
        return null;
    }
}

function getDeviceOrientation() {
    try {
        if (window.screen && window.screen.orientation) {
            return {
                angle: window.screen.orientation.angle,
                type: window.screen.orientation.type
            };
        }
        return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    } catch (e) {
        return null;
    }
}

function getDeviceType() {
    const ua = navigator.userAgent || '';
    
    if (/tablet|ipad/i.test(ua)) return 'tablet';
    if (/mobile|phone|android/i.test(ua)) return 'mobile';
    return 'desktop';
}

function getOperatingSystem() {
    const ua = navigator.userAgent || '';
    
    if (/windows/i.test(ua)) return 'Windows';
    if (/macintosh|mac os x/i.test(ua)) return 'macOS';
    if (/linux/i.test(ua)) return 'Linux';
    if (/android/i.test(ua)) return 'Android';
    if (/iphone|ipad|ipod/i.test(ua)) return 'iOS';
    
    return 'Unknown';
}

function getBrowserInfo() {
    const ua = navigator.userAgent || '';
    
    if (/chrome/i.test(ua) && !/edge/i.test(ua)) return 'Chrome';
    if (/firefox/i.test(ua)) return 'Firefox';
    if (/safari/i.test(ua) && !/chrome/i.test(ua)) return 'Safari';
    if (/edge/i.test(ua)) return 'Edge';
    if (/opera/i.test(ua)) return 'Opera';
    
    return 'Unknown';
}

function getScreenOrientation() {
    try {
        if (window.screen && window.screen.orientation) {
            return window.screen.orientation.angle;
        }
        return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
    } catch (e) {
        return null;
    }
}

function checkJavaEnabled() {
    try {
        return navigator.javaEnabled ? navigator.javaEnabled() : false;
    } catch (e) {
        return false;
    }
}

function checkWebGLSupport() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        return !!gl;
    } catch (e) {
        return false;
    }
}

function isLocalBusinessHours() {
    // Check if user's local time aligns with typical business hours
    const now = new Date();
    const hour = now.getHours();
    return hour >= 8 && hour <= 17; // 8 AM to 5 PM local time
}

function getFirstContentfulPaint() {
    try {
        const entries = performance.getEntriesByType('paint');
        const fcp = entries.find(entry => entry.name === 'first-contentful-paint');
        return fcp ? fcp.startTime : null;
    } catch (e) {
        return null;
    }
}

function getLargestContentfulPaint() {
    try {
        const entries = performance.getEntriesByType('largest-contentful-paint');
        return entries.length > 0 ? entries[entries.length - 1].startTime : null;
    } catch (e) {
        return null;
    }
}

function getConnectionSpeed() {
    try {
        return navigator.connection ? navigator.connection.downlink : null;
    } catch (e) {
        return null;
    }
}

function getFocusTime() {
    if (isPageFocused) {
        return focusTime + (Date.now() - lastFocusTime);
    }
    return focusTime;
}

function getClickCount() {
    return clickCount;
}

function getTimeToFirstInteraction() {
    return firstInteractionTime ? firstInteractionTime - getPageStartTime() : null;
}

function getScrollPercentage() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const docHeight = Math.max(document.body.scrollHeight || 0, document.documentElement.scrollHeight || 0);
    const winHeight = window.innerHeight;
    const scrollPercent = (scrollTop / (docHeight - winHeight)) * 100;
    return Math.min(Math.max(scrollPercent, 0), 100);
}

function getBounceCandidate() {
    const timeOnPage = Date.now() - getPageStartTime();
    const hasInteracted = clickCount > 0 || getScrollPercentage() > 25;
    return timeOnPage < 30000 && !hasInteracted; // Less than 30 seconds and no interaction
}

function getEngagementScore() {
    const timeOnPage = Date.now() - getPageStartTime();
    const focusRatio = getFocusTime() / timeOnPage;
    const scrollPercentage = getScrollPercentage();
    const interactions = clickCount;
    
    // Simple engagement score (0-100)
    let score = 0;
    score += Math.min(timeOnPage / 1000, 60); // Up to 60 points for time (max 60 seconds)
    score += focusRatio * 20; // Up to 20 points for focus ratio
    score += Math.min(scrollPercentage / 4, 15); // Up to 15 points for scrolling
    score += Math.min(interactions * 2, 10); // Up to 10 points for interactions
    
    return Math.round(Math.min(score, 100));
}

function getSessionCount() {
    return sessionCount;
}

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

// === ENHANCED TRACKING PAYLOAD BUILDER ===
function buildTrackingPayload(eventType, eventAction, additionalData = {}) {
    const urlParams = new URLSearchParams(window.location.search);
    const now = new Date();
    
    // Increment event sequence
    eventSequence++;
    
    return {
        eventType: eventType,
        eventAction: eventAction,
        eventSequence: eventSequence,
        timestamp: now.toISOString(),
        
        // Session & Identity Data
        sessionId: EEK_STATE.sessionId,
        gclid: EEK_STATE.storedGclidForTracking, // Use stored GCLID for tracking
        hasCurrentGclid: !!urlParams.get('gclid'),
        hasCurrentToken: !!urlParams.get('token'),
        hasStoredGclid: !!EEK_STATE.storedGclidForTracking,
        gclidAge: getGCLIDAgeInDays(),
        phoneNumberType: getDisplayPhoneNumber() === EEK_CONFIG.PHONE_NUMBERS.tracking ? 'tracking' : 'default',
        
        // Enhanced Location Data (Non-Intrusive)
        location: {
            // Timezone-based location indicators
            timezone: getTimezone(),
            timezoneOffset: new Date().getTimezoneOffset(),
            timezoneAbbr: getTimezoneAbbreviation(),
            
            // Locale-based location indicators  
            locale: getLocale(),
            language: navigator.language || null,
            languages: navigator.languages || [],
            currency: getCurrencyFromLocale(),
            
            // Network-based location hints
            connectionType: getConnectionType(),
            isp: getISPHints(),
            
            // Time-based location indicators
            localTime: now.toLocaleString(),
            localTimeFormat: getTimeFormat(),
            weekday: now.toLocaleDateString(undefined, {weekday: 'long'}),
            
            // URL-based location hints
            referrerDomain: getReferrerDomain(),
            campaignGeo: extractGeoFromCampaign(),
            
            // Screen/device location indicators
            screenResolution: getScreenInfo(),
            deviceOrientation: getDeviceOrientation()
        },
        
        // Page Context (Enhanced)
        page: {
            title: document.title || '',
            url: window.location.href || '',
            path: window.location.pathname || '',
            hash: window.location.hash || '',
            search: window.location.search || '',
            referrer: document.referrer || null,
            domain: window.location.hostname || '',
            protocol: window.location.protocol || '',
            
            viewport: {
                width: window.innerWidth || document.documentElement.clientWidth,
                height: window.innerHeight || document.documentElement.clientHeight
            },
            
            scroll: {
                x: window.pageXOffset || document.documentElement.scrollLeft,
                y: window.pageYOffset || document.documentElement.scrollTop,
                maxX: Math.max(document.body.scrollWidth || 0, document.documentElement.scrollWidth || 0),
                maxY: Math.max(document.body.scrollHeight || 0, document.documentElement.scrollHeight || 0)
            },
            
            // Page engagement indicators
            timeOnPage: Date.now() - getPageStartTime(),
            focusTime: getFocusTime(),
            scrollPercentage: getScrollPercentage(),
            clickCount: getClickCount()
        },
        
        // Business Context
        business: {
            systemActive: EEK_STATE.systemActive,
            duringBusinessHours: EEK_STATE.duringBusinessHours,
            nzTime: new Date().toLocaleString("en-US", {timeZone: "Pacific/Auckland"}),
            dayOfWeek: now.getDay(), // 0=Sunday, 6=Saturday
            hourOfDay: now.getHours(),
            isWeekend: (now.getDay() === 0 || now.getDay() === 6),
            localBusinessHours: isLocalBusinessHours()
        },
        
        // UTM & Marketing Data (Enhanced)
        utm: {
            ...EEK_STATE.utmData,
            // Add any missing UTM from current URL
            utm_source: urlParams.get('utm_source') || EEK_STATE.utmData.utm_source || null,
            utm_medium: urlParams.get('utm_medium') || EEK_STATE.utmData.utm_medium || null,
            utm_campaign: urlParams.get('utm_campaign') || EEK_STATE.utmData.utm_campaign || null,
            utm_term: urlParams.get('utm_term') || EEK_STATE.utmData.utm_term || null,
            utm_content: urlParams.get('utm_content') || EEK_STATE.utmData.utm_content || null,
            
            // Additional marketing parameters
            fbclid: urlParams.get('fbclid') || null,
            msclkid: urlParams.get('msclkid') || null,
            ttclid: urlParams.get('ttclid') || null,
            gad_source: urlParams.get('gad_source') || null,
            campaignid: urlParams.get('campaignid') || null,
            adgroupid: urlParams.get('adgroupid') || null,
            keyword: urlParams.get('keyword') || null
        },
        
        // Device & Browser Info (Maximum Detail)
        device: {
            userAgent: navigator.userAgent || '',
            platform: navigator.platform || null,
            language: navigator.language || null,
            languages: navigator.languages || [],
            mobile: /Mobi|Android/i.test(navigator.userAgent),
            deviceType: getDeviceType(),
            operatingSystem: getOperatingSystem(),
            browser: getBrowserInfo(),
            cookieEnabled: navigator.cookieEnabled,
            doNotTrack: navigator.doNotTrack || null,
            hardwareConcurrency: navigator.hardwareConcurrency || null,
            maxTouchPoints: navigator.maxTouchPoints || 0,
            deviceMemory: navigator.deviceMemory || null,
            onLine: navigator.onLine,
            vendor: navigator.vendor || null,
            vendorSub: navigator.vendorSub || null,
            
            // Capabilities
            touchscreen: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
            webgl: checkWebGLSupport(),
            javaEnabled: checkJavaEnabled(),
            
            screen: {
                width: window.screen ? window.screen.width : null,
                height: window.screen ? window.screen.height : null,
                availWidth: window.screen ? window.screen.availWidth : null,
                availHeight: window.screen ? window.screen.availHeight : null,
                colorDepth: window.screen ? window.screen.colorDepth : null,
                pixelDepth: window.screen ? window.screen.pixelDepth : null,
                pixelRatio: window.devicePixelRatio || 1,
                orientation: getScreenOrientation()
            }
        },
        
        // Performance Data (Enhanced)
        performance: {
            navigationStart: performance.navigationStart || null,
            loadEventEnd: performance.loadEventEnd || null,
            domContentLoadedEventEnd: performance.domContentLoadedEventEnd || null,
            responseEnd: performance.responseEnd || null,
            domainLookupStart: performance.domainLookupStart || null,
            domainLookupEnd: performance.domainLookupEnd || null,
            connectStart: performance.connectStart || null,
            connectEnd: performance.connectEnd || null,
            requestStart: performance.requestStart || null,
            responseStart: performance.responseStart || null,
            domLoading: performance.domLoading || null,
            domInteractive: performance.domInteractive || null,
            domComplete: performance.domComplete || null,
            loadEventStart: performance.loadEventStart || null,
            firstContentfulPaint: getFirstContentfulPaint(),
            largestContentfulPaint: getLargestContentfulPaint(),
            connectionSpeed: getConnectionSpeed(),
            timing: performance.timing ? {
                dns: performance.timing.domainLookupEnd - performance.timing.domainLookupStart,
                connection: performance.timing.connectEnd - performance.timing.connectStart,
                response: performance.timing.responseEnd - performance.timing.responseStart,
                domProcessing: performance.timing.domComplete - performance.timing.domLoading,
                totalLoad: performance.timing.loadEventEnd - performance.timing.navigationStart
            } : null
        },
        
        // Connection Info
        connection: navigator.connection ? {
            effectiveType: navigator.connection.effectiveType || null,
            type: navigator.connection.type || null,
            downlink: navigator.connection.downlink || null,
            rtt: navigator.connection.rtt || null,
            saveData: navigator.connection.saveData || false
        } : null,
        
        // Storage & Privacy
        storage: {
            localStorageAvailable: isLocalStorageAvailable(),
            sessionStorageAvailable: isSessionStorageAvailable(),
            cookiesEnabled: navigator.cookieEnabled,
            thirdPartyCookiesBlocked: testThirdPartyCookies()
        },
        
        // Source & Attribution
        source: window.location.pathname.includes('more-options') ? 'more_options_page' : 'main_page',
        formVersion: '2.1',
        
        // Visit Context
        visit: {
            isFirstVisit: !localStorage.getItem(EEK_CONFIG.STORAGE_KEYS.firstVisitSent),
            sessionDuration: Date.now() - getSessionStartTime(),
            pageLoadTime: Date.now() - performance.navigationStart,
            timeOnCurrentPage: Date.now() - getPageStartTime(),
            previousPage: getPreviousPage(),
            visitCount: getVisitCount(),
            pageViewCount: getPageViewCount()
        },
        
        // User behavior indicators
        behavior: {
            visitCount: getVisitCount(),
            sessionCount: getSessionCount(),
            pageViewCount: getPageViewCount(),
            timeToFirstInteraction: getTimeToFirstInteraction(),
            bounceCandidate: getBounceCandidate(),
            engagementScore: getEngagementScore()
        },
        
        // Feature Detection
        features: {
            webgl: !!window.WebGLRenderingContext,
            webgl2: !!window.WebGL2RenderingContext,
            canvas: !!document.createElement('canvas').getContext,
            localStorage: isLocalStorageAvailable(),
            sessionStorage: isSessionStorageAvailable(),
            geolocation: !!navigator.geolocation,
            touchscreen: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
            serviceWorker: 'serviceWorker' in navigator,
            pushNotifications: 'PushManager' in window,
            webAssembly: typeof WebAssembly === 'object'
        },
        
        // Additional data
        ...additionalData
    };
}

// === FIXED: SEND TRACKING EVENT TO API ===
async function sendTrackingEvent(payload) {
    // FIXED: Check for duplicate events before sending
    if (isDuplicateEvent(payload.eventAction)) {
        return false;
    }
    
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

// === ENHANCED CONVERSION TRACKING ===
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
            'gclid': EEK_STATE.storedGclidForTracking // Use stored GCLID for tracking
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
            'gclid': EEK_STATE.storedGclidForTracking // Use stored GCLID for tracking
        });
    }
    
    // Send to our tracking API with enhanced conversion data
    const payload = buildTrackingPayload('conversion', eventAction, {
        conversionId: conversionId,
        eventValue: eventValue,
        eventValueDollars: eventValue / 100,
        serviceType: serviceType,
        eventCategory: eventCategory,
        currency: 'NZD',
        
        // Conversion context
        conversionContext: {
            timeToConversion: Date.now() - getPageStartTime(),
            sessionTimeToConversion: Date.now() - getSessionStartTime(),
            pageScrollPosition: window.pageYOffset || document.documentElement.scrollTop,
            pageScrollPercentage: Math.round(((window.pageYOffset || document.documentElement.scrollTop) / 
                Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)) * 100),
            clickedFromSection: getClickedSection(),
            visibleElements: getVisibleElements()
        },
        
        // Attribution data
        attribution: {
            firstTouch: getFirstTouchAttribution(),
            lastTouch: getLastTouchAttribution(),
            touchpointCount: getTouchpointCount(),
            daysSinceFirstVisit: getDaysSinceFirstVisit(),
            sessionsSinceFirstVisit: getSessionsSinceFirstVisit()
        },
        
        // Conversion funnel data
        funnel: {
            landingPage: getFirstVisitPage(),
            pagesVisitedThisSession: getPagesVisitedThisSession(),
            totalPageViews: getPageViewCount(),
            bounceCandidate: getPageViewCount() === 1,
            timeOnSite: Date.now() - getSessionStartTime(),
            interactionsBeforeConversion: getInteractionCount()
        }
    });
    
    sendTrackingEvent(payload);
}

// === FIXED: USER INTERACTION TRACKING ===
function trackInteraction(element) {
    const trackingAction = element.dataset.track;
    const linkUrl = element.href;
    const linkText = element.textContent.trim();
    
    if (!trackingAction) {
        console.warn('⚠️ Element missing data-track attribute');
        return;
    }
    
    console.log('👆 Interaction tracked:', trackingAction);
    
    // Increment interaction count
    incrementInteractionCount();
    
    // Build event payload with enhanced interaction data
    const payload = buildTrackingPayload('user_interaction', trackingAction, {
        element: {
            tag: element.tagName.toLowerCase(),
            text: linkText,
            href: linkUrl,
            className: element.className,
            id: element.id || null,
            dataset: element.dataset || {}
        },
        interactionType: element.href && element.href.startsWith('tel:') ? 'phone_call' : 'link_click',
        
        // Interaction context
        interactionContext: {
            clickPosition: getClickPosition(element),
            elementVisible: isElementVisible(element),
            timeOnPageBeforeClick: Date.now() - getPageStartTime(),
            interactionSequence: getInteractionCount(),
            scrollPositionAtClick: window.pageYOffset || document.documentElement.scrollTop
        }
    });
    
    // Send tracking event
    sendTrackingEvent(payload);
    
    // If it's a phone call, track as conversion
    if (trackingAction.includes('call') || (element.href && element.href.startsWith('tel:'))) {
        trackConversion(trackingAction, 'Contact');
    }
}

// === PAGE VIEW TRACKING ===
function trackPageView() {
    // Update previous page tracking
    localStorage.setItem('eek_previous_page', window.location.href);
    
    const firstVisitSent = localStorage.getItem(EEK_CONFIG.STORAGE_KEYS.firstVisitSent);
    const isFirstVisit = !firstVisitSent;
    
    // Single unified event with all tracking data
    const payload = buildTrackingPayload('page_visit', 'page_loaded', {
        pageType: window.location.pathname.includes('more-options') ? 'more_options' : 'main',
        loadTime: Date.now() - performance.navigationStart,
        isFirstVisit: isFirstVisit,
        landingPage: isFirstVisit ? window.location.href : null,
        visitType: isFirstVisit ? 'first_visit' : 'return_visit',
        timestamp: new Date().toISOString(),
        
        // Enhanced page-specific data
        pageSpecific: {
            hasServiceSelection: !!document.querySelector('#service-selection'),
            hasPaymentBlock: !!document.getElementById('stripePaymentBlock'),
            hasClosedBanner: !!document.getElementById('closedBanner'),
            phoneLinksCount: document.querySelectorAll('.phone-link').length,
            serviceLinksCount: document.querySelectorAll('.service-link').length,
            logoType: getLogoForPageType().type,
            elementsWithTracking: document.querySelectorAll('[data-track]').length
        }
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
            'gclid': EEK_STATE.storedGclidForTracking // Use stored GCLID for tracking
        });
    }
    
    // Reddit Pixel page visit tracking
    if (typeof rdt !== 'undefined') {
        rdt('track', 'PageVisit');
        console.log('📊 Reddit Pixel PageVisit tracked');
    }
}

// === FIXED: AUTOMATIC EVENT TRACKING ===
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

// === FIXED: TIME TRACKING WITH MINIMUM THRESHOLD ===
function setupTimeTracking() {
    const startTime = Date.now();
    
    window.addEventListener('beforeunload', function() {
        const timeOnPage = Date.now() - startTime;
        
        // FIXED: Only send if user was on page for at least 10 seconds
        if (timeOnPage > 10000) {
            const payload = buildTrackingPayload('user_engagement', 'time_on_page', {
                timeOnPage: timeOnPage,
                timeOnPageSeconds: Math.round(timeOnPage / 1000)
            });
            
            sendTrackingEvent(payload);
        }
    });
}

// === PHONE NUMBER MANAGEMENT (COMPLETELY FIXED) ===
function getDisplayPhoneNumber() {
    // CRITICAL FIX: ONLY check current URL parameters
    // NEVER reference stored GCLID data for phone number decisions
    const urlParams = new URLSearchParams(window.location.search);
    const currentGclid = urlParams.get('gclid');
    const currentToken = urlParams.get('token');
    
    if (currentGclid) {
        console.log('📞 Using tracking number (current URL GCLID):', currentGclid);
        return EEK_CONFIG.PHONE_NUMBERS.tracking;
    }
    
    if (currentToken) {
        console.log('📞 Using tracking number (current payment token):', currentToken);
        return EEK_CONFIG.PHONE_NUMBERS.tracking;
    }
    
    // DEFAULT for all other cases - including visitors with stored GCLID data
    console.log('📞 Using default number (no current GCLID or token)');
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

// === GCLID MANAGEMENT (FIXED - SEPARATE TRACKING FROM DISPLAY) ===
function isGCLIDValid() {
    const storedTimestamp = localStorage.getItem(EEK_CONFIG.STORAGE_KEYS.gclidTimestamp);
    if (!storedTimestamp) return false;
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return new Date(storedTimestamp) > thirtyDaysAgo;
}

// FIXED: Returns current URL GCLID only
function getCurrentURLGCLID() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('gclid');
}

// FIXED: Returns stored GCLID for tracking purposes only
function getStoredGCLIDForTracking() {
    const urlParams = new URLSearchParams(window.location.search);
    let gclidValue = urlParams.get('gclid');
    
    // PRIORITY 1: If GCLID in current URL, use it and store it
    if (gclidValue) {
        localStorage.setItem(EEK_CONFIG.STORAGE_KEYS.gclid, gclidValue);
        localStorage.setItem(EEK_CONFIG.STORAGE_KEYS.gclidTimestamp, new Date().toISOString());
        console.log('✅ GCLID captured from current URL for tracking:', gclidValue);
        return gclidValue;
    }
    
    // PRIORITY 2: Try to get stored GCLID (only if still valid) - FOR TRACKING DATA ONLY
    const storedGclid = localStorage.getItem(EEK_CONFIG.STORAGE_KEYS.gclid);
    
    if (storedGclid && isGCLIDValid()) {
        console.log('📋 Using stored valid GCLID for tracking data only:', storedGclid);
        return storedGclid;
    } else if (storedGclid) {
        // GCLID expired - clean it up
        localStorage.removeItem(EEK_CONFIG.STORAGE_KEYS.gclid);
        localStorage.removeItem(EEK_CONFIG.STORAGE_KEYS.gclidTimestamp);
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
        console.log('🔄 Checking system status via API...');
        console.log('📡 API URL:', EEK_CONFIG.SYSTEM_STATUS_API_URL);
        
        const response = await fetch(EEK_CONFIG.SYSTEM_STATUS_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({}),
            cache: "no-store"
        });
        
        console.log('📡 API Response status:', response.status, response.statusText);
        
        if (response.ok) {
            const data = await response.json();
            console.log('📡 API Response data:', data);
            
            const isActive = data.state === 'Active';
            console.log('✅ System status parsed:', isActive ? 'ACTIVE' : 'INACTIVE', '(Raw state:', data.state, ')');
            return isActive;
        } else {
            console.warn('⚠️ System status API returned non-OK status:', response.status, response.statusText);
            console.warn('⚠️ Response text:', await response.text().catch(e => 'Could not read response text'));
        }
    } catch (error) {
        console.error('❌ Error checking system status:', error.message);
        console.error('❌ Full error:', error);
    }
    
    // Default to active if check fails
    console.log('🔄 Defaulting to ACTIVE due to API failure');
    return true;
}

// === UI UPDATE FUNCTION (FIXED) ===
async function updateUIState() {
    console.log('🔄 Starting master UI state update...');
    
    // CRITICAL FIX: Reset state and separate tracking from display logic
    EEK_STATE.hasPaymentToken = false;
    EEK_STATE.currentUrlGclid = null;
    EEK_STATE.storedGclidForTracking = null;
    
    const urlParams = new URLSearchParams(window.location.search);
    const currentGclid = urlParams.get('gclid');
    const currentToken = urlParams.get('token');
    
    // FIXED: Separate current URL data from stored tracking data
    EEK_STATE.currentUrlGclid = currentGclid;                    // For display decisions
    EEK_STATE.storedGclidForTracking = getStoredGCLIDForTracking(); // For tracking only
    EEK_STATE.hasPaymentToken = hasPaymentToken();
    
    console.log('🔍 FIXED State Check:', {
        currentUrlGclid: EEK_STATE.currentUrlGclid,
        currentUrlToken: currentToken,
        storedGclidForTracking: EEK_STATE.storedGclidForTracking,
        hasPaymentToken: EEK_STATE.hasPaymentToken
    });
    
    // System status logic - Current URL GCLID or Token users always get active system
    if (currentGclid || currentToken) {
        EEK_STATE.systemActive = true;
        console.log('🎯 Current URL GCLID or Token detected - forcing system active');
    } else {
        EEK_STATE.systemActive = await checkSystemStatus();
        console.log('🔄 Basic mode - using API system status');
    }
    
    // Still track business hours for banner text, but don't use for logic
    EEK_STATE.duringBusinessHours = isWithinBusinessHours();
    
    console.log('📊 FIXED Master State:', {
        systemActive: EEK_STATE.systemActive,
        duringBusinessHours: EEK_STATE.duringBusinessHours,
        hasPaymentToken: EEK_STATE.hasPaymentToken,
        hasCurrentGclid: !!currentGclid,
        hasCurrentToken: !!currentToken,
        hasStoredGclidForTracking: !!EEK_STATE.storedGclidForTracking
    });
    
    // CRITICAL: Update body classes first to ensure CSS state is correct
    updateBodyStateClasses();
    
    // Update UI elements based on state
    updateBannerVisibility();
    updateButtonVisibility();
    
    // Update phone numbers (now completely isolated from stored GCLID)
    updatePhoneNumbers();
    
    console.log('✅ FIXED Master UI state update completed');
}

// === BANNER VISIBILITY MANAGEMENT ===
function updateBannerVisibility() {
    const banner = document.getElementById('closedBanner');
    const closedTitle = document.getElementById('closedTitle');
    
    if (!banner) {
        console.log('⚠️ No closedBanner element found');
        return;
    }
    
    // FIXED: Use current URL parameters only (not stored state)
    const urlParams = new URLSearchParams(window.location.search);
    const hasGclid = !!urlParams.get('gclid');
    const hasToken = !!urlParams.get('token');
    
    console.log('🏷️ Banner visibility check:', {
        hasGclid: hasGclid,
        hasToken: hasToken,
        systemActive: EEK_STATE.systemActive,
        duringBusinessHours: EEK_STATE.duringBusinessHours
    });
    
    if (hasGclid || hasToken) {
        // GCLID or Token mode: NEVER show banner
        banner.style.display = 'none';
        banner.style.visibility = 'hidden';
        console.log('🏷️ Hiding banner (GCLID or Token mode)');
        return;
    }
    
    if (!EEK_STATE.systemActive) {
        // Basic mode + system inactive: ALWAYS show banner
        banner.style.display = 'block';
        banner.style.visibility = 'visible';
        banner.removeAttribute('hidden');
        
        // Update banner text based on business hours
        if (closedTitle) {
            if (EEK_STATE.duringBusinessHours) {
                closedTitle.textContent = '📞 WE ARE ON CALLS';
            } else {
                closedTitle.textContent = '🕐 CURRENTLY CLOSED';
            }
        }
        console.log('🏷️ SHOWING banner (Basic mode + system inactive):', EEK_STATE.duringBusinessHours ? 'ON CALLS' : 'CLOSED');
    } else {
        // Basic mode + system active: hide banner
        banner.style.display = 'none';
        banner.style.visibility = 'hidden';
        console.log('🏷️ Hiding banner (Basic mode + system active)');
    }
}

// === BUTTON VISIBILITY MANAGEMENT (FIXED - NO BOOKING URLS FOR SERVICE CARDS) ===
function updateButtonVisibility() {
    const callButton = document.getElementById('stickyCallButton');
    const closedButton = document.getElementById('stickyClosedButton');
    const paymentButton = document.getElementById('stripePaymentSticky');
    
    // FIXED: Get current URL parameters directly
    const urlParams = new URLSearchParams(window.location.search);
    const hasGclid = !!urlParams.get('gclid');
    const hasToken = !!urlParams.get('token');
    
    // Update service section buttons (NOT service selection cards)
    const afterHoursButtons = document.querySelectorAll('.after-hours-btn');
    const normalHoursButtons = document.querySelectorAll('.normal-hours-btn');
    const phoneLinks = document.querySelectorAll('.phone-link');
    
    console.log('🔍 Button visibility check:', {
        hasGclid: hasGclid,
        hasToken: hasToken,
        systemActive: EEK_STATE.systemActive
    });
    
    // PHONE NUMBERS LOGIC
    if (hasToken || hasGclid || EEK_STATE.systemActive) {
        // Show phone numbers if: Token OR GCLID OR system active
        phoneLinks.forEach(link => link.style.display = 'inline-block');
        console.log('📞 Phone numbers: SHOWN');
    } else {
        // Hide phone numbers only in basic mode when system inactive
        phoneLinks.forEach(link => link.style.display = 'none');
        console.log('📞 Phone numbers: HIDDEN (basic mode + system inactive)');
    }
    
    // BOOK ONLINE BUTTONS LOGIC (ONLY FOR BUTTONS IN SERVICE SECTIONS, NOT SERVICE CARDS)
    if (!hasToken && !hasGclid && !EEK_STATE.systemActive) {
        // Show book online buttons only in basic mode when system inactive
        afterHoursButtons.forEach(btn => {
            // CRITICAL: Check if this is a service selection card
            const isServiceCard = btn.closest('#service-selection');
            if (!isServiceCard) {
                btn.style.display = 'inline-block';
                
                // Only set booking URL for actual booking buttons (not service cards)
                const service = btn.dataset.service;
                if (service) {
                    btn.dataset.bookingUrl = `/book-service/?service=${service}`;
                    console.log('🔗 Set booking URL for booking button', service, ':', btn.dataset.bookingUrl);
                }
            } else {
                // CRITICAL: Service selection cards should NEVER have booking URLs
                btn.style.display = 'inline-block';
                
                // Aggressively remove any booking URLs from service cards
                delete btn.dataset.bookingUrl;
                btn.removeAttribute('data-booking-url');
                
                // Ensure href is only an anchor
                const href = btn.getAttribute('href');
                if (href && (href.includes('/book-service') || href.includes('book-'))) {
                    const service = btn.dataset.service;
                    if (service) {
                        btn.setAttribute('href', `#${service.replace('_', '-')}`);
                        console.log('🛠️ Fixed service card href from', href, 'to', btn.getAttribute('href'));
                    }
                }
                
                console.log('🎯 Service selection card visible WITHOUT booking URL - only anchor scrolling');
            }
        });
        normalHoursButtons.forEach(btn => btn.style.display = 'none');
        console.log('📅 Book online buttons: SHOWN (only for service sections, service cards excluded)');
    } else {
        // Hide book online buttons in all other cases
        afterHoursButtons.forEach(btn => btn.style.display = 'none');
        normalHoursButtons.forEach(btn => btn.style.display = 'inline-block');
        console.log('📅 Book online buttons: HIDDEN');
    }
    
    // STICKY BUTTON LOGIC
    if (hasToken) {
        // Token mode: show payment button only
        if (callButton) callButton.style.display = 'none';
        if (closedButton) closedButton.style.display = 'none';
        if (paymentButton) {
            paymentButton.style.display = 'block';
            paymentButton.style.backgroundColor = '#28a745';
        }
        console.log('💳 Sticky button: PAYMENT (token mode)');
        
    } else if (!hasGclid && !EEK_STATE.systemActive) {
        // Basic mode + system inactive: show View Hours button
        if (callButton) callButton.style.display = 'none';
        if (paymentButton) paymentButton.style.display = 'none';
        if (closedButton) closedButton.style.display = 'block';
        console.log('🕐 Sticky button: VIEW HOURS (basic mode + system inactive)');
        
    } else {
        // All other cases: show call button
        if (closedButton) closedButton.style.display = 'none';
        if (paymentButton) paymentButton.style.display = 'none';
        if (callButton) callButton.style.display = 'block';
        console.log('📞 Sticky button: CALL (GCLID mode or system active)');
    }
}

// === BODY STATE CLASS MANAGEMENT (FIXED) ===
function updateBodyStateClasses() {
    const body = document.body;
    
    // CRITICAL: Remove all payment-related classes first
    body.classList.remove('eek-has-payment-token', 'eek-no-payment-token');
    body.classList.remove('eek-has-gclid', 'eek-no-gclid');
    
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
    
    // FIXED: GCLID classes based on CURRENT URL only (not stored data)
    if (EEK_STATE.currentUrlGclid) {
        body.classList.add('eek-has-gclid');
        console.log('🔗 Added eek-has-gclid class for current URL GCLID');
    } else {
        body.classList.add('eek-no-gclid');
        console.log('🔗 Added eek-no-gclid class (no current URL GCLID)');
    }
    
    // Phone number type class
    const phoneType = getDisplayPhoneNumber() === EEK_CONFIG.PHONE_NUMBERS.tracking ? 'tracking' : 'default';
    body.classList.toggle('eek-phone-tracking', phoneType === 'tracking');
    body.classList.toggle('eek-phone-default', phoneType === 'default');
    
    console.log('📋 FIXED Body state classes updated:', {
        systemActive: EEK_STATE.systemActive,
        duringBusinessHours: EEK_STATE.duringBusinessHours,
        hasPaymentToken: EEK_STATE.hasPaymentToken,
        hasCurrentUrlGclid: !!EEK_STATE.currentUrlGclid,
        phoneType: phoneType
    });
}

// === FIXED: EVENT LISTENER ATTACHMENT ===
function addClickTrackingToElements() {
    // Add tracking to all elements with data-track attributes
    document.querySelectorAll('[data-track]').forEach(element => {
        element.addEventListener('click', function() {
            trackInteraction(this);
        });
    });
    
    // FIXED: Add tracking to phone links WITHOUT existing data-track attributes only
    document.querySelectorAll('a[href^="tel:"]').forEach(element => {
        // FIXED: Skip if element already has specific tracking
        if (element.dataset.track) {
            console.log('📞 Skipping phone link with existing tracking:', element.dataset.track);
            return; // Don't add generic tracking
        }
        
        // Only add generic tracking to untracked phone links
        element.dataset.track = 'phone_call';
        element.addEventListener('click', function() {
            trackInteraction(this);
        });
        console.log('📞 Added generic phone_call tracking to untracked phone link');
    });
    
    console.log('👂 Click tracking attached to all data-track elements and untracked phone links');
}

// === FIXED: SERVICE SELECTION HANDLERS (NO BOOKING REDIRECTS) ===
function handleServiceSelection() {
    document.querySelectorAll('.service-link').forEach(link => {
        // CRITICAL: Remove any existing booking URLs from service selection cards
        const isServiceCard = link.closest('#service-selection');
        if (isServiceCard) {
            // Force remove any booking URLs that might have been set
            delete link.dataset.bookingUrl;
            link.removeAttribute('data-booking-url');
            
            // Ensure href is only an anchor link
            const href = link.getAttribute('href');
            if (href && !href.startsWith('#')) {
                console.warn('🚨 Service card had non-anchor href:', href, 'fixing to anchor');
                // Extract service from data-service to create proper anchor
                const service = link.dataset.service;
                if (service) {
                    link.setAttribute('href', `#${service.replace('_', '-')}-service`);
                }
            }
        }
        
        link.addEventListener('click', function(e) {
            const service = this.dataset.service;
            const isServiceCardClick = this.closest('#service-selection');
            
            // Track the service interaction for analytics
            if (service) {
                trackInteraction(this);
                console.log('🎯 Service selection tracked for analytics:', service);
            }
            
            // CRITICAL: If this is a service selection card, prevent any redirects
            if (isServiceCardClick) {
                // Remove any booking URL that might exist
                delete this.dataset.bookingUrl;
                this.removeAttribute('data-booking-url');
                
                // Check if href is trying to redirect to booking page
                const href = this.getAttribute('href');
                if (href && (href.includes('/book-service') || href.includes('book'))) {
                    e.preventDefault();
                    console.log('🛑 Prevented service card redirect to booking page:', href);
                    
                    // Scroll to the appropriate service section instead
                    const targetSection = document.getElementById(service.replace('_', '-') + '-service') || 
                                         document.querySelector(`[id*="${service}"]`);
                    if (targetSection) {
                        targetSection.scrollIntoView({ behavior: 'smooth' });
                        console.log('📍 Manually scrolled to service section:', targetSection.id);
                    }
                    return false;
                }
                
                console.log('🎯 Service card clicked, allowing natural anchor scroll to:', href);
            } else {
                console.log('🔗 Non-service-card clicked, allowing normal behavior');
            }
        });
    });
    
    console.log('🎯 Service selection tracking configured (anchor scrolling only, booking redirects blocked)');
}

// === UTM DATA COLLECTION ===
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

// === INITIALIZATION (FIXED) ===
function initializePage() {
    console.log('🚀 Initializing Eek Mobile Mechanical page...');
    
    // Inject critical CSS styles first
    injectMasterStyles();
    
    // CRITICAL FIX: Reset payment and GCLID state before checking current page
    EEK_STATE.hasPaymentToken = false;
    EEK_STATE.currentUrlGclid = null;
    EEK_STATE.storedGclidForTracking = null;
    
    // Initialize tracking pixels
    initializeRedditPixel();
    
    // Detect and update logos (now properly async)
    detectAndUpdateLogo().catch(error => {
        console.error('❌ Error in logo detection:', error);
    });
    
    // FIXED: Initialize state with separated logic
    EEK_STATE.sessionId = getOrCreateSessionId();
    EEK_STATE.currentUrlGclid = getCurrentURLGCLID();           // For display decisions
    EEK_STATE.storedGclidForTracking = getStoredGCLIDForTracking(); // For tracking only
    EEK_STATE.utmData = getUTMData();
    EEK_STATE.hasPaymentToken = hasPaymentToken(); // Check current URL
    
    // Update UI with corrected state management
    updateUIState();
    
    // Set up tracking
    setupScrollTracking();
    setupTimeTracking(); // FIXED: Now has minimum time threshold
    addClickTrackingToElements(); // FIXED: No duplicate phone tracking
    
    // Set up service selection handlers (FIXED: no booking redirects)
    handleServiceSelection();
    
    // Track page view (sends to API + Google Analytics + Reddit Pixel)
    trackPageView();
    
    // NUCLEAR OPTION: Force hide banner if GCLID or token in URL
    setTimeout(forceHideBannerIfNeeded, 100);
    
    // NUCLEAR OPTION: Clean up service selection cards
    setTimeout(cleanUpServiceCards, 150);
    
    // FINAL SAFEGUARD: Double-check banner visibility after API calls complete
    setTimeout(finalBannerCheck, 2000);
    
    // FINAL SAFEGUARD: Ensure book online buttons have working URLs (only for non-service-cards)
    setTimeout(finalBookOnlineCheck, 2100);
    
    // PAYMENT HANDLER: Set up payment checkbox functionality
    setTimeout(setupPaymentCheckboxHandler, 200);
    
    console.log('✅ FIXED Page initialization complete');
    console.log('📊 FIXED Final State:', {
        sessionId: EEK_STATE.sessionId,
        currentUrlGclid: EEK_STATE.currentUrlGclid,
        storedGclidForTracking: EEK_STATE.storedGclidForTracking,
        hasPaymentToken: EEK_STATE.hasPaymentToken,
        phoneNumber: getDisplayPhoneNumber().display
    });
}

// === PAYMENT CHECKBOX HANDLER (FIXED) ===
function setupPaymentCheckboxHandler() {
    const termsCheckbox = document.querySelector('#stripePaymentBlock input[type="checkbox"]');
    const payNowButton = document.getElementById('payNowButton');
    
    if (termsCheckbox && payNowButton) {
        // Hide button initially
        payNowButton.classList.add('eek-hidden');
        payNowButton.style.display = 'none';
        
        // Remove any existing listeners
        const newCheckbox = termsCheckbox.cloneNode(true);
        termsCheckbox.parentNode.replaceChild(newCheckbox, termsCheckbox);
        
        newCheckbox.addEventListener('change', function() {
            console.log('💳 Terms checkbox changed:', this.checked);
            if (this.checked) {
                payNowButton.classList.remove('eek-hidden');
                payNowButton.classList.add('show-button');
                payNowButton.style.display = 'inline-block';
                console.log('💳 Pay Now button SHOWN');
            } else {
                payNowButton.classList.add('eek-hidden');
                payNowButton.classList.remove('show-button');
                payNowButton.style.display = 'none';
                console.log('💳 Pay Now button HIDDEN');
            }
        });
        
        // Set up pay button click handler
        const token = getPaymentToken();
        if (token) {
            payNowButton.addEventListener('click', function() {
                console.log('💳 Redirecting to Stripe checkout:', `https://buy.stripe.com/${token}`);
                window.location.href = `https://buy.stripe.com/${token}`;
            });
        }
        
        console.log('💳 Payment checkbox handler configured');
    }
}

// === NUCLEAR OPTION - CLEAN UP SERVICE CARDS ===
function cleanUpServiceCards() {
    console.log('🧹 Running nuclear cleanup of service selection cards...');
    
    // Find all service links within the service selection section
    const serviceCards = document.querySelectorAll('#service-selection .service-link');
    
    serviceCards.forEach((card, index) => {
        console.log(`  Cleaning service card ${index}:`, {
            href: card.getAttribute('href'),
            hasBookingUrl: !!card.dataset.bookingUrl,
            service: card.dataset.service
        });
        
        // Remove any booking URLs
        delete card.dataset.bookingUrl;
        card.removeAttribute('data-booking-url');
        
        // Fix href if it's not an anchor
        const href = card.getAttribute('href');
        const service = card.dataset.service;
        
        if (href && !href.startsWith('#')) {
            if (service) {
                // Create proper anchor based on the service sections in your HTML
                let anchorTarget = '';
                switch(service) {
                    case 'mechanic':
                        anchorTarget = '#mobile-mechanic-breakdown';
                        break;
                    case 'jumpstart':
                        anchorTarget = '#battery-jump-start';
                        break;
                    case 'fuel-extraction':
                        anchorTarget = '#wrong-fuel-removal';
                        break;
                    case 'inspection':
                        anchorTarget = '#pre-purchase-inspections';
                        break;
                    default:
                        anchorTarget = `#${service}`;
                }
                
                card.setAttribute('href', anchorTarget);
                console.log(`    ✅ Fixed href from "${href}" to "${anchorTarget}"`);
            }
        }
        
        // Remove any click handlers that might redirect
        const newCard = card.cloneNode(true);
        card.parentNode.replaceChild(newCard, card);
        
        // Re-add only our tracking handler
        newCard.addEventListener('click', function(e) {
            const service = this.dataset.service;
            if (service) {
                trackInteraction(this);
                console.log('🎯 Service selection tracked for analytics:', service);
            }
            
            // Just let the anchor behavior happen naturally
            console.log('🎯 Service card clicked, natural anchor behavior to:', this.getAttribute('href'));
        });
        
        console.log(`    ✅ Service card ${index} cleaned and tracking re-added`);
    });
    
    console.log('🧹 Service card cleanup complete');
}
function forceHideBannerIfNeeded() {
    const urlParams = new URLSearchParams(window.location.search);
    const hasGclid = !!urlParams.get('gclid');
    const hasToken = !!urlParams.get('token');
    const banner = document.getElementById('closedBanner');
    
    if ((hasGclid || hasToken) && banner) {
        banner.style.display = 'none';
        banner.style.visibility = 'hidden';
        banner.setAttribute('hidden', 'true');
        console.log('💀 NUCLEAR OPTION: Force hiding banner for GCLID/Token mode');
    } else if (!hasGclid && !hasToken && !EEK_STATE.systemActive && banner) {
        // Basic mode + system inactive: ensure banner is visible
        banner.style.display = 'block';
        banner.style.visibility = 'visible';
        banner.removeAttribute('hidden');
        console.log('💀 NUCLEAR OPTION: Force showing banner for basic mode + system inactive');
    }
}

// === FINAL BOOK ONLINE CHECK (FIXED - EXCLUDE SERVICE CARDS) ===
function finalBookOnlineCheck() {
    // Only check buttons that are NOT in the service selection section
    const afterHoursButtons = document.querySelectorAll('.after-hours-btn:not(#service-selection .after-hours-btn)');
    
    console.log('🔗 FINAL BOOK ONLINE CHECK: Found', afterHoursButtons.length, 'after-hours buttons (excluding service cards)');
    
    afterHoursButtons.forEach((btn, index) => {
        const service = btn.dataset.service;
        const bookingUrl = btn.dataset.bookingUrl;
        const isVisible = btn.style.display !== 'none';
        const isServiceCard = btn.closest('#service-selection');
        
        console.log(`  Button ${index}:`, {
            service: service,
            bookingUrl: bookingUrl,
            visible: isVisible,
            href: btn.getAttribute('href'),
            isServiceCard: !!isServiceCard
        });
        
        // Skip service cards - they should NOT have booking URLs
        if (isServiceCard) {
            console.log(`  ⏭️ Skipping service card (should only scroll to anchor)`);
            return;
        }
        
        // If button is visible but missing booking URL, fix it
        if (isVisible && service && !bookingUrl) {
            btn.dataset.bookingUrl = `/book-service/?service=${service}`;
            console.log(`  ✅ Fixed booking URL for ${service}:`, btn.dataset.bookingUrl);
        }
        
        // If button is visible but missing href, fix it  
        if (isVisible && service && !btn.getAttribute('href')) {
            btn.setAttribute('href', `#book-${service}`);
            console.log(`  ✅ Fixed href for ${service}:`, btn.getAttribute('href'));
        }
    });
}

// === FINAL SAFEGUARD - BANNER CHECK ===
function finalBannerCheck() {
    const urlParams = new URLSearchParams(window.location.search);
    const hasGclid = !!urlParams.get('gclid');
    const hasToken = !!urlParams.get('token');
    const banner = document.getElementById('closedBanner');
    
    if (!banner) return;
    
    console.log('🔍 FINAL BANNER CHECK:', {
        hasGclid: hasGclid,
        hasToken: hasToken,
        systemActive: EEK_STATE.systemActive,
        bannerCurrentlyVisible: banner.style.display !== 'none' && banner.style.visibility !== 'hidden'
    });
    
    // Basic mode + system inactive: banner should be visible
    if (!hasGclid && !hasToken && !EEK_STATE.systemActive) {
        if (banner.style.display === 'none' || banner.style.visibility === 'hidden') {
            banner.style.display = 'block';
            banner.style.visibility = 'visible';
            banner.removeAttribute('hidden');
            console.log('🚨 FINAL CHECK: Fixed missing banner in basic mode + system inactive');
        }
    }
    
    // GCLID/Token mode: banner should be hidden
    if ((hasGclid || hasToken) && (banner.style.display !== 'none' || banner.style.visibility !== 'hidden')) {
        banner.style.display = 'none';
        banner.style.visibility = 'hidden';
        banner.setAttribute('hidden', 'true');
        console.log('🚨 FINAL CHECK: Fixed visible banner in GCLID/Token mode');
    }
}

// === HELPER FUNCTIONS ===
function getServiceType(eventAction) {
    return EEK_CONFIG.SERVICE_TYPES[eventAction] || 'General Service';
}

// Enhanced tracking helper functions
function getGCLIDAgeInDays() {
    const timestamp = localStorage.getItem(EEK_CONFIG.STORAGE_KEYS.gclidTimestamp);
    if (!timestamp) return null;
    
    const gclidDate = new Date(timestamp);
    const now = new Date();
    return Math.floor((now - gclidDate) / (1000 * 60 * 60 * 24));
}

function isLocalStorageAvailable() {
    try {
        const test = 'localStorage-test';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        return false;
    }
}

function isSessionStorageAvailable() {
    try {
        const test = 'sessionStorage-test';
        sessionStorage.setItem(test, test);
        sessionStorage.removeItem(test);
        return true;
    } catch (e) {
        return false;
    }
}

function testThirdPartyCookies() {
    try {
        // Simple test for third-party cookie blocking
        document.cookie = "third-party-test=1; SameSite=None; Secure";
        const hasThirdPartyCookie = document.cookie.indexOf("third-party-test=1") !== -1;
        // Clean up
        document.cookie = "third-party-test=; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=None; Secure";
        return !hasThirdPartyCookie;
    } catch (e) {
        return true; // Assume blocked if error
    }
}

function getSessionStartTime() {
    const stored = localStorage.getItem('eek_session_start_time');
    if (stored) return parseInt(stored);
    
    const startTime = Date.now();
    localStorage.setItem('eek_session_start_time', startTime.toString());
    return startTime;
}

function getPageStartTime() {
    return performance.navigationStart || Date.now();
}

function getPreviousPage() {
    return localStorage.getItem('eek_previous_page') || null;
}

function getVisitCount() {
    const count = parseInt(localStorage.getItem('eek_visit_count') || '0') + 1;
    localStorage.setItem('eek_visit_count', count.toString());
    return count;
}

function getPageViewCount() {
    const count = parseInt(localStorage.getItem('eek_page_view_count') || '0') + 1;
    localStorage.setItem('eek_page_view_count', count.toString());
    return count;
}

// Additional conversion tracking helpers
function getClickedSection() {
    // Try to determine which section of the page the user clicked from
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    
    if (scrollY < windowHeight * 0.33) return 'above_fold';
    if (scrollY < windowHeight * 0.66) return 'middle_section';
    return 'below_fold';
}

function getVisibleElements() {
    const elements = {};
    
    // Check if key elements are visible
    const checkElement = (id, name) => {
        const el = document.getElementById(id);
        if (el) {
            const rect = el.getBoundingClientRect();
            elements[name] = rect.top < window.innerHeight && rect.bottom > 0;
        }
    };
    
    checkElement('service-selection', 'serviceSelection');
    checkElement('stripePaymentBlock', 'paymentBlock');
    checkElement('closedBanner', 'closedBanner');
    
    return elements;
}

function getFirstTouchAttribution() {
    return JSON.parse(localStorage.getItem('eek_first_touch') || 'null');
}

function getLastTouchAttribution() {
    const urlParams = new URLSearchParams(window.location.search);
    const currentAttribution = {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        referrer: document.referrer,
        utm_source: urlParams.get('utm_source'),
        utm_medium: urlParams.get('utm_medium'),
        utm_campaign: urlParams.get('utm_campaign'),
        gclid: urlParams.get('gclid')
    };
    
    // Store as last touch
    localStorage.setItem('eek_last_touch', JSON.stringify(currentAttribution));
    
    // Store as first touch if not exists
    if (!getFirstTouchAttribution()) {
        localStorage.setItem('eek_first_touch', JSON.stringify(currentAttribution));
    }
    
    return currentAttribution;
}

function getTouchpointCount() {
    const touchpoints = JSON.parse(localStorage.getItem('eek_touchpoints') || '[]');
    return touchpoints.length;
}

function getDaysSinceFirstVisit() {
    const firstVisit = localStorage.getItem(EEK_CONFIG.STORAGE_KEYS.firstVisitSent);
    if (!firstVisit) return 0;
    
    const firstDate = new Date(firstVisit);
    const now = new Date();
    return Math.floor((now - firstDate) / (1000 * 60 * 60 * 24));
}

function getSessionsSinceFirstVisit() {
    return parseInt(localStorage.getItem('eek_session_count') || '1');
}

function getFirstVisitPage() {
    return localStorage.getItem('eek_first_visit_page') || window.location.href;
}

function getPagesVisitedThisSession() {
    const pages = JSON.parse(sessionStorage.getItem('eek_session_pages') || '[]');
    if (!pages.includes(window.location.pathname)) {
        pages.push(window.location.pathname);
        sessionStorage.setItem('eek_session_pages', JSON.stringify(pages));
    }
    return pages;
}

function getInteractionCount() {
    return parseInt(sessionStorage.getItem('eek_interaction_count') || '0');
}

function incrementInteractionCount() {
    const count = getInteractionCount() + 1;
    sessionStorage.setItem('eek_interaction_count', count.toString());
    return count;
}

// Helper functions for interaction tracking
function getClickPosition(element) {
    try {
        const rect = element.getBoundingClientRect();
        return {
            top: rect.top,
            left: rect.left,
            bottom: rect.bottom,
            right: rect.right,
            width: rect.width,
            height: rect.height
        };
    } catch (e) {
        return null;
    }
}

function isElementVisible(element) {
    try {
        const rect = element.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.bottom > 0 && 
               rect.left < window.innerWidth && rect.right > 0;
    } catch (e) {
        return false;
    }
}

// === AUTO-INITIALIZE ON DOM CONTENT LOADED ===
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePage);
} else {
    initializePage();
}

// === BACKWARDS COMPATIBILITY WRAPPER ===
// This ensures any existing onclick handlers in HTML still work
window.trackConversionCompat = function(eventAction, eventCategory = 'Contact') {
    trackConversion(eventAction, eventCategory);
};

// === EXPORT FOR GLOBAL ACCESS ===
window.EEK_CONFIG = EEK_CONFIG;
window.EEK_STATE = EEK_STATE;
window.updateUIState = updateUIState;
window.updatePhoneNumbers = updatePhoneNumbers;
window.trackConversion = trackConversion;
window.trackConversionCompat = trackConversionCompat;
window.trackInteraction = trackInteraction;
window.trackPageView = trackPageView;
window.buildTrackingPayload = buildTrackingPayload;
window.sendTrackingEvent = sendTrackingEvent;
window.getLogoForPageType = getLogoForPageType;
window.detectAndUpdateLogo = detectAndUpdateLogo;
window.updateBodyStateClasses = updateBodyStateClasses;
window.handleServiceSelection = handleServiceSelection;
window.addClickTrackingToElements = addClickTrackingToElements;
window.getDisplayPhoneNumber = getDisplayPhoneNumber;
window.getCurrentURLGCLID = getCurrentURLGCLID;
window.getStoredGCLIDForTracking = getStoredGCLIDForTracking;

console.log('📊 FIXED Enhanced tracking configuration loaded - service selection now only scrolls to anchors for tracking');
